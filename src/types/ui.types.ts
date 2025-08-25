import type { LayerVisibility } from './weather.types';
import type { FlightFilter } from './flight.types';
import type { AirspaceFilter } from './airspace.types';

export interface AppState {
  mapView: L.LatLng | null;
  mapGeo: GeoJSON.GeoJsonObject | null;
  layerVisibility: LayerVisibility;
  selectedTimeRange: TimeRange;
  filters: FilterState;
  selectedElement: SelectedElement | null;
  showChartModal: boolean;
  chartData: ChartData | null;
}

export interface FilterState {
  flight: FlightFilter;
  airspace: AirspaceFilter;
  weather: {
    types: ('sigmet' | 'airmet')[];
    severityLevels: string[];
  };
}

export interface TimeRange {
  start: string;
  end: string;
  current: string;
  offset: number; // hours from now
}

export interface SelectedElement {
  type: 'airport' | 'sector' | 'waypoint' | 'flight' | 'airspace';
  id: string;
  data: any;
  coordinates: [number, number];
}

export interface ChartData {
  type: 'demand-capacity' | 'traffic-flow' | 'weather-impact';
  title: string;
  timeRange: {
    start: string;
    end: string;
  };
  data: ChartDataPoint[];
  metadata?: {
    capacity?: number;
    currentDemand?: number;
    utilizationPercentage?: number;
  };
}

export interface ChartDataPoint {
  time: string;
  demand: number;
  capacity: number;
  utilization: number;
  label?: string;
}

export interface MapClickEvent {
  coordinates: [number, number];
  screenCoordinates?: { x: number; y: number };
  elementType?: 'airport' | 'sector' | 'waypoint' | 'flight' | 'airspace';
  elementId?: string;
  elementData?: any;
}

export interface FilterControlProps {
  layerVisibility: LayerVisibility;
  setLayerVisibility: (visibility: LayerVisibility) => void;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
}

export interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  chartData: ChartData;
  selectedElement: SelectedElement;
}
