"""Geometry helper functions used by the Dash application."""

from __future__ import annotations

from typing import Iterable

from shapely import wkt as shapely_wkt
from shapely.geometry import LineString, MultiLineString, Polygon, MultiPolygon, Point


def _linestring_to_latlon_lists(geom: LineString) -> tuple[list, list]:
    """Extract latitude and longitude lists from a LineString geometry."""
    lats, lons = [], []
    for x, y in geom.coords:  # (lon, lat)
        lons.append(x)
        lats.append(y)
    return lats, lons


def line_wkt_to_segments(wkt: str, decimation: int = 1) -> list[tuple[list, list]]:
    """Return decimated line segments for the given WKT geometry."""
    if not wkt:
        return []
    geom = shapely_wkt.loads(wkt)
    segments: list[tuple[list, list]] = []

    def decimate_xy(lat_list: list, lon_list: list, n: int) -> tuple[list, list]:
        if n <= 1:
            return lat_list, lon_list
        return lat_list[::n], lon_list[::n]

    if isinstance(geom, Point):
        lats, lons = [geom.y], [geom.x]
        segments.append(decimate_xy(lats, lons, max(1, decimation)))
    elif isinstance(geom, LineString):
        lats, lons = _linestring_to_latlon_lists(geom)
        segments.append(decimate_xy(lats, lons, max(1, decimation)))
    elif isinstance(geom, MultiLineString):
        for ls in geom.geoms:
            lats, lons = _linestring_to_latlon_lists(ls)
            segments.append(decimate_xy(lats, lons, max(1, decimation)))
    return segments


def wkt_to_points(wkt: str) -> list[tuple[float, float]]:
    """Flatten WKT to a list of ``(lat, lon)`` tuples."""
    if not wkt:
        return []
    g = shapely_wkt.loads(wkt)
    pts: list[tuple[float, float]] = []
    if isinstance(g, Point):
        pts.append((g.y, g.x))
    elif isinstance(g, LineString):
        for x, y in g.coords:
            pts.append((y, x))
    elif isinstance(g, MultiLineString):
        for ls in g.geoms:
            for x, y in ls.coords:
                pts.append((y, x))
    return pts


def decimate_points(points: Iterable[tuple[float, float]], n: int) -> list[tuple[float, float]]:
    """Return every N-th point from the provided iterable."""
    n = max(1, int(n or 1))
    return list(points)[::n]


def polygon_wkt_to_geojson_feature(name: str, wkt: str, props: dict | None = None) -> dict:
    """Convert WKT polygon or multipolygon to a GeoJSON Feature."""
    geom = shapely_wkt.loads(wkt)
    props = props or {}

    def rings_for_polygon(poly: Polygon) -> list[list[list[float]]]:
        sx, sy = poly.exterior.coords.xy
        shell = [[float(x), float(y)] for x, y in zip(sx, sy)]
        holes = []
        for interior in poly.interiors:
            ix, iy = interior.coords.xy
            holes.append([[float(x), float(y)] for x, y in zip(ix, iy)])
        return [shell] + holes

    if isinstance(geom, Polygon):
        coords = rings_for_polygon(geom)
        geometry = {"type": "Polygon", "coordinates": coords}
        return {"type": "Feature", "properties": {"name": name, **props}, "geometry": geometry}
    if isinstance(geom, MultiPolygon):
        multi = [rings_for_polygon(p) for p in geom.geoms]
        geometry = {"type": "MultiPolygon", "coordinates": multi}
        return {"type": "Feature", "properties": {"name": name, **props}, "geometry": geometry}
    return {"type": "Feature", "properties": {"name": name, **props}, "geometry": None}
