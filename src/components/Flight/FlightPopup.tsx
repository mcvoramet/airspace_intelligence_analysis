import type { FlightPlan, Airport, Waypoint } from '../../types/flight.types';
import { TimeCalculator } from '../../utils/timeUtils';

export class FlightPopupGenerator {
    static createFlightPopupContent(flight: FlightPlan): string {
        const duration = TimeCalculator.calculateFlightDuration(flight.takeOffTime, flight.arrivalTime);
        const takeOffTime = TimeCalculator.formatFlightTime(flight.takeOffTime);
        const arrivalTime = TimeCalculator.formatFlightTime(flight.arrivalTime);

        return `
            <div class="flight-popup">
                <div><strong>${flight.callSign}</strong> (${flight.id})</div>
                <div>Aircraft: ${flight.aircraftType}</div>
                <div>Status: <span class="status-${flight.status}">${flight.status.toUpperCase()}</span></div>
                <div>Route: ${flight.departure.icaoCode} → ${flight.destination.icaoCode}</div>
                <div>Departure: ${takeOffTime} (${flight.departure.name})</div>
                <div>Arrival: ${arrivalTime} (${flight.destination.name})</div>
                <div>Duration: ${duration}</div>
                <div>Altitude: ${flight.altitude.toLocaleString()} ft</div>
                <div>Speed: ${flight.cruiseSpeed} kts</div>
                <div>Waypoints: ${flight.waypoints.length}</div>
            </div>
        `;
    }

    static createAirportPopupContent(airport: Airport): string {
        return `
            <div class="airport-popup">
                <div><strong>${airport.name}</strong></div>
                <div>${airport.icaoCode} / ${airport.iataCode}</div>
                <div>Country: ${airport.country}</div>
                <div>Elevation: ${airport.elevation} ft</div>
                <div>Capacity: ${airport.capacity.totalHourly}/hour</div>
                <div>Current Demand: ${airport.capacity.currentDemand}</div>
                <div>Utilization: ${airport.capacity.utilizationPercentage}%</div>
                <div class="click-hint">Click for detailed charts</div>
            </div>
        `;
    }

    static createWaypointPopupContent(waypoint: Waypoint): string {
        return `
            <div class="waypoint-popup">
                <div><strong>${waypoint.name}</strong></div>
                <div>Type: ${waypoint.type.toUpperCase()}</div>
                <div>Coordinates: ${waypoint.coordinates[0].toFixed(4)}, ${waypoint.coordinates[1].toFixed(4)}</div>
                ${waypoint.altitude ? `<div>Altitude: ${waypoint.altitude} ft</div>` : ''}
                <div class="click-hint">Click for traffic analysis</div>
            </div>
        `;
    }

    static attachFlightPopup(feature: GeoJSON.Feature, layer: L.Layer, flight: FlightPlan): void {
        const popupContent = FlightPopupGenerator.createFlightPopupContent(flight);
        layer.bindPopup(popupContent, { maxWidth: 250 });
    }

    static attachAirportPopup(feature: GeoJSON.Feature, layer: L.Layer, airport: Airport): void {
        const popupContent = FlightPopupGenerator.createAirportPopupContent(airport);
        layer.bindPopup(popupContent, { maxWidth: 250 });
    }

    static attachWaypointPopup(feature: GeoJSON.Feature, layer: L.Layer, waypoint: Waypoint): void {
        const popupContent = FlightPopupGenerator.createWaypointPopupContent(waypoint);
        layer.bindPopup(popupContent, { maxWidth: 200 });
    }
}
