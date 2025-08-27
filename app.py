"""Dash application for querying Microsoft SQL Server flight data and visualizing it."""

import os
from urllib.parse import urlencode, parse_qs
from datetime import datetime, timedelta

import pandas as pd
import dash
from dash import Dash, dcc, html, Input, Output, State, dash_table, ctx
import dash_bootstrap_components as dbc
import plotly.graph_objects as go

from utils.db import sql_query
from utils.geometry import (
    line_wkt_to_segments,
    wkt_to_points,
    decimate_points,
    polygon_wkt_to_geojson_feature,
)
from utils.time import floor_to_20
from utils.theme import THEME

# Performance knobs
MAX_TRAJ = int(os.getenv("MAX_TRAJ", "2000"))  # hard cap trajectories
SIMPLIFY_BASE_M = float(os.getenv("SIMPLIFY_BASE_M", "400"))  # meters per decimation unit
SIMPLIFY_TOL_DEG = float(os.getenv("SIMPLIFY_TOL_DEG", "0.0005"))
HOVER_MAX_FLIGHTS = int(os.getenv("HOVER_MAX_FLIGHTS", "30"))

# --- Layout height constants (in viewport height) ---
RIGHT_BAR_VH = 40
RIGHT_TABLE_VH = 45
MAP_VH = 79  # map height will match right column total

SQL_SECTORS = """
SELECT [Id], [Name], [LowerLimitFt], [UpperLimitFt], [Geography].STAsText() AS WKT
FROM [StaticAirspace]
ORDER BY [Name]
"""

# Fetch a single sector by Id (fresh geometry from DB)
SQL_SECTOR_BY_ID = """
SELECT TOP 1 [Id], [Name], [LowerLimitFt], [UpperLimitFt], [Geography].STAsText() AS WKT
FROM [StaticAirspace]
WHERE [Id] = ?
"""

SQL_TRAJ_BY_SECTOR = """
DECLARE @sectorId INT = ?;
DECLARE @startUtc DATETIME2 = ?;
DECLARE @endUtc   DATETIME2 = ?;
DECLARE @applyFL BIT = ?;        -- 0 = off, 1 = on
DECLARE @minFt   INT = ?;        -- lower flight level in feet
DECLARE @maxFt   INT = ?;        -- upper flight level in feet
DECLARE @maxRows INT = ?;        -- hard cap to protect UI
DECLARE @tolDeg  FLOAT = ?;      -- geometry simplification tolerance in degrees

WITH sector AS (
  SELECT [Geography] AS g
  FROM [StaticAirspace]
  WHERE [Id] = @sectorId
)
SELECT TOP (@maxRows)
  ft.[Id]               AS TrajectoryId,
  ft.[FlightId],
  ft.[FlightSourceId],
  ft.[StartTime],
  ft.[EndTime],
  ft.[AltitudeFt],
  ft.[Heading],
  ft.[SpeedKn],
  ft.[PositionLine].Reduce(@tolDeg).STAsText() AS WKT,
  -- Flight table details for rich hover
  f.[Callsign], f.[AirportDeparture], f.[AirportArrival],
  f.[FlightRule], f.[FlightType], f.[AircraftType], f.[WakeTurbulanceCategory],
  f.[REG], f.[LevelInitial], f.[SpeedInitial], f.[SID], f.[STAR],
  f.[RunwayDeparture], f.[RunwayArrival], f.[AirportAlternate], f.[Number],
  f.[SOBT], f.[EOBT], f.[STOT], f.[SLDT], f.[TimeFiling],
  f.[ETOT], f.[ELDT], f.[CTOT], f.[CLDT], f.[ATOT], f.[ALDT]
FROM [FlightTrajectory] ft
JOIN [Flight] f ON f.[Id] = ft.[FlightId]
CROSS JOIN sector s
WHERE ft.[IsActive] = 1
  AND ft.[StartTime] <  @endUtc
  AND ft.[EndTime]   >= @startUtc
  AND (f.[IsCancelled] = 0 OR f.[IsCancelled] IS NULL)
  AND ft.[PositionLine].STIntersects(s.g) = 1
  AND (
        @applyFL = 0 OR EXISTS (
            SELECT 1
            FROM STRING_SPLIT(ft.[AltitudeFt], ',') AS ss
            CROSS APPLY (SELECT TRY_CAST(ss.value AS INT) AS AltFt) AS a
            WHERE a.AltFt BETWEEN @minFt AND @maxFt
        )
  )
ORDER BY ft.[StartTime] ASC;
"""

# 4) APP & LAYOUT (Dark theme + Navbar + Offcanvas)
# =============================
app: Dash = dash.Dash(__name__, external_stylesheets=[THEME], suppress_callback_exceptions=True)
app.title = "ATFAS Trajectory & Demand"

# Fetch sectors once for dropdown options
sectors_df = sql_query(SQL_SECTORS)
sector_options = [
    {"label": f"{row['Name']} (FL{int(row['LowerLimitFt']/100)}–FL{int(row['UpperLimitFt']/100)})",
     "value": int(row['Id'])}
    for _, row in sectors_df.iterrows()
]

