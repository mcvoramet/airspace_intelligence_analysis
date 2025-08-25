import L from 'leaflet';
import type { FlightPlan, Airport, Waypoint } from '../../types/flight.types';
import { LAYER_STYLES, FLIGHT_STATUS_COLORS, ICON_SIZES } from '../../utils/constants';
import { FlightPopupGenerator } from './FlightPopup';

export class FlightLayerManager {
    private map: L.Map;
    private flightPathsGroup: L.LayerGroup;
    private airportsGroup: L.LayerGroup;
    private waypointsGroup: L.LayerGroup;
    private aircraftGroup: L.LayerGroup;

    constructor(map: L.Map) {
        this.map = map;
        this.flightPathsGroup = L.layerGroup();
        this.airportsGroup = L.layerGroup();
        this.waypointsGroup = L.layerGroup();
        this.aircraftGroup = L.layerGroup();
    }

    addToMap(): void {
        this.flightPathsGroup.addTo(this.map);
        this.airportsGroup.addTo(this.map);
        this.waypointsGroup.addTo(this.map);
        this.aircraftGroup.addTo(this.map);
    }

    removeFromMap(): void {
        this.map.removeLayer(this.flightPathsGroup);
        this.map.removeLayer(this.airportsGroup);
        this.map.removeLayer(this.waypointsGroup);
        this.map.removeLayer(this.aircraftGroup);
    }

    clearFlightPaths(): void {
        this.flightPathsGroup.clearLayers();
        this.aircraftGroup.clearLayers();
    }

    clearAirports(): void {
        this.airportsGroup.clearLayers();
    }

    clearWaypoints(): void {
        this.waypointsGroup.clearLayers();
    }

    addFlightPath(flight: FlightPlan, onFlightClick?: (flight: FlightPlan) => void): void {
        // Create flight path polyline
        const pathCoordinates = flight.trajectory.map(point => 
            [point.coordinates[0], point.coordinates[1]] as [number, number]
        );

        const pathStyle = {
            ...LAYER_STYLES.flightPath,
            color: FLIGHT_STATUS_COLORS[flight.status] || LAYER_STYLES.flightPath.color
        };

        const flightPath = L.polyline(pathCoordinates, pathStyle);
        
        // Add popup to flight path
        FlightPopupGenerator.attachFlightPopup(
            { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} },
            flightPath,
            flight
        );

        // Add click handler
        if (onFlightClick) {
            flightPath.on('click', () => onFlightClick(flight));
        }

        this.flightPathsGroup.addLayer(flightPath);

