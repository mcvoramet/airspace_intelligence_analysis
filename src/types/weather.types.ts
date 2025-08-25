// Re-export weather types from the original system
export interface WeatherProperties {
    cancelled: boolean;
    create_at: string;
    item_id: string;
    locations: string;
    types: string;
    valid_end: string;
    hazard: string;
    valid_start: string;
    lower: string;
    upper: string;
}

export interface WeatherFeature extends GeoJSON.Feature {
    properties: WeatherProperties;
}

export interface LayerVisibility {
    sigmetLayer: boolean;
    airmetLayer: boolean;
    flightLayer: boolean;
    dangerAreaLayer: boolean;
    restrictedAreaLayer: boolean;
    militaryAreaLayer: boolean;
    airportLayer: boolean;
    sectorLayer: boolean;
    waypointLayer: boolean;
}

export type WeatherType = 'sigmet' | 'airmet';

// Extended weather interfaces for airspace intelligence
export interface WeatherImpact {
    affectedFlights: string[]; // flight IDs
    affectedAirspace: string[]; // airspace zone IDs
    severity: 'low' | 'medium' | 'high' | 'severe';
    recommendedAction: string;
}

export interface WeatherAlert extends WeatherFeature {
    impact: WeatherImpact;
    issuedAt: string;
    updatedAt: string;
}