now = datetime.utcnow().replace(second=0, microsecond=0)
DEFAULT_START = (now - timedelta(hours=6)).isoformat() + "Z"
DEFAULT_END   = (now + timedelta(hours=6)).isoformat() + "Z"

navbar = dbc.Navbar(
    dbc.Container([
        dbc.NavbarBrand("ATFAS Trajectory & Demand", className="ms-2"),
        dbc.Nav([
            dbc.Button("Settings", id="open-settings", color="secondary", size="sm", className="me-2"),
            html.Span(id="status-text", className="text-muted"),
        ], className="ms-auto"),
    ], fluid=True),
    color="primary", dark=True, sticky="top"
)

controls_bar = dbc.Card(
    dbc.Row([
        dbc.Col([
            html.Small("Area Type", className="text-muted"),
            dcc.Dropdown(
                id="area-type",
                options=[
                    {"label": "Sector", "value": "sector"},
                    {"label": "Airport (TODO)", "value": "airport"},
                    {"label": "Waypoint (TODO)", "value": "waypoint"},
                ], value="sector", clearable=False
            ),
        ], md=2),
        dbc.Col([
            html.Small("Sector", className="text-muted"),
            dcc.Dropdown(id="sector-id", options=sector_options, value=sector_options[0]["value"] if sector_options else None),
        ], md=4),
        dbc.Col([
            html.Small("Start (UTC)", className="text-muted"),
            dcc.Input(id="start-utc", type="text", value=DEFAULT_START, style={"width": "100%"})
        ], md=3),
        dbc.Col([
            html.Small("End (UTC)", className="text-muted"),
            dcc.Input(id="end-utc", type="text", value=DEFAULT_END, style={"width": "100%"})
        ], md=3),
    ], className="g-2"), body=True, className="mt-3"
)

settings_offcanvas = dbc.Offcanvas(
    [
        html.H5("Display Settings", className="mb-3"),
        html.Label("Trace Mode"),
        dcc.RadioItems(
            id="trace-mode", inline=True,
            options=[{"label": "Lines", "value": "lines"}, {"label": "Markers", "value": "markers"}], value="lines"
        ),
        html.Br(),
        html.Label("Trace Decimation (keep 1 of N points)"),
        dcc.Slider(id="trace-decimation", min=1, max=50, step=1, value=8, marks={1:"1", 10:"10", 25:"25", 50:"50"}),
        html.Br(),
        html.Hr(),
        html.H5("Filters", className="mt-2"),
        dbc.Checklist(
            id="apply-fl",
            options=[{"label": "Apply Flight Level Filter", "value": "apply"}],
            value=[], switch=True
        ),
        html.Div([
            html.Label("Flight Level Range (FL)"),
            dcc.RangeSlider(id="fl-range", min=0, max=500, step=10, value=[290, 410],
                            marks={0:"FL0",100:"FL100",200:"FL200",300:"FL300",400:"FL400",500:"FL500"}),
        ], id="fl-controls"),
        html.Br(),
        html.Label("Columns (right panel)"),
        dcc.Slider(id="columns", min=1, max=3, step=1, value=2, marks={1:"1",2:"2",3:"3"}),
        html.Br(),
        html.Label("Interval (minutes) — fixed at 20"),
        dcc.Slider(id="interval-min", min=20, max=20, step=20, value=20, marks={20:"20"}, disabled=True),
        html.Br(),
        html.Label("Map Style"),
        dcc.Dropdown(id="map-style", value="carto-darkmatter", clearable=False,
                     options=[
                         {"label":"OpenStreetMap","value":"open-street-map"},
                         {"label":"Carto Positron","value":"carto-positron"},
                         {"label":"Carto Dark","value":"carto-darkmatter"},
                         {"label":"Stamen Terrain","value":"stamen-terrain"},
                     ]),
        ], id="settings", title="Settings", is_open=False, placement="end", scrollable=True
        )

# Map equals (bar + table)
map_graph = dcc.Graph(
    id="map-fig",
    style={"height": f"{MAP_VH}vh"},  # e.g., 84vh
    config={"displaylogo": False}
)

# Timeline controls (under the map)
play_button = dbc.Button("▶ Play", id="btn-play", color="info", size="sm", className="me-2")
now_label = html.Span(id="time-label", className="text-muted ms-2")

time_slider = dcc.Slider(
    id="time-slider",
    min=0,
    max=0,
    step=10,            # smoother stepping (10 s)
    value=0,
    marks={},
    updatemode="drag",
)

timer = dcc.Interval(id="timer", interval=300, disabled=True)  # ~3 ticks/sec for smoother motion  # 1s ticks when playing

# Timeline controls (under the map)
timeline = html.Div(
    [
        html.Div(
            [
                dbc.Button(
                    id="btn-play", children="▶ Play",
                    color="secondary", size="sm", outline=True,
                    style={"marginRight": "8px"}
                ),
                html.Span(id="time-label", className="text-muted ms-2"),
                dcc.Interval(id="timer", interval=1000, n_intervals=0, disabled=True),
            ],
            style={"display": "flex", "alignItems": "center", "marginBottom": "6px"}
        ),
        dcc.Slider(
            id="time-slider",
            min=0, max=0, step=10, value=0,
            updatemode="drag",
            tooltip={"always_visible": False},
        ),
    ],
    style={"marginTop": "8px"}
)


