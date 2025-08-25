import { useState, useEffect, useCallback } from 'react';
import { AirspaceDataService } from '../services/AirspaceDataService';
import type { 
    DangerArea, 
    RestrictedArea, 
    MilitaryExerciseArea, 
    AirspaceZone,
    AirspaceFilter 
} from '../types/airspace.types';
import { MAP_CONFIG } from '../utils/constants';

export const useAirspaceData = (filter?: AirspaceFilter) => {
    const [dangerAreas, setDangerAreas] = useState<DangerArea[]>([]);
    const [restrictedAreas, setRestrictedAreas] = useState<RestrictedArea[]>([]);
    const [militaryAreas, setMilitaryAreas] = useState<MilitaryExerciseArea[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const airspaceService = AirspaceDataService.getInstance();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [dangerData, restrictedData, militaryData] = await Promise.all([
                airspaceService.fetchDangerAreas(filter),
                airspaceService.fetchRestrictedAreas(filter),
                airspaceService.fetchMilitaryExerciseAreas(filter)
            ]);

            setDangerAreas(dangerData);
            setRestrictedAreas(restrictedData);
            setMilitaryAreas(militaryData);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Unknown error occurred');
            console.error('Error fetching airspace data:', error);
        } finally {
            setLoading(false);
        }
    }, [airspaceService, filter]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, MAP_CONFIG.refreshInterval);
        return () => clearInterval(interval);
    }, [fetchData]);

    const getAllAirspaceZones = useCallback((): AirspaceZone[] => {
        return [...dangerAreas, ...restrictedAreas, ...militaryAreas];
    }, [dangerAreas, restrictedAreas, militaryAreas]);

    const getAirspaceZoneById = useCallback(async (id: string) => {
        try {
            return await airspaceService.getAirspaceZoneById(id);
        } catch (error) {
            console.error('Error fetching airspace zone by ID:', error);
            return null;
        }
    }, [airspaceService]);

    const isAirspaceActive = useCallback((zone: AirspaceZone, currentTime?: Date) => {
        return airspaceService.isAirspaceActive(zone, currentTime);
    }, [airspaceService]);

    return {
        dangerAreas,
        restrictedAreas,
        militaryAreas,
        allAirspaceZones: getAllAirspaceZones(),
        loading,
        error,
        refetch: fetchData,
        getAirspaceZoneById,
        isAirspaceActive
    };
};