        // Add aircraft icon at current position (first trajectory point for now)
        if (flight.trajectory.length > 0) {
            const currentPosition = flight.trajectory[0];
            const aircraftIcon = this.createAircraftIcon(flight);
            
            const aircraftMarker = L.marker(
                [currentPosition.coordinates[0], currentPosition.coordinates[1]],
                { icon: aircraftIcon }
            );

            FlightPopupGenerator.attachFlightPopup(
                { type: 'Feature', geometry: { type: 'Point', coordinates: [] }, properties: {} },
                aircraftMarker,
                flight
            );

            if (onFlightClick) {
                aircraftMarker.on('click', () => onFlightClick(flight));
            }

            this.aircraftGroup.addLayer(aircraftMarker);
        }
    }

    addAirport(airport: Airport, onAirportClick?: (airport: Airport, screenCoords: { x: number; y: number }) => void): void {
        const airportIcon = this.createAirportIcon(airport);
        const marker = L.marker(airport.coordinates, { icon: airportIcon });

        FlightPopupGenerator.attachAirportPopup(
            { type: 'Feature', geometry: { type: 'Point', coordinates: [] }, properties: {} },
            marker,
            airport
        );

        if (onAirportClick) {
            marker.on('click', (e) => {
                const screenCoords = this.map.latLngToContainerPoint(e.latlng);
                onAirportClick(airport, { x: screenCoords.x, y: screenCoords.y });
            });
        }

        this.airportsGroup.addLayer(marker);
    }

    addWaypoint(waypoint: Waypoint, onWaypointClick?: (waypoint: Waypoint, screenCoords: { x: number; y: number }) => void): void {
        const waypointIcon = this.createWaypointIcon(waypoint);
        const marker = L.marker(waypoint.coordinates, { icon: waypointIcon });

        FlightPopupGenerator.attachWaypointPopup(
            { type: 'Feature', geometry: { type: 'Point', coordinates: [] }, properties: {} },
            marker,
            waypoint
        );

        if (onWaypointClick) {
            marker.on('click', (e) => {
                const screenCoords = this.map.latLngToContainerPoint(e.latlng);
                onWaypointClick(waypoint, { x: screenCoords.x, y: screenCoords.y });
            });
        }

        this.waypointsGroup.addLayer(marker);
    }

    private createAircraftIcon(flight: FlightPlan): L.DivIcon {
        const statusColor = FLIGHT_STATUS_COLORS[flight.status] || '#0088ff';
        
        return L.divIcon({
            className: 'aircraft-icon',
            html: `
                <div style="
                    width: 24px; 
                    height: 24px; 
                    background-color: ${statusColor}; 
                    border: 2px solid white; 
                    border-radius: 50%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    font-size: 10px;
                    color: white;
                    font-weight: bold;
                ">✈</div>
                <div style="
                    position: absolute;
                    top: 26px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0,0,0,0.7);
                    color: white;
                    padding: 2px 4px;
                    border-radius: 3px;
                    font-size: 10px;
                    white-space: nowrap;
                ">${flight.callSign}</div>
            `,
            iconSize: [24, 40],
            iconAnchor: [12, 12]
        });
    }

    private createAirportIcon(airport: Airport): L.DivIcon {
        const utilizationColor = airport.capacity.utilizationPercentage > 80 ? '#dc2626' :
                                airport.capacity.utilizationPercentage > 60 ? '#ea580c' : '#059669';

        return L.divIcon({
            className: 'airport-icon',
            html: `
                <div style="
                    width: 36px;
                    height: 36px;
                    background: linear-gradient(135deg, ${utilizationColor}, ${utilizationColor}dd);
                    border: 3px solid white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    color: white;
                    font-weight: bold;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1);
                    cursor: pointer;
                    transition: transform 0.2s ease;
                " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">🛫</div>
                <div style="
                    position: absolute;
                    top: 40px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: linear-gradient(135deg, rgba(0,0,0,0.9), rgba(0,0,0,0.8));
                    color: white;
                    padding: 4px 8px;
                    border-radius: 8px;
                    font-size: 11px;
                    font-weight: 600;
                    white-space: nowrap;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                ">${airport.icaoCode}</div>
            `,
            iconSize: [36, 60],
            iconAnchor: [18, 18]
        });
    }

    private createWaypointIcon(waypoint: Waypoint): L.DivIcon {
        const typeColors = {
            fix: '#84cc16',
            vor: '#0ea5e9',
            ndb: '#f97316',
            airport: '#ec4899',
            intersection: '#8b5cf6',
            coordinate: '#6b7280'
        };

        const color = typeColors[waypoint.type] || '#6b7280';

        return L.divIcon({
            className: 'waypoint-icon',
            html: `
                <div style="
                    width: 20px;
                    height: 20px;
                    background: linear-gradient(135deg, ${color}, ${color}dd);
                    border: 2px solid white;
                    border-radius: 50%;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1);
                    cursor: pointer;
                    transition: transform 0.2s ease;
                " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'"></div>
                <div style="
                    position: absolute;
                    top: 24px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: linear-gradient(135deg, rgba(0,0,0,0.9), rgba(0,0,0,0.8));
                    color: white;
                    padding: 2px 6px;
                    border-radius: 6px;
                    font-size: 10px;
                    font-weight: 500;
                    white-space: nowrap;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                ">${waypoint.name}</div>
            `,
            iconSize: [20, 36],
            iconAnchor: [10, 10]
        });
    }

    destroy(): void {
        this.clearFlightPaths();
        this.clearAirports();
        this.clearWaypoints();
        this.removeFromMap();
    }
}