# Bar chart height
bar_graph = dcc.Graph(
    id="demand-bar",
    style={"height": f"{RIGHT_BAR_VH}vh"},  # e.g., 40vh
    config={"displaylogo": False}
)

flight_table = dash_table.DataTable(
    id="flight-table",
    columns=[
        {"name": "#", "id": "rownum"},                  # ✔ row number
        {"name": "Callsign", "id": "Callsign"},
        {"name": "Dep", "id": "AirportDeparture"},
        {"name": "Arr", "id": "AirportArrival"},
        {"name": "ETOT", "id": "ETOT"},
        {"name": "ELDT", "id": "ELDT"},
        {"name": "CTOT", "id": "CTOT"},
        {"name": "CLDT", "id": "CLDT"},
        {"name": "ATOT", "id": "ATOT"},
        {"name": "ALDT", "id": "ALDT"},
    ],
    # IMPORTANT: scrolling instead of paging
    page_action="none",
    fixed_rows={"headers": True},
    virtualization=True,  # improves performance for many rows

    data=[],
    style_table={
        "height": f"{RIGHT_TABLE_VH}vh",   # you already set RIGHT_TABLE_VH
        "overflowY": "auto",
        "border": "1px solid #2c2f36",
        "backgroundColor": "#0b0f17",
    },
    style_header={
        "backgroundColor": "#1f2937",
        "color": "#e5e7eb",
        "fontWeight": "600",
        "border": "1px solid #374151",
    },
    style_cell={
        "backgroundColor": "#0b0f17",
        "color": "#e5e7eb",
        "border": "1px solid #1f2937",
        "fontSize": 12,
        "padding": "6px",
        "whiteSpace": "nowrap",
        "textOverflow": "ellipsis",
        "maxWidth": 160,
    },
    style_data={
        "backgroundColor": "#0b0f17",
        "color": "#e5e7eb",
    },
    style_data_conditional=[
        {"if": {"state": "active"},   "backgroundColor": "#111827", "border": "1px solid #374151"},
        {"if": {"state": "selected"}, "backgroundColor": "#0f172a"},
        {"if": {"column_id": "Callsign"}, "fontWeight": "600"},
    ],
    css=[
        {"selector": ".dash-spreadsheet td, .dash-spreadsheet th",
         "rule": "background-color: #0b0f17 !important; color: #e5e7eb !important;"},
        {"selector": ".dash-table-container .row",
         "rule": "background-color: #0b0f17 !important;"},
    ],
    # NOTE: remove row_selectable to hide tick boxes
    tooltip_delay=0,
    tooltip_duration=None,
)

# Stores
store_flights = dcc.Store(id="store-flights")
store_sector = dcc.Store(id="store-sector-geojson")
store_bins = dcc.Store(id="store-interval-bins")
store_selected = dcc.Store(id="store-selected-flight")
store_sampled = dcc.Store(id="store-sampled")

# URL for query-state
url_loc = dcc.Location(id="url", refresh=False)

app.layout = dbc.Container([
    url_loc,
    navbar,
    controls_bar,
    settings_offcanvas,
    dbc.Row(
    [
        # Left column: map
        dbc.Col(
            [
                dcc.Loading(map_graph, type="dot", style={"height": "100%"}),
                timeline,  # <--- add this line
            ],
            md=7,
            style={"display": "flex", "flexDirection": "column"}
        ),


        # Right column: bar + table stacked to match MAP_VH
        dbc.Col(
            [
                dcc.Loading(bar_graph, type="dot", style={"height": f"{RIGHT_BAR_VH}vh"}),
                dcc.Loading(flight_table, type="dot")  # DataTable has its own height in style_table
            ],
            md=5,
            id="right-col",
            style={
                "display": "flex",
                "flexDirection": "column",
                "gap": "8px",               # small gap between bar and table
                "height": f"{MAP_VH}vh"     # right column total height == map height
            },
        ),
    ],
    className="mt-3 g-2",
    align="start",),
    store_flights, store_sector, store_bins, store_selected, store_sampled,
], fluid=True)

# =============================
# 5) URL <-> UI Sync
# =============================
@app.callback(
    Output("url", "search", allow_duplicate=True),
    Input("area-type", "value"),
    Input("sector-id", "value"),
    Input("start-utc", "value"),
    Input("end-utc", "value"),
    Input("trace-mode", "value"),
    Input("trace-decimation", "value"),
    Input("columns", "value"),
    prevent_initial_call=True,
)
def write_url(area, sector, start, end, mode, decim, cols):
    def is_valid(v):
        if v is None:
            return False
        s = str(v).strip().lower()
        return s not in ("none", "null", "nan", "")

    params = {
        "area": area,
        "start": start,
        "end": end,
        "mode": mode,
        "trace_decimation": int(decim or 8),
        "columns": int(cols or 2),
    }
    if is_valid(sector):
        try:
            params["sector"] = int(sector)
        except Exception:
            pass
    return "?" + urlencode(params)

