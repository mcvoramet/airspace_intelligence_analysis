export interface FlightPlan {
  id: string;
  callSign: string;
  aircraftType: string;
  departure: Airport;
  destination: Airport;
  takeOffTime: string;
  arrivalTime: string;
  estimatedTakeOffTime?: string;
  estimatedArrivalTime?: string;
  altitude: number;
  cruiseSpeed: number;
  waypoints: Waypoint[];
  route: string;
  status: FlightStatus;
  trajectory: TrajectoryPoint[];
}

export interface Airport {
  icaoCode: string;
  iataCode: string;
  name: string;
  coordinates: [number, number]; // [lat, lng]
  elevation: number;
  timezone: string;
  country: string;
  capacity: AirportCapacity;
}

export interface Waypoint {
  id: string;
  name: string;
  coordinates: [number, number]; // [lat, lng]
  type: WaypointType;
  altitude?: number;
  estimatedTime?: string;
}

export interface TrajectoryPoint {
  coordinates: [number, number]; // [lat, lng]
  altitude: number;
  timestamp: string;
  speed: number;
  heading: number;
}

export interface AirportCapacity {
  hourlyDepartures: number;
  hourlyArrivals: number;
  totalHourly: number;
  currentDemand: number;
  utilizationPercentage: number;
}

export interface Sector {
  id: string;
  name: string;
  boundaries: [number, number][]; // polygon coordinates
  controllerCapacity: number;
  currentTraffic: number;
  utilizationPercentage: number;
  altitudeLimits: {
    lower: number;
    upper: number;
  };
}

export type FlightStatus = 
  | 'scheduled' 
  | 'boarding' 
  | 'departed' 
  | 'en-route' 
  | 'arrived' 
  | 'delayed' 
  | 'cancelled';

export type WaypointType = 
  | 'fix' 
  | 'vor' 
  | 'ndb' 
  | 'airport' 
  | 'intersection' 
  | 'coordinate';

export interface FlightFilter {
  status?: FlightStatus[];
  airlines?: string[];
  aircraftTypes?: string[];
  altitudeRange?: {
    min: number;
    max: number;
  };
  timeRange?: {
    start: string;
    end: string;
  };
  routes?: string[];
}
