import type { WeatherProperties } from "../../types/weather.types";
import { TimeCalculator } from "../../utils/timeUtils";

export class WeatherPopupGenerator {
    static createPopupContent(properties: WeatherProperties): string {
        return `
            <div><strong>SIGMET: ${properties.types}</strong></div>
            <div>FIR Name: ${properties.locations}</div>
            <div>Hazard: ${properties.hazard}</div>
            <div>Begins: ${properties.valid_start}</div>
            <div>Ends: ${properties.valid_end}</div>
            <div>Time Remaining: ${TimeCalculator.calculateTimeRemaining(properties.valid_end)}</div>
            <div>Lower: ${properties.lower}</div>
            <div>Upper: ${properties.upper}</div>
        `;
    }

    static attachPopup(feature: GeoJSON.Feature, layer: L.Layer): void {
        const properties = feature.properties as WeatherProperties;
        const popupContent = WeatherPopupGenerator.createPopupContent(properties);

        layer.bindPopup(popupContent, { maxWidth: 200 });
    }
}