@app.callback(
    Output("store-flights", "data"),
    Output("store-sector-geojson", "data"),
    Output("status-text", "children"),
    Input("sector-id", "value"),
    Input("start-utc", "value"),
    Input("end-utc", "value"),
    Input("apply-fl", "value"),
    Input("fl-range", "value"),
)
def fetch_data(sector_id, start_utc, end_utc, apply_fl, fl_range):
    if not sector_id:
        return [], None, "No sector selected"
    start_dt = datetime.fromisoformat(start_utc.replace("Z", ""))
    end_dt = datetime.fromisoformat(end_utc.replace("Z", ""))

    # Build sector overlay feature
    # Fresh sector geometry from DB (ensures latest + correct rings)
    secdf = sql_query(SQL_SECTOR_BY_ID, (int(sector_id),))
    if secdf.empty:
        return [], None, "Sector not found"
    sector_row = secdf.iloc[0]
    feature = polygon_wkt_to_geojson_feature(
        name=str(sector_row["Name"]), wkt=str(sector_row["WKT"]), props={"id": int(sector_row["Id"])},
    )

    # FL filter settings
    apply = 1 if (apply_fl and ("apply" in apply_fl)) else 0
    if fl_range and len(fl_range) == 2:
        min_ft = int(fl_range[0]) * 100
        max_ft = int(fl_range[1]) * 100
    else:
        min_ft, max_ft = 0, 99999

    # Geometry simplification tolerance: meters -> degrees (~111km per deg)
    # We read the current decimation from a Store via workaround (set in URL sync) or use default 8 if not available.
    # To keep this callback pure, we compute a moderate tolerance independent of zoom.
    decim = 8
    tol_m = max(50.0, SIMPLIFY_BASE_M * max(1, int(decim)))
    tol_deg = tol_m / 111_000.0

    # Query with optional FL EXISTS filter + server-side Reduce + TOP cap
    df = sql_query(SQL_TRAJ_BY_SECTOR, (int(sector_id), start_dt, end_dt, apply, min_ft, max_ft, MAX_TRAJ, SIMPLIFY_TOL_DEG))

    flights = []
    for _, r in df.iterrows():
        flights.append({
            "TrajectoryId": int(r["TrajectoryId"]),
            "FlightId": int(r["FlightId"]),
            "FlightSourceId": int(r["FlightSourceId"]) if pd.notna(r["FlightSourceId"]) else None,
            "Callsign": r.get("Callsign"),
            "AirportDeparture": r.get("AirportDeparture"),
            "AirportArrival": r.get("AirportArrival"),
            "FlightRule": r.get("FlightRule"),
            "FlightType": r.get("FlightType"),
            "AircraftType": r.get("AircraftType"),
            "WakeTurbulanceCategory": r.get("WakeTurbulanceCategory"),
            "REG": r.get("REG"),
            "LevelInitial": r.get("LevelInitial"),
            "SpeedInitial": r.get("SpeedInitial"),
            "SID": r.get("SID"),
            "STAR": r.get("STAR"),
            "RunwayDeparture": r.get("RunwayDeparture"),
            "RunwayArrival": r.get("RunwayArrival"),
            "AirportAlternate": r.get("AirportAlternate"),
            "Number": r.get("Number"),
            "SOBT": r["SOBT"].isoformat() if pd.notna(r.get("SOBT")) else None,
            "EOBT": r["EOBT"].isoformat() if pd.notna(r.get("EOBT")) else None,
            "STOT": r["STOT"].isoformat() if pd.notna(r.get("STOT")) else None,
            "SLDT": r["SLDT"].isoformat() if pd.notna(r.get("SLDT")) else None,
            "TimeFiling": r["TimeFiling"].isoformat() if pd.notna(r.get("TimeFiling")) else None,
            "ETOT": r["ETOT"].isoformat() if pd.notna(r.get("ETOT")) else None,
            "ELDT": r["ELDT"].isoformat() if pd.notna(r.get("ELDT")) else None,
            "CTOT": r["CTOT"].isoformat() if pd.notna(r.get("CTOT")) else None,
            "CLDT": r["CLDT"].isoformat() if pd.notna(r.get("CLDT")) else None,
            "ATOT": r["ATOT"].isoformat() if pd.notna(r.get("ATOT")) else None,
            "ALDT": r["ALDT"].isoformat() if pd.notna(r.get("ALDT")) else None,
            "StartTime": r["StartTime"].isoformat() if pd.notna(r["StartTime"]) else None,
            "EndTime": r["EndTime"].isoformat() if pd.notna(r["EndTime"]) else None,
            "WKT": r["WKT"],
            "AltitudeFt": r.get("AltitudeFt"),
            "SpeedKn": r.get("SpeedKn"),
            "Heading": r.get("Heading"),
            "RoutePortion": r.get("RoutePortion"),
        })

    status = f"Loaded {len(flights)} trajectories (cap {MAX_TRAJ})" + (f" | FL filter: FL{min_ft//100}–FL{max_ft//100}" if apply else "")
    return flights, {"type": "FeatureCollection", "features": [feature]}, status

