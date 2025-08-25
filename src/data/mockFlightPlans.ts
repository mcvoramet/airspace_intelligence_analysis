import type { FlightPlan, TrajectoryPoint } from '../types/flight.types';
import { mockAirports } from './mockAirports';
import { mockWaypoints } from './mockWaypoints';

const generateTrajectory = (departure: [number, number], destination: [number, number], waypoints: [number, number][]): TrajectoryPoint[] => {
  const points = [departure, ...waypoints, destination];
  const trajectory = [];
  const totalPoints = 50;
  
  for (let i = 0; i < totalPoints; i++) {
    const progress = i / (totalPoints - 1);
    const segmentIndex = Math.floor(progress * (points.length - 1));
    const segmentProgress = (progress * (points.length - 1)) - segmentIndex;
    
    if (segmentIndex >= points.length - 1) {
      trajectory.push({
        coordinates: points[points.length - 1],
        altitude: 35000 - (i * 100),
        timestamp: new Date(Date.now() + i * 60000).toISOString(),
        speed: 450,
        heading: 90
      });
    } else {
      const start = points[segmentIndex];
      const end = points[segmentIndex + 1];
      const lat = start[0] + (end[0] - start[0]) * segmentProgress;
      const lng = start[1] + (end[1] - start[1]) * segmentProgress;
      
      trajectory.push({
        coordinates: [lat, lng],
        altitude: 35000 - (i * 100),
        timestamp: new Date(Date.now() + i * 60000).toISOString(),
        speed: 450,
        heading: 90
      });
    }
  }
  
  return trajectory;
};

export const mockFlightPlans: FlightPlan[] = [
  {
    id: 'TG001',
    callSign: 'THA001',
    aircraftType: 'B777-300ER',
    departure: mockAirports[0], // VTBS
    destination: mockAirports[2], // VHHH
    takeOffTime: '2024-08-25T08:00:00Z',
    arrivalTime: '2024-08-25T11:30:00Z',
    estimatedTakeOffTime: '2024-08-25T08:05:00Z',
    estimatedArrivalTime: '2024-08-25T11:35:00Z',
    altitude: 35000,
    cruiseSpeed: 450,
    waypoints: [
      mockWaypoints.find(w => w.id === 'BOBAG')!,
      mockWaypoints.find(w => w.id === 'IGARI')!,
      mockWaypoints.find(w => w.id === 'ANOKO')!
    ],
    route: 'VTBS BOBAG IGARI ANOKO VHHH',
    status: 'en-route',
    trajectory: generateTrajectory(
      mockAirports[0].coordinates,
      mockAirports[2].coordinates,
      [
        mockWaypoints.find(w => w.id === 'BOBAG')!.coordinates,
        mockWaypoints.find(w => w.id === 'IGARI')!.coordinates,
        mockWaypoints.find(w => w.id === 'ANOKO')!.coordinates
      ]
    )
  },
  {
    id: 'SQ002',
    callSign: 'SIA002',
    aircraftType: 'A350-900',
    departure: mockAirports[3], // WSSS
    destination: mockAirports[0], // VTBS
    takeOffTime: '2024-08-25T09:15:00Z',
    arrivalTime: '2024-08-25T10:45:00Z',
    altitude: 37000,
    cruiseSpeed: 480,
    waypoints: [
      mockWaypoints.find(w => w.id === 'IGARI')!,
      mockWaypoints.find(w => w.id === 'BOBAG')!
    ],
    route: 'WSSS IGARI BOBAG VTBS',
    status: 'departed',
    trajectory: generateTrajectory(
      mockAirports[3].coordinates,
      mockAirports[0].coordinates,
      [
        mockWaypoints.find(w => w.id === 'IGARI')!.coordinates,
        mockWaypoints.find(w => w.id === 'BOBAG')!.coordinates
      ]
    )
  },
  {
    id: 'MH003',
    callSign: 'MAS003',
    aircraftType: 'A330-300',
    departure: mockAirports[4], // WMKK
    destination: mockAirports[5], // VVNB
    takeOffTime: '2024-08-25T10:30:00Z',
    arrivalTime: '2024-08-25T11:15:00Z',
    altitude: 33000,
    cruiseSpeed: 420,
    waypoints: [
      mockWaypoints.find(w => w.id === 'IGARI')!,
      mockWaypoints.find(w => w.id === 'BITOD')!
    ],
    route: 'WMKK IGARI BITOD VVNB',
    status: 'scheduled',
    trajectory: generateTrajectory(
      mockAirports[4].coordinates,
      mockAirports[5].coordinates,
      [
        mockWaypoints.find(w => w.id === 'IGARI')!.coordinates,
        mockWaypoints.find(w => w.id === 'BITOD')!.coordinates
      ]
    )
  },
  {
    id: 'JL004',
    callSign: 'JAL004',
    aircraftType: 'B787-9',
    departure: mockAirports[6], // RJTT
    destination: mockAirports[0], // VTBS
    takeOffTime: '2024-08-25T07:00:00Z',
    arrivalTime: '2024-08-25T12:30:00Z',
    altitude: 39000,
    cruiseSpeed: 490,
    waypoints: [
      mockWaypoints.find(w => w.id === 'ANOKO')!,
      mockWaypoints.find(w => w.id === 'IGARI')!,
      mockWaypoints.find(w => w.id === 'BOBAG')!
    ],
    route: 'RJTT ANOKO IGARI BOBAG VTBS',
    status: 'en-route',
    trajectory: generateTrajectory(
      mockAirports[6].coordinates,
      mockAirports[0].coordinates,
      [
        mockWaypoints.find(w => w.id === 'ANOKO')!.coordinates,
        mockWaypoints.find(w => w.id === 'IGARI')!.coordinates,
        mockWaypoints.find(w => w.id === 'BOBAG')!.coordinates
      ]
    )
  },
  {
    id: 'KE005',
    callSign: 'KAL005',
    aircraftType: 'A380-800',
    departure: mockAirports[7], // RKSI
    destination: mockAirports[3], // WSSS
    takeOffTime: '2024-08-25T11:00:00Z',
    arrivalTime: '2024-08-25T17:45:00Z',
    altitude: 41000,
    cruiseSpeed: 500,
    waypoints: [
      mockWaypoints.find(w => w.id === 'ANOKO')!,
      mockWaypoints.find(w => w.id === 'IGARI')!
    ],
    route: 'RKSI ANOKO IGARI WSSS',
    status: 'boarding',
    trajectory: generateTrajectory(
      mockAirports[7].coordinates,
      mockAirports[3].coordinates,
      [
        mockWaypoints.find(w => w.id === 'ANOKO')!.coordinates,
        mockWaypoints.find(w => w.id === 'IGARI')!.coordinates
      ]
    )
  }
];
