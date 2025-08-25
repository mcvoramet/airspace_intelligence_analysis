import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BarChart3, TrendingUp } from 'lucide-react';
import { DemandCapacityChart } from './DemandCapacityChart';
import { FlightDataService } from '../../services/FlightDataService';
import type { ChartData, SelectedElement } from '../../types';

interface ChartPopupProps {
  isOpen: boolean;
  onClose: () => void;
  selectedElement: SelectedElement;
  position: { x: number; y: number };
}

export const ChartPopup: React.FC<ChartPopupProps> = ({
  isOpen,
  onClose,
  selectedElement,
  position
}) => {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(false);

  // Generate chart data when popup opens
  useEffect(() => {
    if (!isOpen) return;

    const generateChartData = async () => {
      setLoading(true);
      try {
        const flightService = FlightDataService.getInstance();
        const newData = flightService.generateDemandCapacityData(
          selectedElement.id,
          selectedElement.type as 'airport' | 'sector' | 'waypoint'
        );

        const newChartData: ChartData = {
          type: 'demand-capacity',
          title: `${selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)} - ${selectedElement.id}`,
          timeRange: {
            start: new Date().toISOString(),
            end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          },
          data: newData,
          metadata: selectedElement.data?.capacity ? {
            capacity: selectedElement.data.capacity.totalHourly || selectedElement.data.controllerCapacity || 50,
            currentDemand: selectedElement.data.capacity?.currentDemand || selectedElement.data.currentTraffic || 30,
            utilizationPercentage: selectedElement.data.capacity?.utilizationPercentage || selectedElement.data.utilizationPercentage || 60
          } : {
            capacity: 50,
            currentDemand: 30,
            utilizationPercentage: 60
          }
        };

        setChartData(newChartData);
      } catch (error) {
        console.error('Error generating chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    generateChartData();
  }, [isOpen, selectedElement]);

  if (!isOpen) return null;

  // Calculate popup position to keep it on screen
  const popupWidth = 400;
  const popupHeight = 300;
  const margin = 20;
  
  let adjustedX = position.x;
  let adjustedY = position.y;
  
  // Adjust horizontal position
  if (adjustedX + popupWidth > window.innerWidth - margin) {
    adjustedX = window.innerWidth - popupWidth - margin;
  }
  if (adjustedX < margin) {
    adjustedX = margin;
  }
  
  // Adjust vertical position
  if (adjustedY + popupHeight > window.innerHeight - margin) {
    adjustedY = window.innerHeight - popupHeight - margin;
  }
  if (adjustedY < margin) {
    adjustedY = margin;
  }

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Popup */}
      <motion.div
        className="fixed bg-white/98 backdrop-blur-md rounded-2xl border border-gray-200 shadow-2xl z-50"
        style={{
          left: adjustedX,
          top: adjustedY,
          width: popupWidth,
          height: popupHeight,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
        }}
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <BarChart3 size={18} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 truncate">
                {selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)} Analysis
              </h3>
              <p className="text-xs text-gray-600">{selectedElement.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors border border-transparent hover:border-red-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4" style={{ height: 'calc(100% - 80px)' }}>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>
                <div className="text-gray-600 text-sm font-medium">Loading chart...</div>
              </div>
            </div>
          ) : chartData ? (
            <div style={{ width: '100%', height: '180px' }}>
              <DemandCapacityChart chartData={chartData} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500 text-sm">No data available</div>
            </div>
          )}

          {/* Quick Stats */}
          {chartData?.metadata && (
            <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-3 text-center">
                <div className="text-emerald-600 text-xs font-semibold uppercase tracking-wide">Capacity</div>
                <div className="text-emerald-700 font-bold text-lg mt-1">
                  {chartData.metadata.capacity}
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 text-center">
                <div className="text-blue-600 text-xs font-semibold uppercase tracking-wide">Demand</div>
                <div className="text-blue-700 font-bold text-lg mt-1">
                  {chartData.metadata.currentDemand}
                </div>
              </div>
              <div className={`border rounded-xl p-3 text-center ${
                (chartData.metadata.utilizationPercentage || 0) >= 90 ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200' :
                (chartData.metadata.utilizationPercentage || 0) >= 80 ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200' :
                (chartData.metadata.utilizationPercentage || 0) >= 60 ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200' :
                'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200'
              }`}>
                <div className={`text-xs font-semibold uppercase tracking-wide ${
                  (chartData.metadata.utilizationPercentage || 0) >= 90 ? 'text-red-600' :
                  (chartData.metadata.utilizationPercentage || 0) >= 80 ? 'text-orange-600' :
                  (chartData.metadata.utilizationPercentage || 0) >= 60 ? 'text-yellow-600' :
                  'text-emerald-600'
                }`}>Usage</div>
                <div className={`font-bold text-lg mt-1 ${
                  (chartData.metadata.utilizationPercentage || 0) >= 90 ? 'text-red-700' :
                  (chartData.metadata.utilizationPercentage || 0) >= 80 ? 'text-orange-700' :
                  (chartData.metadata.utilizationPercentage || 0) >= 60 ? 'text-yellow-700' :
                  'text-emerald-700'
                }`}>
                  {chartData.metadata.utilizationPercentage}%
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
