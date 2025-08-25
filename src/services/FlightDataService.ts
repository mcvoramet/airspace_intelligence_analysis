import type { FlightPlan, FlightFilter } from '../types/flight.types';
import { mockFlightPlans } from '../data/mockFlightPlans';

export class FlightDataService {
  private static instance: FlightDataService;

  public static getInstance(): FlightDataService {
    if (!FlightDataService.instance) {
      FlightDataService.instance = new FlightDataService();
    }
    return FlightDataService.instance;
  }

  async fetchFlightPlans(filter?: FlightFilter): Promise<FlightPlan[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filteredFlights = [...mockFlightPlans];

    if (filter) {
      if (filter.status && filter.status.length > 0) {
        filteredFlights = filteredFlights.filter(flight => 
          filter.status!.includes(flight.status)
        );
      }

      if (filter.aircraftTypes && filter.aircraftTypes.length > 0) {
        filteredFlights = filteredFlights.filter(flight => 
          filter.aircraftTypes!.includes(flight.aircraftType)
        );
      }

      if (filter.altitudeRange) {
        filteredFlights = filteredFlights.filter(flight => 
          flight.altitude >= filter.altitudeRange!.min && 
          flight.altitude <= filter.altitudeRange!.max
        );
      }

      if (filter.timeRange) {
        const startTime = new Date(filter.timeRange.start);
        const endTime = new Date(filter.timeRange.end);
        
        filteredFlights = filteredFlights.filter(flight => {
          const takeOffTime = new Date(flight.takeOffTime);
          return takeOffTime >= startTime && takeOffTime <= endTime;
        });
      }
    }

    return filteredFlights;
  }

  async getFlightById(id: string): Promise<FlightPlan | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockFlightPlans.find(flight => flight.id === id) || null;
  }

  async getFlightsByRoute(route: string): Promise<FlightPlan[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockFlightPlans.filter(flight => 
      flight.route.toLowerCase().includes(route.toLowerCase())
    );
  }

  async getActiveFlights(): Promise<FlightPlan[]> {
    return this.fetchFlightPlans({
      status: ['departed', 'en-route', 'boarding']
    });
  }

  // Generate demand/capacity data for charts
  generateDemandCapacityData(elementId: string, elementType: 'airport' | 'sector' | 'waypoint') {
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = i.toString().padStart(2, '0');
      return `${hour}:00`;
    });

    return hours.map(hour => {
      const baseCapacity = elementType === 'airport' ? 50 : 
                          elementType === 'sector' ? 25 : 15;
      const variance = Math.random() * 0.3 + 0.7; // 70-100% variance
      const demand = Math.floor(baseCapacity * variance);
      
      return {
        time: hour,
        demand,
        capacity: baseCapacity,
        utilization: Math.round((demand / baseCapacity) * 100)
      };
    });
  }
}
