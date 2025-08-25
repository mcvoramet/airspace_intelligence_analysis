import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, TrendingUp, BarChart3 } from 'lucide-react';
import { DemandCapacityChart } from './DemandCapacityChart';
import { FlightDataService } from '../../services/FlightDataService';
import type { ChartModalProps, ChartData, SelectedElement } from '../../types';

export const ChartModal: React.FC<ChartModalProps> = ({
  isOpen,
  onClose,
  chartData,
  selectedElement
}) => {
  const [timeRange, setTimeRange] = useState('24h');
  const [chartType, setChartType] = useState<'demand-capacity' | 'traffic-flow'>('demand-capacity');
  const [currentChartData, setCurrentChartData] = useState<ChartData>(chartData);
  const [loading, setLoading] = useState(false);

  const timeRangeOptions = [
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' }
  ];

  const chartTypeOptions = [
    { value: 'demand-capacity', label: 'Demand vs Capacity', icon: <BarChart3 size={16} /> },
    { value: 'traffic-flow', label: 'Traffic Flow', icon: <TrendingUp size={16} /> }
  ];

  // Generate new chart data when parameters change
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
          type: chartType,
          title: `${selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)} Analysis - ${selectedElement.id}`,
          timeRange: {
            start: new Date().toISOString(),
            end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          },
          data: newData,
          metadata: selectedElement.data?.capacity ? {
            capacity: selectedElement.data.capacity.totalHourly || selectedElement.data.controllerCapacity || 50,
            currentDemand: selectedElement.data.capacity?.currentDemand || selectedElement.data.currentTraffic || 30,
            utilizationPercentage: selectedElement.data.capacity?.utilizationPercentage || selectedElement.data.utilizationPercentage || 60
          } : undefined
        };

        setCurrentChartData(newChartData);
      } catch (error) {
        console.error('Error generating chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    generateChartData();
  }, [isOpen, selectedElement, chartType, timeRange]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-gray-900 rounded-lg border border-white/20 w-full max-w-4xl max-h-[90vh] overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/20">
            <div>
              <h2 className="text-xl font-bold text-white">
                {selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)} Analysis
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {selectedElement.id} - Detailed Performance Metrics
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Controls */}
          <div className="p-6 border-b border-white/20 bg-gray-800/50">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Time Range Selector */}
              <div className="flex items-center space-x-2">
                <Calendar size={16} className="text-gray-400" />
                <span className="text-sm text-gray-300">Time Range:</span>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="bg-gray-700 text-white rounded px-3 py-1 text-sm border border-gray-600"
                >
                  {timeRangeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chart Type Selector */}
              <div className="flex items-center space-x-2">
                <BarChart3 size={16} className="text-gray-400" />
                <span className="text-sm text-gray-300">Chart Type:</span>
                <div className="flex space-x-1">
                  {chartTypeOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setChartType(option.value as any)}
                      className={`px-3 py-1 rounded text-sm flex items-center space-x-1 transition-colors ${
                        chartType === option.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {option.icon}
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Time */}
              <div className="flex items-center space-x-2 ml-auto">
                <Clock size={16} className="text-gray-400" />
                <span className="text-sm text-gray-300">
                  Updated: {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          {/* Chart Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-white">Loading chart data...</div>
              </div>
            ) : (
              <div className="h-96">
                <DemandCapacityChart 
                  chartData={currentChartData}
                />
              </div>
            )}
          </div>

          {/* Element Details */}
          <div className="p-6 border-t border-white/20 bg-gray-800/30">
            <h3 className="text-lg font-semibold text-white mb-3">Element Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Type</div>
                <div className="text-white font-medium">{selectedElement.type}</div>
              </div>
              <div>
                <div className="text-gray-400">Identifier</div>
                <div className="text-white font-medium">{selectedElement.id}</div>
              </div>
              <div>
                <div className="text-gray-400">Coordinates</div>
                <div className="text-white font-medium">
                  {selectedElement.coordinates[0].toFixed(4)}, {selectedElement.coordinates[1].toFixed(4)}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Status</div>
                <div className="text-green-400 font-medium">Active</div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
