import type { Airport } from '../types/flight.types';

export const mockAirports: Airport[] = [
  {
    icaoCode: 'VTBS',
    iataCode: 'BKK',
    name: 'Suvarnabhumi Airport',
    coordinates: [13.6900, 100.7501],
    elevation: 5,
    timezone: 'Asia/Bangkok',
    country: 'Thailand',
    capacity: {
      hourlyDepartures: 45,
      hourlyArrivals: 45,
      totalHourly: 90,
      currentDemand: 72,
      utilizationPercentage: 80
    }
  },
  {
    icaoCode: 'VTBD',
    iataCode: 'DMK',
    name: 'Don Mueang International Airport',
    coordinates: [13.9126, 100.6067],
    elevation: 9,
    timezone: 'Asia/Bangkok',
    country: 'Thailand',
    capacity: {
      hourlyDepartures: 30,
      hourlyArrivals: 30,
      totalHourly: 60,
      currentDemand: 42,
      utilizationPercentage: 70
    }
  },
  {
    icaoCode: 'VHHH',
    iataCode: 'HKG',
    name: 'Hong Kong International Airport',
    coordinates: [22.3080, 113.9185],
    elevation: 28,
    timezone: 'Asia/Hong_Kong',
    country: 'Hong Kong',
    capacity: {
      hourlyDepartures: 50,
      hourlyArrivals: 50,
      totalHourly: 100,
      currentDemand: 85,
      utilizationPercentage: 85
    }
  },
  {
    icaoCode: 'WSSS',
    iataCode: 'SIN',
    name: 'Singapore Changi Airport',
    coordinates: [1.3644, 103.9915],
    elevation: 22,
    timezone: 'Asia/Singapore',
    country: 'Singapore',
    capacity: {
      hourlyDepartures: 55,
      hourlyArrivals: 55,
      totalHourly: 110,
      currentDemand: 88,
      utilizationPercentage: 80
    }
  },
  {
    icaoCode: 'WMKK',
    iataCode: 'KUL',
    name: 'Kuala Lumpur International Airport',
    coordinates: [2.7456, 101.7072],
    elevation: 69,
    timezone: 'Asia/Kuala_Lumpur',
    country: 'Malaysia',
    capacity: {
      hourlyDepartures: 40,
      hourlyArrivals: 40,
      totalHourly: 80,
      currentDemand: 56,
      utilizationPercentage: 70
    }
  },
  {
    icaoCode: 'VVNB',
    iataCode: 'SGN',
    name: 'Tan Son Nhat International Airport',
    coordinates: [10.8187, 106.6520],
    elevation: 33,
    timezone: 'Asia/Ho_Chi_Minh',
    country: 'Vietnam',
    capacity: {
      hourlyDepartures: 35,
      hourlyArrivals: 35,
      totalHourly: 70,
      currentDemand: 49,
      utilizationPercentage: 70
    }
  },
  {
    icaoCode: 'RJTT',
    iataCode: 'NRT',
    name: 'Narita International Airport',
    coordinates: [35.7647, 140.3864],
    elevation: 141,
    timezone: 'Asia/Tokyo',
    country: 'Japan',
    capacity: {
      hourlyDepartures: 60,
      hourlyArrivals: 60,
      totalHourly: 120,
      currentDemand: 96,
      utilizationPercentage: 80
    }
  },
  {
    icaoCode: 'RKSI',
    iataCode: 'ICN',
    name: 'Incheon International Airport',
    coordinates: [37.4602, 126.4407],
    elevation: 23,
    timezone: 'Asia/Seoul',
    country: 'South Korea',
    capacity: {
      hourlyDepartures: 50,
      hourlyArrivals: 50,
      totalHourly: 100,
      currentDemand: 75,
      utilizationPercentage: 75
    }
  }
];
