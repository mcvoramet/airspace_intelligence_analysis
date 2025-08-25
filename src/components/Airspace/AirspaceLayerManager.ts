import L from 'leaflet';
import type { AirspaceZone, DangerArea, RestrictedArea, MilitaryExerciseArea } from '../../types/airspace.types';
import type { Sector } from '../../types/flight.types';
import { LAYER_STYLES, AIRSPACE_TYPE_COLORS, SEVERITY_COLORS } from '../../utils/constants';
import { AirspacePopupGenerator } from './AirspacePopup';

export class AirspaceLayerManager {
    private map: L.Map;
    private dangerAreasGroup: L.LayerGroup;
    private restrictedAreasGroup: L.LayerGroup;
    private militaryAreasGroup: L.LayerGroup;
    private sectorsGroup: L.LayerGroup;

    constructor(map: L.Map) {
        this.map = map;
        this.dangerAreasGroup = L.layerGroup();
        this.restrictedAreasGroup = L.layerGroup();
        this.militaryAreasGroup = L.layerGroup();
        this.sectorsGroup = L.layerGroup();
    }

    addToMap(): void {
        this.dangerAreasGroup.addTo(this.map);
        this.restrictedAreasGroup.addTo(this.map);
        this.militaryAreasGroup.addTo(this.map);
        this.sectorsGroup.addTo(this.map);
    }

    removeFromMap(): void {
        this.map.removeLayer(this.dangerAreasGroup);
        this.map.removeLayer(this.restrictedAreasGroup);
        this.map.removeLayer(this.militaryAreasGroup);
        this.map.removeLayer(this.sectorsGroup);
    }

    clearDangerAreas(): void {
        this.dangerAreasGroup.clearLayers();
    }

    clearRestrictedAreas(): void {
        this.restrictedAreasGroup.clearLayers();
    }

    clearMilitaryAreas(): void {
        this.militaryAreasGroup.clearLayers();
    }

    clearSectors(): void {
        this.sectorsGroup.clearLayers();
    }

    addDangerArea(area: DangerArea, onAreaClick?: (area: DangerArea) => void): void {
        const style = {
            ...LAYER_STYLES.dangerArea,
            color: SEVERITY_COLORS[area.severity] || LAYER_STYLES.dangerArea.color,
            fillOpacity: area.isActive ? 0.3 : 0.1,
            opacity: area.isActive ? 1 : 0.5
        };

        const polygon = L.polygon(area.coordinates, style);
        
        AirspacePopupGenerator.attachAirspacePopup(
            { type: 'Feature', geometry: { type: 'Polygon', coordinates: [] }, properties: {} },
            polygon,
            area
        );

        if (onAreaClick) {
            polygon.on('click', () => onAreaClick(area));
        }

        // Add label
        const center = polygon.getBounds().getCenter();
        const label = this.createAirspaceLabel(area, center);
        
        this.dangerAreasGroup.addLayer(polygon);
        this.dangerAreasGroup.addLayer(label);
    }

    addRestrictedArea(area: RestrictedArea, onAreaClick?: (area: RestrictedArea) => void): void {
        const style = {
            ...LAYER_STYLES.restrictedArea,
            color: SEVERITY_COLORS[area.severity] || LAYER_STYLES.restrictedArea.color,
            fillOpacity: area.isActive ? 0.25 : 0.1,
            opacity: area.isActive ? 1 : 0.5
        };

        const polygon = L.polygon(area.coordinates, style);
        
        AirspacePopupGenerator.attachAirspacePopup(
            { type: 'Feature', geometry: { type: 'Polygon', coordinates: [] }, properties: {} },
            polygon,
            area
        );

        if (onAreaClick) {
            polygon.on('click', () => onAreaClick(area));
        }

        // Add label
        const center = polygon.getBounds().getCenter();
        const label = this.createAirspaceLabel(area, center);
        
        this.restrictedAreasGroup.addLayer(polygon);
        this.restrictedAreasGroup.addLayer(label);
    }

