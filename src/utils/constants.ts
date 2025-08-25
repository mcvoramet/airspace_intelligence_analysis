export const MAP_CONFIG = {
    center: [13.751648569129001, 100.50065116808389] as [number, number],
    zoom: 6,
    refreshInterval: 30 * 1000, // 30 seconds
    styles: {
        dark: {
            url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        },
        satellite: {
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        }
    }
};

export const LAYER_STYLES = {
    // Weather layers (from original system)
    sigmet: { color: '#ff4444', weight: 2.5, fillOpacity: 0.15 },
    airmet: { color: '#44ff44', weight: 2.5, fillOpacity: 0.15 },
    hover: { color: '#ff8800', weight: 3, fillOpacity: 0.2 },
    
    // Flight trajectory styles
    flightPath: { color: '#00aaff', weight: 3, opacity: 0.8 },
    flightPathActive: { color: '#ffaa00', weight: 4, opacity: 1.0 },
    flightPathSelected: { color: '#ff0088', weight: 5, opacity: 1.0 },
    
    // Airspace zone styles
    dangerArea: { color: '#ff0000', weight: 2, fillOpacity: 0.2, fillColor: '#ff0000' },
    restrictedArea: { color: '#ff6600', weight: 2, fillOpacity: 0.15, fillColor: '#ff6600' },
    militaryArea: { color: '#8800ff', weight: 2, fillOpacity: 0.2, fillColor: '#8800ff' },
    
    // Airport and waypoint styles
    airport: { 
        radius: 8, 
        fillColor: '#0088ff', 
        color: '#ffffff', 
        weight: 2, 
        opacity: 1, 
        fillOpacity: 0.8 
    },
    waypoint: { 
        radius: 5, 
        fillColor: '#88ff00', 
        color: '#ffffff', 
        weight: 1, 
        opacity: 1, 
        fillOpacity: 0.7 
    },
    
    // Sector boundaries
    sector: { color: '#666666', weight: 1, opacity: 0.5, fillOpacity: 0.05, dashArray: '5, 5' }
};

export const SEVERITY_COLORS = {
    info: '#0088ff',
    warning: '#ffaa00',
    danger: '#ff4400',
    critical: '#ff0000'
};

export const FLIGHT_STATUS_COLORS = {
    scheduled: '#888888',
    boarding: '#ffaa00',
    departed: '#00aa00',
    'en-route': '#0088ff',
    arrived: '#666666',
    delayed: '#ff6600',
    cancelled: '#ff0000'
};

export const AIRSPACE_TYPE_COLORS = {
    danger: '#ff0000',
    restricted: '#ff6600',
    military: '#8800ff',
    prohibited: '#cc0000',
    temporary: '#ff8800'
};

export const ICON_SIZES = {
    airport: {
        major: [32, 32],
        minor: [24, 24]
    },
    waypoint: [16, 16],
    aircraft: [24, 24]
};

export const Z_INDEX = {
    basemap: 1,
    sectors: 100,
    airspaceZones: 200,
    flightPaths: 300,
    weather: 400,
    airports: 500,
    waypoints: 450,
    aircraft: 600,
    hover: 700,
    selected: 800,
    popup: 900
};

export const FIR_NAME = {
    "HONIARA FIR": "SB",
    "NAURU FIR": "NR",
    "PORT MORESBY FIR": "PG",
    "COLOMBO FIR": "LK",
    "HONG KONG FIR": "HK",
    "MACAO FIR": "MO",
    "HO CHI MINH FIR": "VN",
    "HANOI FIR": "VN",
    "JAKARTA FIR": "ID",
    "KOTA KINABALU FIR": "MY",
    "KUALA LUMPUR FIR": "MY",
    "SINGAPORE FIR": "SG",
    "BRISBANE FIR": "AU",
    "MELBOURNE FIR": "AU",
    "AUCKLAND FIR": "NZ",
    "HONOLULU FIR": "US",
    "GUAM FIR": "US",
    "TOKYO FIR": "JP",
    "INCHEON FIR": "KR",
    "MANILA FIR": "PH",
    "BANGKOK FIR": "TH",
    "YANGON FIR": "MM",
    "BEIJING FIR": "CN",
    "GUANGZHOU FIR": "CN",
    "WUHAN FIR": "CN",
    "SANYA FIR": "CN",
    "LANZHOU FIR": "CN",
    "DALIAN FIR": "CN",
    "KUNMING FIR": "CN",
    "SHANGHAI FIR": "CN",
    "CHENGDU FIR": "CN",
    "HOHHOT FIR": "CN"
};
