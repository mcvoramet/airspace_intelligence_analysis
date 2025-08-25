import L from 'leaflet';
import type { WeatherFeature, WeatherType } from '../../types/weather.types';

export class WeatherLabelManager {
    private labelGroup: L.LayerGroup;
    private map: L.Map;

    constructor(map: L.Map) {
        this.map = map;
        this.labelGroup = L.layerGroup().addTo(map);
    }

    private createLabel(feature: WeatherFeature, center: L.LatLng, type: WeatherType): L.Marker {
        const hazard = feature.properties?.hazard;
        const featureType = feature.properties?.types;
        const fallbackText = type === 'sigmet' ? 'SIG_Null' : 'AIR_Null';

        const labelText = hazard || featureType || fallbackText;

        return L.marker(center, {
            icon: L.divIcon({
                className: 'fir-label',
                html: `<span>${labelText}</span>`
            }),
            interactive: false
        });
    }

    addLabels(layer: L.GeoJSON, type: WeatherType): void {
        this.clearLabels();

        layer.eachLayer(layerFeature => {
            const center = (layerFeature as L.GeoJSON).getBounds().getCenter();
            const feature = (layerFeature as L.GeoJSON).feature as WeatherFeature;

            const marker = this.createLabel(feature, center, type);
            this.labelGroup.addLayer(marker);
        });
    }

    clearLabels(): void {
        this.labelGroup.clearLayers();
    }

    destroy(): void {
        this.labelGroup.remove();
    }
}
