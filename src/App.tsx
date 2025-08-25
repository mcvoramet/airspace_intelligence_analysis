import { useState } from 'react';
import { motion } from 'framer-motion';
import { AirspaceMap } from './components/Map/AirspaceMap';
import { FilterControls } from './components/UI/FilterControls';
import { ChartPopup } from './components/Charts/ChartPopup';
import type { LayerVisibility, MapClickEvent, SelectedElement, TimeRange, FilterState } from './types';
import './App.css';

function App() {
  const [mapView, setMapView] = useState<L.LatLng | null>(null);
  const [mapGeo, setMapGeo] = useState<GeoJSON.GeoJsonObject | null>(null);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);

  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({
    sigmetLayer: false, // Start with weather hidden
    airmetLayer: false,
    flightLayer: true,
    dangerAreaLayer: true,
    restrictedAreaLayer: true,
    militaryAreaLayer: true,
    airportLayer: true,
    sectorLayer: false, // Start with sectors hidden for cleaner view
    waypointLayer: true
  });

  const [timeRange, setTimeRange] = useState<TimeRange>(() => {
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    return {
      start: startOfDay.toISOString(),
      end: endOfDay.toISOString(),
      current: now.toISOString(),
      offset: 0
    };
  });

  const [filters, setFilters] = useState<FilterState>({
    flight: {},
    airspace: { activeOnly: true },
    weather: { types: ['sigmet', 'airmet'], severityLevels: [] }
  });

  const [showChartPopup, setShowChartPopup] = useState(false);
  const [chartPopupPosition, setChartPopupPosition] = useState({ x: 0, y: 0 });

  const handleMapClick = (event: MapClickEvent) => {
    console.log('Map clicked:', event);

    if (event.elementType && event.elementId) {
      const element = {
        type: event.elementType,
        id: event.elementId,
        data: event.elementData,
        coordinates: event.coordinates
      };

      setSelectedElement(element);

      // Show chart popup for clickable elements
      if (['airport', 'sector', 'waypoint'].includes(event.elementType)) {
        let x = 100;
        let y = 100;

        // Use screen coordinates if available (from clicked element)
        if (event.screenCoordinates) {
          x = event.screenCoordinates.x;
          y = event.screenCoordinates.y;

          // Offset popup to avoid covering the clicked element
          x += 20;
          y -= 150; // Position above the clicked element
        }

        // Ensure popup stays within screen bounds
        const popupWidth = 400;
        const popupHeight = 300;
        const margin = 20;

        // Adjust horizontal position
        if (x + popupWidth > window.innerWidth - margin) {
          x = window.innerWidth - popupWidth - margin;
        }
        if (x < margin) {
          x = margin;
        }

        // Adjust vertical position
        if (y + popupHeight > window.innerHeight - margin) {
          y = window.innerHeight - popupHeight - margin;
        }
        if (y < margin) {
          y = margin;
        }

        setChartPopupPosition({ x, y });

        // Use setTimeout to ensure smooth animation
        setTimeout(() => {
          setShowChartPopup(true);
        }, 50);
      }
    } else {
      setSelectedElement(null);
      setShowChartPopup(false);
    }
  };

  return (
    <div className="w-screen h-screen relative bg-gray-100 text-gray-900 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-gray-200 to-indigo-100 opacity-50 z-0"></div>

      <AirspaceMap
        layerVisibility={layerVisibility}
        mapView={mapView}
        mapGeo={mapGeo}
        onMapClick={handleMapClick}
        selectedElement={selectedElement}
        timeRange={timeRange}
      />

      <FilterControls
        layerVisibility={layerVisibility}
        setLayerVisibility={setLayerVisibility}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        filters={filters}
        setFilters={setFilters}
      />

      {/* Selected Element Info */}
      {selectedElement && !showChartPopup && (
        <motion.div
          className="absolute top-4 right-4 bg-white/95 backdrop-blur-md border border-gray-200 text-gray-800 p-4 rounded-2xl z-10 max-w-xs shadow-xl"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <h4 className="text-sm font-bold text-gray-900">Selected Element</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">{selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)}:</span>
              <span className="text-gray-900 font-semibold">{selectedElement.id}</span>
            </div>
            <div className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded-lg">
              {selectedElement.coordinates[0].toFixed(4)}, {selectedElement.coordinates[1].toFixed(4)}
            </div>
            {['airport', 'sector', 'waypoint'].includes(selectedElement.type) && (
              <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                <p className="text-blue-700 text-xs font-medium flex items-center">
                  <span className="mr-1">📊</span>
                  Click for detailed analysis
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Chart Popup */}
      {showChartPopup && selectedElement && (
        <ChartPopup
          isOpen={showChartPopup}
          onClose={() => setShowChartPopup(false)}
          selectedElement={selectedElement}
          position={chartPopupPosition}
        />
      )}
    </div>
  );
}

export default App;
