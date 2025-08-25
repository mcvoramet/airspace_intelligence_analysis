import { useState, useEffect, useCallback } from "react";
import { WeatherDataService } from "../services/WeatherService";
import type { WeatherFeature } from "../types/weather.types";
import { MAP_CONFIG } from "../utils/constants";

export const useWeatherData = () => {
    const [sigmetFeatures, setSigmetFeatures] = useState<WeatherFeature[]>([]);
    const [airmetFeatures, setAirmetFeatures] = useState<WeatherFeature[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const weatherService = WeatherDataService.getInstance();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await weatherService.fetchWeatherData();
            const { sigmetFeatures, airmetFeatures } = weatherService.categorizeFeatures(data.features);

            setSigmetFeatures(sigmetFeatures);
            setAirmetFeatures(airmetFeatures);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Unknown error occurred');
            console.error('Error Hook useWeatherData: ', error);
        } finally {
            setLoading(false);
        }
    }, [weatherService]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, MAP_CONFIG.refreshInterval);
        return () => clearInterval(interval);
    }, [fetchData]);

    return {
        sigmetFeatures,
        airmetFeatures,
        loading,
        error,
        refetch: fetchData
    };
};
