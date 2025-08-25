import type { 
  AirspaceZone, 
  DangerArea, 
  RestrictedArea, 
  MilitaryExerciseArea,
  AirspaceFilter 
} from '../types/airspace.types';
import { 
  mockDangerAreas, 
  mockRestrictedAreas, 
  mockMilitaryExerciseAreas 
} from '../data/mockAirspaceZones';

export class AirspaceDataService {
  private static instance: AirspaceDataService;

  public static getInstance(): AirspaceDataService {
    if (!AirspaceDataService.instance) {
      AirspaceDataService.instance = new AirspaceDataService();
    }
    return AirspaceDataService.instance;
  }

  async fetchDangerAreas(filter?: AirspaceFilter): Promise<DangerArea[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let filteredAreas = [...mockDangerAreas];

    if (filter) {
      if (filter.activeOnly) {
        filteredAreas = filteredAreas.filter(area => area.isActive);
      }

      if (filter.severityLevels && filter.severityLevels.length > 0) {
        filteredAreas = filteredAreas.filter(area => 
          filter.severityLevels!.includes(area.severity)
        );
      }

      if (filter.altitudeRange) {
        filteredAreas = filteredAreas.filter(area => 
          area.altitudeLimits.lower <= filter.altitudeRange!.max && 
          area.altitudeLimits.upper >= filter.altitudeRange!.min
        );
      }
    }

    return filteredAreas;
  }

  async fetchRestrictedAreas(filter?: AirspaceFilter): Promise<RestrictedArea[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let filteredAreas = [...mockRestrictedAreas];

    if (filter) {
      if (filter.activeOnly) {
        filteredAreas = filteredAreas.filter(area => area.isActive);
      }

      if (filter.severityLevels && filter.severityLevels.length > 0) {
        filteredAreas = filteredAreas.filter(area => 
          filter.severityLevels!.includes(area.severity)
        );
      }
    }

    return filteredAreas;
  }

  async fetchMilitaryExerciseAreas(filter?: AirspaceFilter): Promise<MilitaryExerciseArea[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let filteredAreas = [...mockMilitaryExerciseAreas];

    if (filter) {
      if (filter.activeOnly) {
        filteredAreas = filteredAreas.filter(area => area.isActive);
      }

      if (filter.timeRange) {
        const startTime = new Date(filter.timeRange.start);
        const endTime = new Date(filter.timeRange.end);
        
        filteredAreas = filteredAreas.filter(area => {
          const exerciseStart = new Date(area.scheduledStart);
          const exerciseEnd = new Date(area.scheduledEnd);
          
          return (exerciseStart <= endTime && exerciseEnd >= startTime);
        });
      }
    }

    return filteredAreas;
  }

  async getAllAirspaceZones(filter?: AirspaceFilter): Promise<AirspaceZone[]> {
    const [dangerAreas, restrictedAreas, militaryAreas] = await Promise.all([
      this.fetchDangerAreas(filter),
      this.fetchRestrictedAreas(filter),
      this.fetchMilitaryExerciseAreas(filter)
    ]);

    return [...dangerAreas, ...restrictedAreas, ...militaryAreas];
  }

  async getAirspaceZoneById(id: string): Promise<AirspaceZone | null> {
    const allZones = await this.getAllAirspaceZones();
    return allZones.find(zone => zone.id === id) || null;
  }

  isAirspaceActive(zone: AirspaceZone, currentTime: Date = new Date()): boolean {
    if (!zone.isActive) return false;

    if (zone.timeRestrictions && zone.timeRestrictions.length > 0) {
      return zone.timeRestrictions.some(restriction => {
        const currentDay = currentTime.getDay();
        const currentHour = currentTime.getHours();
        const currentMinute = currentTime.getMinutes();
        const currentTimeMinutes = currentHour * 60 + currentMinute;

        const [startHour, startMinute] = restriction.startTime.split(':').map(Number);
        const [endHour, endMinute] = restriction.endTime.split(':').map(Number);
        const startTimeMinutes = startHour * 60 + startMinute;
        const endTimeMinutes = endHour * 60 + endMinute;

        const isDayActive = restriction.daysOfWeek.includes(currentDay);
        const isTimeActive = currentTimeMinutes >= startTimeMinutes && 
                           currentTimeMinutes <= endTimeMinutes;

        return isDayActive && isTimeActive;
      });
    }

    return true;
  }
}
