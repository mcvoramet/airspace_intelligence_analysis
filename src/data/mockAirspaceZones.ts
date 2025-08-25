import type { DangerArea, RestrictedArea, MilitaryExerciseArea } from '../types/airspace.types';

export const mockDangerAreas: DangerArea[] = [
  {
    id: 'D001',
    name: 'Bangkok Danger Area 1',
    type: 'danger',
    coordinates: [
      [13.5, 100.3],
      [13.8, 100.3],
      [13.8, 100.6],
      [13.5, 100.6],
      [13.5, 100.3]
    ],
    altitudeLimits: {
      lower: 0,
      upper: 5000,
      reference: 'MSL'
    },
    timeRestrictions: [
      {
        startTime: '08:00',
        endTime: '18:00',
        daysOfWeek: [1, 2, 3, 4, 5],
        timezone: 'Asia/Bangkok'
      }
    ],
    description: 'Artillery training area - active during weekdays',
    authority: 'Royal Thai Army',
    isActive: true,
    severity: 'warning',
    hazardType: 'artillery',
    riskLevel: 'high'
  },
  {
    id: 'D002',
    name: 'Phuket Naval Exercise Zone',
    type: 'danger',
    coordinates: [
      [7.8, 98.0],
      [8.2, 98.0],
      [8.2, 98.5],
      [7.8, 98.5],
      [7.8, 98.0]
    ],
    altitudeLimits: {
      lower: 0,
      upper: 10000,
      reference: 'MSL'
    },
    description: 'Naval missile testing area',
    authority: 'Royal Thai Navy',
    isActive: false,
    severity: 'danger',
    hazardType: 'missile',
    riskLevel: 'extreme'
  },
  {
    id: 'D003',
    name: 'Chiang Mai UAV Testing Zone',
    type: 'danger',
    coordinates: [
      [18.5, 98.7],
      [18.9, 98.7],
      [18.9, 99.1],
      [18.5, 99.1],
      [18.5, 98.7]
    ],
    altitudeLimits: {
      lower: 0,
      upper: 15000,
      reference: 'MSL'
    },
    timeRestrictions: [
      {
        startTime: '06:00',
        endTime: '22:00',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        timezone: 'Asia/Bangkok'
      }
    ],
    description: 'Unmanned aircraft testing and training',
    authority: 'Royal Thai Air Force',
    isActive: true,
    severity: 'warning',
    hazardType: 'unmanned_aircraft',
    riskLevel: 'medium'
  }
];

export const mockRestrictedAreas: RestrictedArea[] = [
  {
    id: 'R001',
    name: 'Royal Palace Restricted Zone',
    type: 'restricted',
    coordinates: [
      [13.745, 100.490],
      [13.755, 100.490],
      [13.755, 100.505],
      [13.745, 100.505],
      [13.745, 100.490]
    ],
    altitudeLimits: {
      lower: 0,
      upper: 25000,
      reference: 'MSL'
    },
    description: 'Royal Palace security zone - no overflight permitted',
    authority: 'Royal Security Command',
    isActive: true,
    severity: 'critical',
    restrictionType: 'security',
    permitRequired: false,
    contactInfo: 'Bangkok Control: 118.1'
  },
  {
    id: 'R002',
    name: 'Sattahip Naval Base',
    type: 'restricted',
    coordinates: [
      [12.65, 100.88],
      [12.70, 100.88],
      [12.70, 100.95],
      [12.65, 100.95],
      [12.65, 100.88]
    ],
    altitudeLimits: {
      lower: 0,
      upper: 20000,
      reference: 'MSL'
    },
    description: 'Military naval base - restricted airspace',
    authority: 'Royal Thai Navy',
    isActive: true,
    severity: 'danger',
    restrictionType: 'military',
    permitRequired: true,
    contactInfo: 'Sattahip Tower: 122.9'
  },
  {
    id: 'R003',
    name: 'Khao Yai National Park',
    type: 'restricted',
    coordinates: [
      [14.2, 101.2],
      [14.6, 101.2],
      [14.6, 101.6],
      [14.2, 101.6],
      [14.2, 101.2]
    ],
    altitudeLimits: {
      lower: 0,
      upper: 3000,
      reference: 'AGL'
    },
    timeRestrictions: [
      {
        startTime: '06:00',
        endTime: '18:00',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        timezone: 'Asia/Bangkok'
      }
    ],
    description: 'Wildlife protection area - low altitude restrictions',
    authority: 'Department of National Parks',
    isActive: true,
    severity: 'info',
    restrictionType: 'environmental',
    permitRequired: false
  }
];

export const mockMilitaryExerciseAreas: MilitaryExerciseArea[] = [
  {
    id: 'M001',
    name: 'Cobra Gold Exercise Zone Alpha',
    type: 'military',
    coordinates: [
      [12.0, 99.5],
      [12.5, 99.5],
      [12.5, 100.2],
      [12.0, 100.2],
      [12.0, 99.5]
    ],
    altitudeLimits: {
      lower: 0,
      upper: 50000,
      reference: 'MSL'
    },
    description: 'Joint military exercise - Cobra Gold 2024',
    authority: 'Royal Thai Armed Forces',
    isActive: true,
    severity: 'critical',
    exerciseType: 'joint_exercise',
    exerciseName: 'Cobra Gold 2024',
    scheduledStart: '2024-08-25T00:00:00Z',
    scheduledEnd: '2024-08-30T23:59:59Z',
    participatingUnits: [
      'Royal Thai Army',
      'Royal Thai Air Force',
      'US Army',
      'US Air Force'
    ]
  },
  {
    id: 'M002',
    name: 'Air Combat Training Zone',
    type: 'military',
    coordinates: [
      [15.5, 102.0],
      [16.0, 102.0],
      [16.0, 102.8],
      [15.5, 102.8],
      [15.5, 102.0]
    ],
    altitudeLimits: {
      lower: 10000,
      upper: 60000,
      reference: 'MSL'
    },
    timeRestrictions: [
      {
        startTime: '09:00',
        endTime: '17:00',
        daysOfWeek: [1, 2, 3, 4, 5],
        timezone: 'Asia/Bangkok'
      }
    ],
    description: 'Fighter aircraft training exercises',
    authority: 'Royal Thai Air Force',
    isActive: false,
    severity: 'warning',
    exerciseType: 'air_combat',
    exerciseName: 'Thunder Strike Training',
    scheduledStart: '2024-09-01T09:00:00Z',
    scheduledEnd: '2024-09-05T17:00:00Z',
    participatingUnits: [
      'Wing 1 - Korat',
      'Wing 7 - Surat Thani'
    ]
  }
];