    addMilitaryArea(area: MilitaryExerciseArea, onAreaClick?: (area: MilitaryExerciseArea) => void): void {
        const style = {
            ...LAYER_STYLES.militaryArea,
            color: SEVERITY_COLORS[area.severity] || LAYER_STYLES.militaryArea.color,
            fillOpacity: area.isActive ? 0.3 : 0.1,
            opacity: area.isActive ? 1 : 0.5
        };

        const polygon = L.polygon(area.coordinates, style);
        
        AirspacePopupGenerator.attachAirspacePopup(
            { type: 'Feature', geometry: { type: 'Polygon', coordinates: [] }, properties: {} },
            polygon,
            area
        );

        if (onAreaClick) {
            polygon.on('click', () => onAreaClick(area));
        }

        // Add label
        const center = polygon.getBounds().getCenter();
        const label = this.createAirspaceLabel(area, center);
        
        this.militaryAreasGroup.addLayer(polygon);
        this.militaryAreasGroup.addLayer(label);
    }

    addSector(sector: Sector, onSectorClick?: (sector: Sector, screenCoords: { x: number; y: number }) => void): void {
        const utilizationColor = sector.utilizationPercentage > 80 ? '#ff4444' :
                               sector.utilizationPercentage > 60 ? '#ffaa00' : '#44aa44';

        const style = {
            ...LAYER_STYLES.sector,
            color: utilizationColor,
            fillColor: utilizationColor,
            fillOpacity: 0.1
        };

        const polygon = L.polygon(sector.boundaries, style);

        // Create sector popup
        const popupContent = `
            <div class="sector-popup">
                <div><strong>${sector.name}</strong></div>
                <div>Traffic: ${sector.currentTraffic}/${sector.controllerCapacity}</div>
                <div>Utilization: ${sector.utilizationPercentage}%</div>
                <div>Altitude: ${sector.altitudeLimits.lower}-${sector.altitudeLimits.upper} ft</div>
                <div class="click-hint">Click for detailed analysis</div>
            </div>
        `;
        polygon.bindPopup(popupContent, { maxWidth: 200 });

        if (onSectorClick) {
            polygon.on('click', (e) => {
                const screenCoords = this.map.latLngToContainerPoint(e.latlng);
                onSectorClick(sector, { x: screenCoords.x, y: screenCoords.y });
            });
        }

        // Add label
        const center = polygon.getBounds().getCenter();
        const label = L.marker(center, {
            icon: L.divIcon({
                className: 'sector-label',
                html: `
                    <div style="
                        background: rgba(0,0,0,0.7);
                        color: white;
                        padding: 2px 6px;
                        border-radius: 3px;
                        font-size: 11px;
                        white-space: nowrap;
                        border: 1px solid ${utilizationColor};
                    ">${sector.name.replace('Sector', 'SEC')}</div>
                `,
                iconSize: [100, 20],
                iconAnchor: [50, 10]
            }),
            interactive: false
        });
        
        this.sectorsGroup.addLayer(polygon);
        this.sectorsGroup.addLayer(label);
    }

    private createAirspaceLabel(zone: AirspaceZone, center: L.LatLng): L.Marker {
        const typeColor = AIRSPACE_TYPE_COLORS[zone.type] || '#888888';
        const severityColor = SEVERITY_COLORS[zone.severity] || '#888888';

        return L.marker(center, {
            icon: L.divIcon({
                className: 'airspace-label',
                html: `
                    <div style="
                        background: rgba(0,0,0,0.8);
                        color: white;
                        padding: 2px 6px;
                        border-radius: 3px;
                        font-size: 10px;
                        white-space: nowrap;
                        border: 2px solid ${zone.isActive ? severityColor : '#666666'};
                        ${zone.isActive ? '' : 'opacity: 0.7;'}
                    ">
                        ${zone.type.toUpperCase()}: ${zone.name}
                        ${zone.isActive ? ' (ACTIVE)' : ' (INACTIVE)'}
                    </div>
                `,
                iconSize: [150, 25],
                iconAnchor: [75, 12]
            }),
            interactive: false
        });
    }

    destroy(): void {
        this.clearDangerAreas();
        this.clearRestrictedAreas();
        this.clearMilitaryAreas();
        this.clearSectors();
        this.removeFromMap();
    }
}
