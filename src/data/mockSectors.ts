import type { Sector } from '../types/flight.types';

export const mockSectors: Sector[] = [
  {
    id: 'BKK_CTR_01',
    name: 'Bangkok Control Sector 1',
    boundaries: [
      [13.0, 100.0],
      [14.5, 100.0],
      [14.5, 101.5],
      [13.0, 101.5],
      [13.0, 100.0]
    ],
    controllerCapacity: 25,
    currentTraffic: 18,
    utilizationPercentage: 72,
    altitudeLimits: {
      lower: 24500,
      upper: 66000
    }
  },
  {
    id: 'BKK_CTR_02',
    name: 'Bangkok Control Sector 2',
    boundaries: [
      [12.0, 99.5],
      [13.0, 99.5],
      [13.0, 101.0],
      [12.0, 101.0],
      [12.0, 99.5]
    ],
    controllerCapacity: 20,
    currentTraffic: 16,
    utilizationPercentage: 80,
    altitudeLimits: {
      lower: 24500,
      upper: 66000
    }
  },
  {
    id: 'BKK_APP_01',
    name: 'Bangkok Approach Sector 1',
    boundaries: [
      [13.4, 100.4],
      [14.0, 100.4],
      [14.0, 101.0],
      [13.4, 101.0],
      [13.4, 100.4]
    ],
    controllerCapacity: 15,
    currentTraffic: 12,
    utilizationPercentage: 80,
    altitudeLimits: {
      lower: 0,
      upper: 24500
    }
  },
  {
    id: 'CNX_CTR_01',
    name: 'Chiang Mai Control Sector',
    boundaries: [
      [18.0, 98.5],
      [19.5, 98.5],
      [19.5, 100.0],
      [18.0, 100.0],
      [18.0, 98.5]
    ],
    controllerCapacity: 12,
    currentTraffic: 7,
    utilizationPercentage: 58,
    altitudeLimits: {
      lower: 24500,
      upper: 66000
    }
  },
  {
    id: 'HKT_CTR_01',
    name: 'Phuket Control Sector',
    boundaries: [
      [7.5, 98.0],
      [9.0, 98.0],
      [9.0, 99.5],
      [7.5, 99.5],
      [7.5, 98.0]
    ],
    controllerCapacity: 10,
    currentTraffic: 8,
    utilizationPercentage: 80,
    altitudeLimits: {
      lower: 24500,
      upper: 66000
    }
  },
  {
    id: 'UBP_CTR_01',
    name: 'Ubon Control Sector',
    boundaries: [
      [14.5, 104.0],
      [16.0, 104.0],
      [16.0, 105.5],
      [14.5, 105.5],
      [14.5, 104.0]
    ],
    controllerCapacity: 8,
    currentTraffic: 5,
    utilizationPercentage: 63,
    altitudeLimits: {
      lower: 24500,
      upper: 66000
    }
  },
  {
    id: 'NST_CTR_01',
    name: 'Nakhon Si Thammarat Control Sector',
    boundaries: [
      [8.0, 99.5],
      [9.5, 99.5],
      [9.5, 101.0],
      [8.0, 101.0],
      [8.0, 99.5]
    ],
    controllerCapacity: 10,
    currentTraffic: 6,
    utilizationPercentage: 60,
    altitudeLimits: {
      lower: 24500,
      upper: 66000
    }
  },
  {
    id: 'HDY_CTR_01',
    name: 'Hat Yai Control Sector',
    boundaries: [
      [6.5, 100.0],
      [8.0, 100.0],
      [8.0, 101.5],
      [6.5, 101.5],
      [6.5, 100.0]
    ],
    controllerCapacity: 8,
    currentTraffic: 4,
    utilizationPercentage: 50,
    altitudeLimits: {
      lower: 24500,
      upper: 66000
    }
  }
];
