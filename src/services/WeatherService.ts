import type { WeatherFeature } from "../types/weather.types";

// Mock API endpoint - in production this would be the real weather service
const API_ENDPOINTS = {
    wfs: 'http://localhost/geoserver/weatherws/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=weatherws:fir_positions&outputFormat=application/json'
};

export class WeatherDataService {
    private static instance: WeatherDataService;

    public static getInstance(): WeatherDataService {
        if (!WeatherDataService.instance) {
            WeatherDataService.instance = new WeatherDataService();
        }
        return WeatherDataService.instance;
    }

    async fetchWeatherData(): Promise<{ features: WeatherFeature[] }> {
        try {
            // For now, return mock data since we don't have the actual weather service
            // In production, this would fetch from the real API
            return { features: [] };
            
            // Commented out real API call for now:
            // const response = await fetch(API_ENDPOINTS.wfs)
            // if (!response.ok) {
            //     throw new Error(`HTTP error status: ${response.status}`)
            // }
            // return await response.json();
        } catch (error) {
            console.error('Error fetching weather data:', error);
            // Return empty data instead of throwing to prevent app crashes
            return { features: [] };
        }
    }

    categorizeFeatures(features: WeatherFeature[]): {
        sigmetFeatures: WeatherFeature[];
        airmetFeatures: WeatherFeature[];
    } {
        const sigmetFeatures: WeatherFeature[] = [];
        const airmetFeatures: WeatherFeature[] = [];

        features.forEach(feature => {
            const type = feature.properties?.types?.toLowerCase();
            if (type?.includes('sigmet')) {
                sigmetFeatures.push(feature);
            } else if (type?.includes('airmet')) {
                airmetFeatures.push(feature);
            }
        });

        return { sigmetFeatures, airmetFeatures };
    }
}
