import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Layers, 
    Plane, 
    MapPin, 
    AlertTriangle, 
    Shield, 
    Sword,
    Cloud,
    Clock,
    Filter,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import type { LayerVisibility, TimeRange, FilterState } from '../../types';

interface FilterControlsProps {
    layerVisibility: LayerVisibility;
    setLayerVisibility: (visibility: LayerVisibility) => void;
    timeRange: TimeRange;
    setTimeRange: (range: TimeRange) => void;
    filters: FilterState;
    setFilters: (filters: FilterState) => void;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
    layerVisibility,
    setLayerVisibility,
    timeRange,
    setTimeRange,
    filters,
    setFilters
}) => {
    const [showLayerControl, setShowLayerControl] = useState(false);
    const [showTimeControl, setShowTimeControl] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [currentTime, setCurrentTime] = useState('');
    const [currentDate, setCurrentDate] = useState('');

    const timeOptions = [
        { label: '-24h', offset: -24 },
        { label: '-12h', offset: -12 },
        { label: '-6h', offset: -6 },
        { label: '-3h', offset: -3 },
        { label: '-2h', offset: -2 },
        { label: '-1h', offset: -1 },
        { label: 'now', offset: 0 },
        { label: '+1h', offset: 1 },
        { label: '+2h', offset: 2 },
        { label: '+3h', offset: 3 },
        { label: '+4h', offset: 4 },
        { label: '+5h', offset: 5 },
        { label: '+6h', offset: 6 },
        { label: '+12h', offset: 12 },
        { label: '+24h', offset: 24 }
    ];
    
    const layerGroups = [
        {
            title: 'Flight Data',
            icon: <Plane size={16} />,
            layers: [
                { key: 'flightLayer', label: 'Flight Paths', icon: '✈️' },
                { key: 'airportLayer', label: 'Airports', icon: '🛫' },
                { key: 'waypointLayer', label: 'Waypoints', icon: '📍' }
            ]
        },
        {
            title: 'Airspace Zones',
            icon: <Shield size={16} />,
            layers: [
                { key: 'dangerAreaLayer', label: 'Danger Areas', icon: '⚠️' },
                { key: 'restrictedAreaLayer', label: 'Restricted Areas', icon: '🚫' },
                { key: 'militaryAreaLayer', label: 'Military Areas', icon: '⚔️' },
                { key: 'sectorLayer', label: 'Sectors', icon: '🗺️' }
            ]
        },
        {
            title: 'Weather',
            icon: <Cloud size={16} />,
            layers: [
                { key: 'sigmetLayer', label: 'SIGMET', icon: '🌩️' },
                { key: 'airmetLayer', label: 'AIRMET', icon: '🌤️' }
            ]
        }
    ];

    // Update current time
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date(Date.now() + timeRange.offset * 60 * 60 * 1000);

            const timeString = now.toISOString().substring(11, 19);
            const dateString = now.toLocaleDateString('en-US', {
                timeZone: 'UTC',
                weekday: 'short',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            setCurrentTime(timeString);
            setCurrentDate(dateString);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRange.offset]);

    const handleLayerToggle = (layerKey: keyof LayerVisibility) => {
        setLayerVisibility({
            ...layerVisibility,
            [layerKey]: !layerVisibility[layerKey]
        });
    };

    const handleTimeChange = (offset: number) => {
        const target = new Date(Date.now() + offset * 60 * 60 * 1000);
        const startOfDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate(), 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate(), 23, 59, 59, 999));

        setTimeRange({
            start: startOfDay.toISOString(),
            end: endOfDay.toISOString(),
            current: target.toISOString(),
            offset
        });
    };

    return (
        <div className="absolute top-4 left-4 z-20 space-y-2">
            {/* Main Control Panel */}
            <motion.div
                className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 p-6 text-gray-800 shadow-2xl"
                style={{
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Airspace Intelligence</h3>
                        <p className="text-sm text-gray-600 mt-1">Real-time Aviation Analytics</p>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setShowTimeControl(!showTimeControl)}
                            className="p-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 transition-all duration-200 group"
                            title="Time Controls"
                        >
                            <Clock size={18} className="text-blue-600 group-hover:text-blue-700" />
                        </button>
                        <button
                            onClick={() => setShowLayerControl(!showLayerControl)}
                            className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 transition-all duration-200 group"
                            title="Layer Controls"
                        >
                            <Layers size={18} className="text-emerald-600 group-hover:text-emerald-700" />
                        </button>
                        <button
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className="p-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 hover:border-purple-300 transition-all duration-200 group"
                            title="Advanced Filters"
                        >
                            <Filter size={18} className="text-purple-600 group-hover:text-purple-700" />
                        </button>
                    </div>
                </div>

                {/* Current Time Display */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 text-center">
                    <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">{currentDate}</div>
                    <div className="text-2xl font-bold text-gray-900 my-1">{currentTime}</div>
                    <div className="text-xs text-blue-700 font-medium">UTC (offset {timeRange.offset}h)</div>
                </div>
            </motion.div>

            {/* Time Control Panel */}
            <AnimatePresence>
                {showTimeControl && (
                    <motion.div
                        className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 p-5 text-gray-800 shadow-xl"
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold flex items-center text-gray-900">
                                <Clock size={18} className="mr-2 text-blue-600" />
                                Time Control
                            </h4>
                            <button
                                onClick={() => setShowTimeControl(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <ChevronUp size={16} />
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {timeOptions.map((option) => (
                                <button
                                    key={option.label}
                                    onClick={() => handleTimeChange(option.offset)}
                                    className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                                        timeRange.offset === option.offset
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 border border-blue-600'
                                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Layer Control Panel */}
            <AnimatePresence>
                {showLayerControl && (
                    <motion.div
                        className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 p-5 text-gray-800 max-w-sm shadow-xl"
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold flex items-center text-gray-900">
                                <Layers size={18} className="mr-2 text-emerald-600" />
                                Layer Control
                            </h4>
                            <button
                                onClick={() => setShowLayerControl(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <ChevronUp size={16} />
                            </button>
                        </div>

                        <div className="space-y-5">
                            {layerGroups.map((group) => (
                                <div key={group.title}>
                                    <div className="flex items-center mb-3 text-sm font-semibold text-gray-700">
                                        {group.icon}
                                        <span className="ml-2">{group.title}</span>
                                    </div>
                                    <div className="space-y-2 ml-4">
                                        {group.layers.map((layer) => (
                                            <label
                                                key={layer.key}
                                                className="flex items-center text-sm cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={layerVisibility[layer.key as keyof LayerVisibility]}
                                                    onChange={() => handleLayerToggle(layer.key as keyof LayerVisibility)}
                                                    className="mr-3 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                                />
                                                <span className="mr-2 text-base">{layer.icon}</span>
                                                <span className="text-gray-700 font-medium">{layer.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