@app.callback(
    Output("map-fig", "figure"),
    Output("store-interval-bins", "data"),
    Input("store-flights", "data"),
    Input("store-sector-geojson", "data"),
    Input("trace-mode", "value"),
    Input("trace-decimation", "value"),
    Input("map-style", "value"),
    State("interval-min", "value"),
    State("start-utc", "value"),
)
def update_map(flights, sector_fc, mode, decim, map_style, interval_min, start_utc):
    fig = go.Figure()
    fig.update_layout(mapbox_style=map_style, margin=dict(l=0, r=0, t=0, b=0), legend_orientation="h", uirevision="map")

    # Sector overlay
    if sector_fc and sector_fc.get("features"):
        fig.add_trace(go.Choroplethmapbox(
            geojson=sector_fc, locations=[0], z=[1], showscale=False,
            marker_opacity=0.18, marker_line_width=1, marker_line_color="#888",
            hovertemplate="Sector: %{properties.name}<extra></extra>", name="Sector"
        ))

    # 1) Build per-flight paths from all rows (handles Point or Line WKT)
    by_fid: dict[int, dict] = {}
    for r in (flights or []):
        fid = r.get("FlightId")
        if fid is None:
            continue

        d = by_fid.setdefault(fid, {
            "points": [],
            "Callsign": r.get("Callsign"),
            "ETOT": r.get("ETOT"), "ELDT": r.get("ELDT"),
            "CTOT": r.get("CTOT"), "CLDT": r.get("CLDT"),
            "ATOT": r.get("ATOT"), "ALDT": r.get("ALDT"),
            "StartTime": r.get("StartTime"),
            # NEW: keep airport codes (not coords)
            "AirportDeparture": None,
            "AirportArrival": None,
        })

        # Prefer first non-empty value we see
        if not d["AirportDeparture"] and r.get("AirportDeparture"):
            d["AirportDeparture"] = r.get("AirportDeparture")
        if not d["AirportArrival"] and r.get("AirportArrival"):
            d["AirportArrival"] = r.get("AirportArrival")

        pts = wkt_to_points(r.get("WKT"))
        d["points"].extend(pts)

        # keep earliest StartTime
        if r.get("StartTime") and (not d["StartTime"] or r["StartTime"] < d["StartTime"]):
            d["StartTime"] = r["StartTime"]

    # 2) Aggregate into a single trace
    lat_all, lon_all, text_all = [], [], []
    for fid, d in by_fid.items():
        pts = decimate_points(d["points"], int(decim or 1))
        if len(pts) < 2:
            continue
        name = d.get("Callsign") or f"FID {fid}"
        lats = [p[0] for p in pts]
        lons = [p[1] for p in pts]
        lat_all.extend(lats); lon_all.extend(lons)
        text_all.extend([f"{name}" ] * len(lats))
        # separator
        lat_all.append(None); lon_all.append(None); text_all.append(None)

    if lat_all:
        fig.add_trace(go.Scattermapbox(
            lat=lat_all, lon=lon_all, mode="lines",
            line=dict(width=1.5, color="#00D1FF"),
            name="Flights", hovertext=text_all, hoverinfo="text", showlegend=False,
        ))
        # Add persistent empty "Now" layer for smooth patch updates
        fig.add_trace(go.Scattermapbox(
            lat=[], lon=[], mode="markers",
            marker=dict(size=8, color="#FFD166"), name="Now", hoverinfo="text", showlegend=False,
        ))
        lat_num = [x for x in lat_all if isinstance(x, float)]
        lon_num = [x for x in lon_all if isinstance(x, float)]
        if lat_num and lon_num:
            fig.update_mapboxes(center=dict(lat=sum(lat_num)/len(lat_num), lon=sum(lon_num)/len(lon_num)), zoom=6)
    else:
        fig.update_mapboxes(center=dict(lat=13.75, lon=100.50), zoom=5)

    # 3) Build 20‑minute bins aligned to 00/20/40 based on earliest flight StartTime
    bins = []
    if by_fid:
        aligned_start = floor_to_20(datetime.fromisoformat(start_utc.replace("Z", "")))
        delta = timedelta(minutes=20)
        for fid, d in by_fid.items():
            st = datetime.fromisoformat(d["StartTime"]) if d.get("StartTime") else None
            if st and st >= aligned_start:
                idx = int(((st - aligned_start).total_seconds()) // delta.total_seconds())
                bins.append({
                    "FlightId": fid,
                    "Callsign": d.get("Callsign"),
                    "bin": idx,
                    # USE airport codes from Flight table
                    "AirportDeparture": d.get("AirportDeparture"),
                    "AirportArrival":  d.get("AirportArrival"),
                    "ETOT": d.get("ETOT"), "ELDT": d.get("ELDT"),
                    "CTOT": d.get("CTOT"), "CLDT": d.get("CLDT"),
                    "ATOT": d.get("ATOT"), "ALDT": d.get("ALDT"),
                })

    return fig, bins


# Build per-vertex samples with timestamps for animation
from bisect import bisect_right

@app.callback(
    Output("store-sampled", "data"),
    Input("store-flights", "data"),
    State("start-utc", "value"),
    State("end-utc", "value"),
)
def sample_points(flights, start_utc, end_utc):
    if not flights:
        return {"t0": start_utc, "t1": end_utc, "series": []}
    series = []
    by_fid: dict[int, dict] = {}
    # group rows by flight
    for r in flights:
        fid = r.get("FlightId")
        if fid is None:
            continue
        d = by_fid.setdefault(fid, {"name": r.get("Callsign") or f"FID {fid}", "pts": [], "ts": []})
        pts = wkt_to_points(r.get("WKT"))
        st = datetime.fromisoformat(r["StartTime"]) if r.get("StartTime") else None
        en = datetime.fromisoformat(r["EndTime"]) if r.get("EndTime") else None
        if not pts:
            continue
        if st and en and en > st:
            if len(pts) == 1:
                d["pts"].append(pts[0]); d["ts"].append(st.timestamp())
            else:
                step = (en - st) / (len(pts) - 1)
                for i, p in enumerate(pts):
                    d["pts"].append(p)
                    d["ts"].append((st + i*step).timestamp())
        else:
            # fallback: no times -> skip anim for this row
            for p in pts:
                d["pts"].append(p)
                d["ts"].append(None)

    for fid, d in by_fid.items():
        # sort by time (where available)
        order = list(range(len(d["pts"])))
        if any(t is not None for t in d["ts"]):
            order.sort(key=lambda i: (float('inf') if d["ts"][i] is None else d["ts"][i]))
        lat = [d["pts"][i][0] for i in order]
        lon = [d["pts"][i][1] for i in order]
        ts  = [d["ts"][i] for i in order]
        series.append({"fid": fid, "name": d["name"], "lat": lat, "lon": lon, "ts": ts})

    return {"t0": start_utc, "t1": end_utc, "series": series}


# Set slider bounds & marks from start/end
@app.callback(
    Output("time-slider", "min"),
    Output("time-slider", "max"),
    Output("time-slider", "value"),
    Output("time-slider", "marks"),
    Output("time-label", "children"),
    Input("start-utc", "value"),
    Input("end-utc", "value"),
)
def init_slider(start_utc, end_utc):
    if not start_utc or not end_utc:
        return 0, 0, 0, {}, ""
    st = datetime.fromisoformat(start_utc.replace("Z", ""))
    en = datetime.fromisoformat(end_utc.replace("Z", ""))
    vmin = int(st.timestamp())
    vmax = int(en.timestamp())
    # hourly marks
    marks = {}
    cur = st.replace(minute=0, second=0, microsecond=0)
    while cur <= en:
        marks[int(cur.timestamp())] = cur.strftime("%H:%M")
        cur += timedelta(hours=1)
    label = st.strftime("%Y-%m-%d %H:%M") + "Z"
    return vmin, vmax, vmin, marks, label


# Toggle play/pause
@app.callback(
    Output("timer", "disabled"),
    Output("btn-play", "children"),
    Input("btn-play", "n_clicks"),
    State("timer", "disabled"),
    prevent_initial_call=True,
)
def toggle_play(n, disabled):
    new_disabled = not disabled
    return new_disabled, ("▶ Play" if new_disabled else "⏸ Pause")


# Advance slider while playing (bounded)
@app.callback(
    Output("timeline-slider", "value"),
    Input("timer", "n_intervals"),
    State("timeline-slider", "value"),
    State("timeline-slider", "max"),
    prevent_initial_call=True,
)
def tick(_, val, mx):
    if mx is None:
        return val
    next_val = (val or 0) + 1
    return next_val if next_val <= mx else 0


# Update label and moving heads on the map (smooth via Patch)
from dash import Patch

@app.callback(
    Output("map-fig", "figure", allow_duplicate=True),
    Output("time-label", "children", allow_duplicate=True),
    Input("time-slider", "value"),
    State("map-fig", "figure"),
    State("store-sampled", "data"),
    prevent_initial_call=True,
)
def move_heads(tval, fig, sampled):
    if not fig or not sampled:
        return dash.no_update, dash.no_update

    # find the persistent "Now" trace index
    now_idx = None
    for i, tr in enumerate(fig.get("data", [])):
        if tr.get("name") == "Now" and tr.get("type") == "scattermapbox":
            now_idx = i
            break

    lat_now, lon_now, text = [], [], []
    series = sampled.get("series", [])
    for s in series:
        ts = s.get("ts") or []
        if not ts:
            continue
        idx = bisect_right(ts, tval) - 1
        if idx >= 0:
            lat_now.append(s["lat"][idx])
            lon_now.append(s["lon"][idx])
            text.append(s.get("name"))

    label = datetime.utcfromtimestamp(tval).strftime("%Y-%m-%d %H:%M") + "Z"

    # Smooth patch: update only the Now trace data
    if now_idx is not None:
        patch = Patch()
        patch["data"][now_idx]["lat"] = lat_now
        patch["data"][now_idx]["lon"] = lon_now
        patch["data"][now_idx]["hovertext"] = text
        return patch, label

    # Fallback: if Now doesn't exist yet, append it (rare)
    fig.setdefault("data", []).append(dict(
        type="scattermapbox", mode="markers", lat=lat_now, lon=lon_now,
        marker=dict(size=8, color="#FFD166"), name="Now", hoverinfo="text", showlegend=False
    ))
    return fig, label


@app.callback(
    Output("demand-bar", "figure"),
    Input("store-interval-bins", "data"),
    State("interval-min", "value"),
    State("start-utc", "value"),
    State("end-utc", "value"),
)
def update_bar(bins, interval_min, start_utc, end_utc):
    # 20-minute aligned bins (UTC)
    start_dt = floor_to_20(datetime.fromisoformat(start_utc.replace("Z", "")))
    end_dt_raw = datetime.fromisoformat(end_utc.replace("Z", ""))
    bin_size = timedelta(minutes=20)
    rem = (end_dt_raw - start_dt).total_seconds() % bin_size.total_seconds()
    end_dt = end_dt_raw if rem == 0 else (end_dt_raw + timedelta(seconds=(bin_size.total_seconds() - rem)))

    n_bins = max(1, int((end_dt - start_dt) / bin_size))
    labels = [(start_dt + i*bin_size).strftime("%Y-%m-%d %H:%M") for i in range(n_bins)]

    counts = [0] * n_bins
    if bins:
        for b in bins:
            idx = b.get("bin", -1)
            if 0 <= idx < n_bins:
                counts[idx] += 1

    fig = go.Figure(go.Bar(
        x=labels, y=counts,
        marker_line_width=0,
        hovertemplate="<b>%{x}Z</b><br>Flights: %{y}<extra></extra>",
        name="Demand"
    ))
    fig.update_layout(
        margin=dict(l=0, r=0, t=10, b=0),
        xaxis_title="Interval (UTC)",
        yaxis_title="Flights",
        template="plotly_dark",
        hovermode="x unified",
        hoverlabel=dict(bgcolor="#0b0f17", font_color="#e5e7eb"),
    )
    return fig


@app.callback(
    Output("flight-table", "data"),
    Output("flight-table", "style_data_conditional"),
    Input("demand-bar", "clickData"),
    State("store-interval-bins", "data"),
    prevent_initial_call=True,
)
def table_from_bar_click(clickData, bins):
    base_styles = [
        {"if": {"state": "active"},   "backgroundColor": "#111827", "border": "1px solid #374151"},
        {"if": {"state": "selected"}, "backgroundColor": "#0f172a"},
        {"if": {"column_id": "Callsign"}, "fontWeight": "600"},
    ]
    if not clickData or not bins:
        return [], base_styles

    idx = clickData["points"][0]["pointIndex"]
    rows_raw = [b for b in bins if b.get("bin") == idx]

    def pick(obj, *alts):
        for k in alts:
            v = obj.get(k)
            if v not in (None, "", "NaN"):
                return v
        return ""

    rows = []
    for i, b in enumerate(rows_raw, start=1):
        rows.append({
            "rownum": i,  # numbering column shown in table
            # keep FlightId in data for map highlight (not a visible column)
            "FlightId": b.get("FlightId"),
            "Callsign": b.get("Callsign") or b.get("Flight") or "",
            "AirportDeparture": pick(b, "AirportDeparture", "Dep", "Departure", "DepartureAirport"),
            "AirportArrival":  pick(b, "AirportArrival",  "Arr", "Arrival",   "ArrivalAirport"),
            "ETOT": b.get("ETOT"),
            "ELDT": b.get("ELDT"),
            "CTOT": b.get("CTOT"),
            "CLDT": b.get("CLDT"),
            "ATOT": b.get("ATOT"),
            "ALDT": b.get("ALDT"),
        })

    # Highlight all rows (they're all part of the clicked bin)
    highlight = base_styles + [
        {"if": {"row_index": i}, "backgroundColor": "#162036"} for i in range(len(rows))
    ]
    return rows, highlight


@app.callback(
    Output("store-selected-flight", "data"),
    Input("flight-table", "active_cell"),
    State("flight-table", "data"),
    prevent_initial_call=True,
)
def select_flight(active_cell, rows):
    if not active_cell or not rows:
        return None
    r = rows[active_cell["row"]]
    return r.get("FlightId")  # still present in row data



def _parse_csv_ints(s):
    if s is None or pd.isna(s):
        return []
    out = []
    for token in str(s).split(","):
        token = token.strip()
        try:
            out.append(int(float(token)))  # robust parse
        except Exception:
            out.append(None)
    return out

@app.callback(
    Output("map-fig", "figure", allow_duplicate=True),
    Input("store-selected-flight", "data"),
    State("map-fig", "figure"),
    State("store-flights", "data"),
    State("trace-mode", "value"),
    State("trace-decimation", "value"),
    prevent_initial_call=True,
)
def highlight_on_map(selected_fid, fig, flights, mode, decim):
    if not selected_fid or not fig:
        return dash.no_update

    # Remove any previous "Highlight" layer
    data = [tr for tr in fig.get("data", []) if tr.get("name") != "Highlight"]

    # Gather all segments for the selected flight
    lat_h, lon_h, hov = [], [], []
    routeportion = None

    for r in (flights or []):
        if r.get("FlightId") != selected_fid:
            continue

        pts = wkt_to_points(r.get("WKT"))
        if not pts:
            continue

        alts = _parse_csv_ints(r.get("AltitudeFt"))
        spds = _parse_csv_ints(r.get("SpeedKn"))
        # (headings available if you want them)
        # hdgs = _parse_csv_ints(r.get("Heading"))

        m = min(len(pts), len(alts) if alts else len(pts), len(spds) if spds else len(pts))
        if m == 0:
            continue

        pts   = pts[:m]
        alts  = (alts[:m] if alts else [None]*m)
        spds  = (spds[:m] if spds else [None]*m)
        routeportion = routeportion or (r.get("RoutePortion") or "")

        # Optional decimation (keep hover aligned)
        step = max(1, int(decim or 1))
        pts   = pts[::step]
        alts  = alts[::step]
        spds  = spds[::step]

        lat_h.extend([p[0] for p in pts])
        lon_h.extend([p[1] for p in pts])

        # Per-point hover text: FL + speed + route
        for a, s in zip(alts, spds):
            fl_txt = f"FL{a//100}" if isinstance(a, int) else "FL?"
            sp_txt = f"{s} kt" if isinstance(s, int) else "?"
            hov.append(f"<b>{fl_txt}</b> — {sp_txt}<br>Route: {routeportion}")

        # separator between multi-rows
        lat_h.append(None); lon_h.append(None); hov.append(None)

    if not any(isinstance(x, float) for x in lat_h):
        # nothing to draw; just return the original
        fig["data"] = data
        return fig

    data.append(go.Scattermapbox(
        lat=lat_h,
        lon=lon_h,
        mode="lines+markers",
        line=dict(width=3, color="#FF3B30"),        # <- RED line
        marker=dict(size=5, color="#FF3B30"),
        name="Highlight",
        hoverinfo="text",
        hovertext=hov,
        showlegend=False,
    ))
    fig["data"] = data
    return fig

from dash import no_update

@app.callback(
    Output("map-fig", "figure", allow_duplicate=True),
    Input("demand-bar", "clickData"),
    State("store-interval-bins", "data"),
    State("store-flights", "data"),
    State("trace-mode", "value"),
    State("trace-decimation", "value"),
    State("map-fig", "figure"),
    prevent_initial_call=True,
)
def filter_map_by_bar_click(clickData, bins, flights, mode, decim, fig):
    # If nothing clicked, don't touch the map
    if not clickData or not bins or not flights or not fig:
        return no_update

    # Which bin index was clicked?
    idx = clickData["points"][0]["pointIndex"]

    # Find flight IDs in that bin
    sel_ids = {
        b.get("FlightId") for b in bins
        if b and b.get("bin") == idx and b.get("FlightId") is not None
    }
    if not sel_ids:
        # Remove Flights/Highlight layers and leave sector/now layers visible
        fig["data"] = [tr for tr in (fig.get("data") or [])
                       if tr.get("name") not in ("Flights", "Highlight")]
        return fig

    # Rebuild the blue "Flights" layer for just the selected flights
    lat_all, lon_all, text_all = [], [], []
    dec = max(1, int(decim or 1))
    for r in (flights or []):
        fid = r.get("FlightId")
        if fid not in sel_ids:
            continue
        name = r.get("Callsign") or f"FID {fid}"
        pts = wkt_to_points(r.get("WKT"))
        pts = decimate_points(pts, dec)
        if len(pts) >= 2:
            lats = [p[0] for p in pts]
            lons = [p[1] for p in pts]
            lat_all.extend(lats + [None])   # None -> segment break
            lon_all.extend(lons + [None])
            text_all.extend([name] * len(lats) + [None])

    # Keep everything except previous Flights/Highlight, then add filtered Flights
    data_kept = [tr for tr in (fig.get("data") or [])
                 if tr.get("name") not in ("Flights", "Highlight")]

    if lat_all:
        data_kept.append(go.Scattermapbox(
            lat=lat_all, lon=lon_all,
            mode="lines" if (mode != "markers") else "lines+markers",
            line=dict(width=1.5, color="#00D1FF"),
            name="Flights",
            hovertext=text_all, hoverinfo="text",
            showlegend=False,
        ))

    fig["data"] = data_kept
    return fig


@app.callback(
    Output("settings", "is_open"),
    Input("open-settings", "n_clicks"),
    State("settings", "is_open"),
)
def toggle_settings(n, is_open):
    if n:
        return not is_open
    return is_open

@app.callback(
    Output("fl-controls", "style"),
    Input("apply-fl", "value"),
)
def toggle_fl_controls(val):
    if val and ("apply" in val):
        return {}
    return {"opacity": 0.5}

# =============================
# 7) MAIN
# =============================
if __name__ == "__main__":
    host = os.getenv("DASH_HOST", "0.0.0.0")
    port = int(os.getenv("DASH_PORT", "8050"))
    debug = os.getenv("DASH_DEBUG", "True").lower() == "true"
    app.run(host=host, port=port, debug=debug)
