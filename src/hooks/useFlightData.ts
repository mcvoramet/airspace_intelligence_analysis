import { useState, useEffect, useCallback } from 'react';
import { FlightDataService } from '../services/FlightDataService';
import type { FlightPlan, FlightFilter } from '../types/flight.types';
import { MAP_CONFIG } from '../utils/constants';

export const useFlightData = (filter?: FlightFilter) => {
    const [flightPlans, setFlightPlans] = useState<FlightPlan[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const flightService = FlightDataService.getInstance();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await flightService.fetchFlightPlans(filter);
            setFlightPlans(data);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Unknown error occurred');
            console.error('Error fetching flight data:', error);
        } finally {
            setLoading(false);
        }
    }, [flightService, filter]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, MAP_CONFIG.refreshInterval);
        return () => clearInterval(interval);
    }, [fetchData]);

    const getFlightById = useCallback(async (id: string) => {
        try {
            return await flightService.getFlightById(id);
        } catch (error) {
            console.error('Error fetching flight by ID:', error);
            return null;
        }
    }, [flightService]);

    const getActiveFlights = useCallback(async () => {
        try {
            return await flightService.getActiveFlights();
        } catch (error) {
            console.error('Error fetching active flights:', error);
            return [];
        }
    }, [flightService]);

    return {
        flightPlans,
        loading,
        error,
        refetch: fetchData,
        getFlightById,
        getActiveFlights
    };
};
