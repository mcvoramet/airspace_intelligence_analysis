import React, { useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

import { MAP_CONFIG, LAYER_STYLES, Z_INDEX } from '../../utils/constants';
import type { LayerVisibility, MapClickEvent } from '../../types';
import { WeatherLabelManager } from '../Weather/WeatherLabels';
import { WeatherPopupGenerator } from '../Weather/WeatherPopup';
import { FlightLayerManager } from '../Flight/FlightLayerManager';
import { AirspaceLayerManager } from '../Airspace/AirspaceLayerManager';
import { useFlightData } from '../../hooks/useFlightData';
import { useAirspaceData } from '../../hooks/useAirspaceData';
import { useWeatherData } from '../../hooks/useWeatherData';
import { mockAirports, mockWaypoints, mockSectors } from '../../data';

// Fix default marker icons
const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface AirspaceMapProps {
    layerVisibility: LayerVisibility;
    mapView: L.LatLng | null;
    mapGeo: GeoJSON.GeoJsonObject | null;
    onMapClick?: (event: MapClickEvent) => void;
    selectedElement?: { type: string; id: string } | null;
}

export const AirspaceMap: React.FC<AirspaceMapProps> = ({
    layerVisibility,
    mapView,
    mapGeo,
    onMapClick,
    selectedElement
}) => {
    const mapRef = useRef<L.Map | null>(null);
    const hoverLayerRef = useRef<L.GeoJSON | null>(null);

    // Data hooks
    const { flightPlans } = useFlightData();
    const { dangerAreas, restrictedAreas, militaryAreas } = useAirspaceData();
    const { sigmetFeatures, airmetFeatures } = useWeatherData();

    const layersRef = useRef<{
        sigmetLayer: L.GeoJSON | null;
        airmetLayer: L.GeoJSON | null;
    }>({
        sigmetLayer: null,
        airmetLayer: null
    });

    const managersRef = useRef<{
        weatherLabels: {
            sigmet: WeatherLabelManager | null;
            airmet: WeatherLabelManager | null;
        };
        flightManager: FlightLayerManager | null;
        airspaceManager: AirspaceLayerManager | null;
    }>({
        weatherLabels: { sigmet: null, airmet: null },
        flightManager: null,
        airspaceManager: null
    });

    // Initialize map
    useEffect(() => {
        const mapContainer = document.getElementById('map');
        if (!mapContainer || mapRef.current) return;

        const map = L.map('map', {
            center: MAP_CONFIG.center,
            zoom: MAP_CONFIG.zoom,
            zoomControl: false
        });

        // Add base layer
        L.tileLayer(MAP_CONFIG.styles.dark.url, {
            attribution: MAP_CONFIG.styles.dark.attribution
        }).addTo(map);

        // Create panes for layer organization
        const panes = [
            'sectorsPane',
            'airspacePane', 
            'flightPathsPane',
            'sigmetPane',
            'airmetPane',
            'airportsPane',
            'waypointsPane',
            'hoverPane',
            'selectedPane'
        ];

        panes.forEach((paneName, index) => {
            map.createPane(paneName);
            const pane = map.getPane(paneName);
            if (pane) {
                pane.style.zIndex = (Z_INDEX.basemap + (index + 1) * 50).toString();
            }
        });

        // Create weather layers
        const sigmetLayer = L.geoJSON(null, {
            style: LAYER_STYLES.sigmet,
            onEachFeature: WeatherPopupGenerator.attachPopup,
            pane: 'sigmetPane'
        }).addTo(map);

        const airmetLayer = L.geoJSON(null, {
            style: LAYER_STYLES.airmet,
            onEachFeature: WeatherPopupGenerator.attachPopup,
            pane: 'airmetPane'
        }).addTo(map);

        // Initialize managers
        const sigmetLabelManager = new WeatherLabelManager(map);
        const airmetLabelManager = new WeatherLabelManager(map);
        const flightManager = new FlightLayerManager(map);
        const airspaceManager = new AirspaceLayerManager(map);

        // Add managers to map
        flightManager.addToMap();
        airspaceManager.addToMap();

        // Store references
        mapRef.current = map;
        layersRef.current = {
            sigmetLayer,
            airmetLayer
        };
        managersRef.current = {
            weatherLabels: {
                sigmet: sigmetLabelManager,
                airmet: airmetLabelManager
            },
            flightManager,
            airspaceManager
        };

        // Add map click handler
        if (onMapClick) {
            map.on('click', (e) => {
                onMapClick({
                    coordinates: [e.latlng.lat, e.latlng.lng]
                });
            });
        }

        return () => {
            if (mapRef.current) {
                managersRef.current.weatherLabels.sigmet?.destroy();
                managersRef.current.weatherLabels.airmet?.destroy();
                managersRef.current.flightManager?.destroy();
                managersRef.current.airspaceManager?.destroy();
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [onMapClick]);

    // Handle map view changes
    useEffect(() => {
        if (mapView && mapRef.current) {
            mapRef.current.setView(mapView, mapRef.current.getZoom());
        }
    }, [mapView]);

    // Handle hover/selected geometry
    useEffect(() => {
        if (mapGeo && mapRef.current) {
            if (hoverLayerRef.current) {
                mapRef.current.removeLayer(hoverLayerRef.current);
                hoverLayerRef.current = null;
            }
            
            const hoverLayer = L.geoJSON(mapGeo, {
                style: LAYER_STYLES.hover,
                onEachFeature: WeatherPopupGenerator.attachPopup,
                pane: 'hoverPane'
            }).addTo(mapRef.current);

            hoverLayerRef.current = hoverLayer;

            const fadeTimeout = setTimeout(() => {
                setTimeout(() => {
                    if (hoverLayerRef.current) {
                        mapRef.current?.removeLayer(hoverLayerRef.current);
                        hoverLayerRef.current = null;
                    }
                }, 500);
            }, 5000);

            return () => {
                clearTimeout(fadeTimeout);
                if (hoverLayerRef.current) {
                    mapRef.current?.removeLayer(hoverLayerRef.current);
                    hoverLayerRef.current = null;
                }
            };
        }
    }, [mapGeo]);

    // Load flight data
    useEffect(() => {
        const flightManager = managersRef.current.flightManager;
        if (!flightManager) return;

        // Clear existing flight data
        flightManager.clearFlightPaths();
        flightManager.clearAirports();
        flightManager.clearWaypoints();

        // Add flight paths
        if (layerVisibility.flightLayer) {
            flightPlans.forEach(flight => {
                flightManager.addFlightPath(flight, (selectedFlight) => {
                    onMapClick?.({
                        coordinates: selectedFlight.departure.coordinates,
                        elementType: 'flight',
                        elementId: selectedFlight.id,
                        elementData: selectedFlight
                    });
                });
            });
        }

        // Add airports
        if (layerVisibility.airportLayer) {
            mockAirports.forEach(airport => {
                flightManager.addAirport(airport, (selectedAirport, screenCoords) => {
                    onMapClick?.({
                        coordinates: selectedAirport.coordinates,
                        screenCoordinates: screenCoords,
                        elementType: 'airport',
                        elementId: selectedAirport.icaoCode,
                        elementData: selectedAirport
                    });
                });
            });
        }

        // Add waypoints
        if (layerVisibility.waypointLayer) {
            mockWaypoints.forEach(waypoint => {
                flightManager.addWaypoint(waypoint, (selectedWaypoint, screenCoords) => {
                    onMapClick?.({
                        coordinates: selectedWaypoint.coordinates,
                        screenCoordinates: screenCoords,
                        elementType: 'waypoint',
                        elementId: selectedWaypoint.id,
                        elementData: selectedWaypoint
                    });
                });
            });
        }
    }, [flightPlans, layerVisibility.flightLayer, layerVisibility.airportLayer, layerVisibility.waypointLayer, onMapClick]);

    // Load airspace data
    useEffect(() => {
        const airspaceManager = managersRef.current.airspaceManager;
        if (!airspaceManager) return;

        // Clear existing airspace data
        airspaceManager.clearDangerAreas();
        airspaceManager.clearRestrictedAreas();
        airspaceManager.clearMilitaryAreas();
        airspaceManager.clearSectors();

        // Add danger areas
        if (layerVisibility.dangerAreaLayer) {
            dangerAreas.forEach(area => {
                airspaceManager.addDangerArea(area, (selectedArea) => {
                    onMapClick?.({
                        coordinates: [area.coordinates[0][0], area.coordinates[0][1]],
                        elementType: 'airspace',
                        elementId: selectedArea.id,
                        elementData: selectedArea
                    });
                });
            });
        }

        // Add restricted areas
        if (layerVisibility.restrictedAreaLayer) {
            restrictedAreas.forEach(area => {
                airspaceManager.addRestrictedArea(area, (selectedArea) => {
                    onMapClick?.({
                        coordinates: [area.coordinates[0][0], area.coordinates[0][1]],
                        elementType: 'airspace',
                        elementId: selectedArea.id,
                        elementData: selectedArea
                    });
                });
            });
        }

        // Add military areas
        if (layerVisibility.militaryAreaLayer) {
            militaryAreas.forEach(area => {
                airspaceManager.addMilitaryArea(area, (selectedArea) => {
                    onMapClick?.({
                        coordinates: [area.coordinates[0][0], area.coordinates[0][1]],
                        elementType: 'airspace',
                        elementId: selectedArea.id,
                        elementData: selectedArea
                    });
                });
            });
        }

        // Add sectors
        if (layerVisibility.sectorLayer) {
            mockSectors.forEach(sector => {
                airspaceManager.addSector(sector, (selectedSector, screenCoords) => {
                    onMapClick?.({
                        coordinates: [sector.boundaries[0][0], sector.boundaries[0][1]],
                        screenCoordinates: screenCoords,
                        elementType: 'sector',
                        elementId: selectedSector.id,
                        elementData: selectedSector
                    });
                });
            });
        }
    }, [dangerAreas, restrictedAreas, militaryAreas, layerVisibility.dangerAreaLayer, layerVisibility.restrictedAreaLayer, layerVisibility.militaryAreaLayer, layerVisibility.sectorLayer, onMapClick]);

    // Load weather data
    useEffect(() => {
        const sigmetLayer = layersRef.current.sigmetLayer;
        const airmetLayer = layersRef.current.airmetLayer;
        const sigmetLabelManager = managersRef.current.weatherLabels.sigmet;
        const airmetLabelManager = managersRef.current.weatherLabels.airmet;

        if (!sigmetLayer || !airmetLayer || !sigmetLabelManager || !airmetLabelManager) return;

        // Clear existing weather data
        sigmetLayer.clearLayers();
        airmetLayer.clearLayers();
        sigmetLabelManager.clearLabels();
        airmetLabelManager.clearLabels();

        // Add SIGMET data
        if (layerVisibility.sigmetLayer && sigmetFeatures.length > 0) {
            sigmetLayer.addData({
                type: 'FeatureCollection',
                features: sigmetFeatures
            });
            sigmetLabelManager.addLabels(sigmetLayer, 'sigmet');
        }

        // Add AIRMET data
        if (layerVisibility.airmetLayer && airmetFeatures.length > 0) {
            airmetLayer.addData({
                type: 'FeatureCollection',
                features: airmetFeatures
            });
            airmetLabelManager.addLabels(airmetLayer, 'airmet');
        }
    }, [sigmetFeatures, airmetFeatures, layerVisibility.sigmetLayer, layerVisibility.airmetLayer]);

    // Handle layer visibility changes
    useEffect(() => {
        if (!mapRef.current) return;

        const layers = layersRef.current;
        const managers = managersRef.current;
        const map = mapRef.current;

        // Toggle weather layer visibility
        if (layers.sigmetLayer) {
            if (layerVisibility.sigmetLayer && !map.hasLayer(layers.sigmetLayer)) {
                map.addLayer(layers.sigmetLayer);
            } else if (!layerVisibility.sigmetLayer && map.hasLayer(layers.sigmetLayer)) {
                map.removeLayer(layers.sigmetLayer);
            }
        }

        if (layers.airmetLayer) {
            if (layerVisibility.airmetLayer && !map.hasLayer(layers.airmetLayer)) {
                map.addLayer(layers.airmetLayer);
            } else if (!layerVisibility.airmetLayer && map.hasLayer(layers.airmetLayer)) {
                map.removeLayer(layers.airmetLayer);
            }
        }

        // Flight and airspace layer visibility is handled in their respective useEffect hooks
        // since they need to reload data when visibility changes
    }, [layerVisibility]);

    return (
        <div 
            id="map" 
            className="w-full h-full"
            style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                zIndex: 1 
            }}
        />
    );
};
