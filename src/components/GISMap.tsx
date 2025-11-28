import React, { useState, useEffect, useRef } from 'react';
import { 
  Map, 
  Home, 
  Factory, 
  Droplets, 
  Zap,
  AlertTriangle,
  CheckCircle,
  Eye,
  Layers,
  Navigation,
  MapPin,
  Crosshair,
  Satellite
} from 'lucide-react';

declare global {
  interface Window {
    L: any;
    bhuvanMap: any;
  }
}

export function GISMap() {
  const [selectedLayer, setSelectedLayer] = useState('all');
  const [selectedPoint, setSelectedPoint] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapType, setMapType] = useState('satellite');
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);

  // Sample data points with real coordinates for Indian locations
  const mapPoints = [
    { id: 1, type: 'tank', lat: 23.2599, lng: 77.4126, name: 'Main Storage Tank', capacity: '5000L', status: 'normal', level: '85%' },
    { id: 2, type: 'pump', lat: 23.2589, lng: 77.4136, name: 'Solar Pump Station', power: '2kW', status: 'active', output: '420W' },
    { id: 3, type: 'household', lat: 23.2609, lng: 77.4146, name: 'Ward 1 - 42 Homes', connections: 42, status: 'normal', consumption: '2.8kL/day' },
    { id: 4, type: 'household', lat: 23.2619, lng: 77.4156, name: 'Ward 2 - 38 Homes', connections: 38, status: 'normal', consumption: '2.5kL/day' },
    { id: 5, type: 'household', lat: 23.2579, lng: 77.4166, name: 'Ward 3 - 31 Homes', connections: 31, status: 'warning', consumption: '1.9kL/day' },
    { id: 6, type: 'leak', lat: 23.2595, lng: 77.4140, name: 'Detected Leak', severity: 'medium', flow: '2.3L/min', detected: '2 hours ago' },
    { id: 7, type: 'sensor', lat: 23.2605, lng: 77.4130, name: 'Pressure Sensor P1', reading: '3.8 bar', status: 'normal', battery: '92%' },
    { id: 8, type: 'sensor', lat: 23.2585, lng: 77.4150, name: 'Flow Sensor F1', reading: '45.2 L/min', status: 'normal', battery: '88%' }
  ];

  const getIconComponent = (type: string) => {
    switch (type) {
      case 'tank': return Droplets;
      case 'pump': return Zap;
      case 'household': return Home;
      case 'leak': return AlertTriangle;
      case 'sensor': return CheckCircle;
      default: return Map;
    }
  };

  const getMarkerColor = (type: string, status: string) => {
    if (status === 'warning') return '#f59e0b';
    if (status === 'critical' || type === 'leak') return '#ef4444';
    if (status === 'active' || status === 'normal') return '#10b981';
    return '#3b82f6';
  };

  const layers = [
    { id: 'all', name: 'All Layers', count: mapPoints.length },
    { id: 'infrastructure', name: 'Infrastructure', count: mapPoints.filter(p => ['tank', 'pump'].includes(p.type)).length },
    { id: 'households', name: 'Households', count: mapPoints.filter(p => p.type === 'household').length },
    { id: 'sensors', name: 'Sensors', count: mapPoints.filter(p => p.type === 'sensor').length },
    { id: 'issues', name: 'Issues', count: mapPoints.filter(p => p.type === 'leak' || p.status === 'warning').length }
  ];

  const filteredPoints = selectedLayer === 'all' ? mapPoints :
    selectedLayer === 'infrastructure' ? mapPoints.filter(p => ['tank', 'pump'].includes(p.type)) :
    selectedLayer === 'households' ? mapPoints.filter(p => p.type === 'household') :
    selectedLayer === 'sensors' ? mapPoints.filter(p => p.type === 'sensor') :
    selectedLayer === 'issues' ? mapPoints.filter(p => p.type === 'leak' || p.status === 'warning') :
    mapPoints;

  // Load Leaflet and Bhuvan API
  useEffect(() => {
    const apiKey = import.meta.env.VITE_BHUVAN_API_KEY;
    
    if (!apiKey || apiKey === 'your-bhuvan-api-key-here') {
      setLocationError('Bhuvan API key not configured. Please add VITE_BHUVAN_API_KEY to your .env file.');
      return;
    }

    // Load Leaflet CSS
    const leafletCSS = document.createElement('link');
    leafletCSS.rel = 'stylesheet';
    leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(leafletCSS);

    // Load Leaflet JS
    const leafletScript = document.createElement('script');
    leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    leafletScript.onload = () => {
      setMapLoaded(true);
    };
    leafletScript.onerror = () => {
      setLocationError('Failed to load Leaflet mapping library. Please check your internet connection.');
    };

    document.head.appendChild(leafletScript);

    return () => {
      // Cleanup
      if (leafletCSS.parentNode) leafletCSS.parentNode.removeChild(leafletCSS);
      if (leafletScript.parentNode) leafletScript.parentNode.removeChild(leafletScript);
    };
  }, []);

  // Get user's current location
  useEffect(() => {
    if (!mapLoaded) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setLocationError(null);
        },
        (error) => {
          let errorMessage = 'Unable to get your location. ';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Location access denied by user.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Location request timed out.';
              break;
            default:
              errorMessage += 'Unknown error occurred.';
              break;
          }
          setLocationError(errorMessage);
          
          // Fallback to default location (Bhopal, MP)
          setUserLocation({ lat: 23.2599, lng: 77.4126 });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser.');
      // Fallback to default location
      setUserLocation({ lat: 23.2599, lng: 77.4126 });
    }
  }, [mapLoaded]);

  // Initialize Bhuvan Map with Leaflet
  useEffect(() => {
    if (!mapLoaded || !userLocation || !mapRef.current || !window.L) return;

    // Initialize Leaflet map
    const map = window.L.map(mapRef.current, {
      center: [userLocation.lat, userLocation.lng],
      zoom: 15,
      zoomControl: true
    });

    leafletMapRef.current = map;

    // Bhuvan tile layers
    const bhuvanLayers = {
      satellite: window.L.tileLayer('https://bhuvan-vec1.nrsc.gov.in/bhuvan/gwc/service/wmts?layer=toposheet&tilematrixset=EPSG:3857&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix=EPSG:3857:{z}&TileCol={x}&TileRow={y}', {
        attribution: '© ISRO Bhuvan | JalRakshak',
        maxZoom: 18
      }),
      hybrid: window.L.tileLayer('https://bhuvan-vec1.nrsc.gov.in/bhuvan/gwc/service/wmts?layer=india3&tilematrixset=EPSG:3857&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix=EPSG:3857:{z}&TileCol={x}&TileRow={y}', {
        attribution: '© ISRO Bhuvan | JalRakshak',
        maxZoom: 18
      }),
      terrain: window.L.tileLayer('https://bhuvan-vec1.nrsc.gov.in/bhuvan/gwc/service/wmts?layer=terrain&tilematrixset=EPSG:3857&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix=EPSG:3857:{z}&TileCol={x}&TileRow={y}', {
        attribution: '© ISRO Bhuvan | JalRakshak',
        maxZoom: 18
      })
    };

    // Add default layer
    bhuvanLayers[mapType as keyof typeof bhuvanLayers].addTo(map);

    // Add user location marker
    const userIcon = window.L.divIcon({
      className: 'user-location-marker',
      html: `<div style="
        width: 20px; 
        height: 20px; 
        background: #4285f4; 
        border: 3px solid white; 
        border-radius: 50%; 
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    userMarkerRef.current = window.L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(map)
      .bindPopup('Your Current Location');

    // Add accuracy circle
    window.L.circle([userLocation.lat, userLocation.lng], {
      color: '#4285f4',
      fillColor: '#4285f4',
      fillOpacity: 0.1,
      radius: 100
    }).addTo(map);

    // Clear existing markers
    markersRef.current.forEach(marker => map.removeLayer(marker));
    markersRef.current = [];

    // Add infrastructure markers
    filteredPoints.forEach((point) => {
      const markerIcon = window.L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width: 16px; 
          height: 16px; 
          background: ${getMarkerColor(point.type, point.status)}; 
          border: 2px solid white; 
          border-radius: 50%; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const marker = window.L.marker([point.lat, point.lng], { icon: markerIcon })
        .addTo(map)
        .bindPopup(`
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">${point.name}</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
              ${Object.entries(point)
                .filter(([key]) => !['id', 'type', 'lat', 'lng', 'name'].includes(key))
                .map(([key, value]) => `
                  <div style="text-align: center; padding: 4px; background: #f3f4f6; border-radius: 4px;">
                    <div style="color: #6b7280; text-transform: capitalize;">${key.replace(/([A-Z])/g, ' $1')}</div>
                    <div style="color: #1f2937; font-weight: 500;">${value}</div>
                  </div>
                `).join('')}
            </div>
          </div>
        `);

      marker.on('click', () => {
        setSelectedPoint(point);
      });

      markersRef.current.push(marker);
    });

    return () => {
      // Cleanup
      if (map) {
        map.remove();
      }
    };
  }, [mapLoaded, userLocation, filteredPoints, mapType]);

  const centerOnUserLocation = () => {
    if (leafletMapRef.current && userLocation) {
      leafletMapRef.current.setView([userLocation.lat, userLocation.lng], 16);
    }
  };

  const requestLocationPermission = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setLocationError(null);
          
          if (leafletMapRef.current) {
            leafletMapRef.current.setView([location.lat, location.lng], 16);
          }
        },
        (error) => {
          setLocationError('Location access denied. Please enable location services and refresh the page.');
        }
      );
    }
  };

  const changeMapType = (newMapType: string) => {
    setMapType(newMapType);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center">
              <Satellite className="w-5 h-5 mr-2" />
              Bhuvan GIS Water Network Map
            </h2>
            <p className="text-sm opacity-90">ISRO Satellite Mapping - Real-time Infrastructure</p>
          </div>
          <div className="flex items-center space-x-2">
            {userLocation && (
              <button
                onClick={centerOnUserLocation}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
              >
                <Crosshair className="w-4 h-4" />
                <span>My Location</span>
              </button>
            )}
            <div className="text-right">
              <p className="text-sm opacity-75">Coverage Area</p>
              <p className="font-medium">2.4 km²</p>
            </div>
          </div>
        </div>
      </div>

      {/* Location Error Banner */}
      {locationError && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2" />
              <p className="text-sm text-yellow-800">{locationError}</p>
            </div>
            {locationError.includes('denied') && (
              <button
                onClick={requestLocationPermission}
                className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-3 py-1 rounded text-sm font-medium transition-colors"
              >
                Enable Location
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex">
        {/* Layer Controls */}
        <div className="w-64 bg-gray-50 p-4 border-r">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center">
            <Layers className="w-4 h-4 mr-2" />
            Map Layers
          </h3>
          <div className="space-y-2">
            {layers.map((layer) => (
              <button
                key={layer.id}
                onClick={() => setSelectedLayer(layer.id)}
                className={`w-full text-left p-2 rounded-lg transition-colors ${
                  selectedLayer === layer.id
                    ? 'bg-purple-100 text-purple-700 border border-purple-300'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{layer.name}</span>
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                    {layer.count}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Map Type Controls */}
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-2">Map Type</h4>
            <div className="space-y-1">
              {[
                { id: 'satellite', name: 'Satellite' },
                { id: 'hybrid', name: 'Hybrid' },
                { id: 'terrain', name: 'Terrain' }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => changeMapType(type.id)}
                  className={`w-full text-left p-2 rounded text-sm transition-colors ${
                    mapType === type.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {type.name}
                </button>
              ))}
            </div>
          </div>

          {/* Location Info */}
          {userLocation && (
            <div className="mt-6 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                <Navigation className="w-4 h-4 mr-1" />
                Your Location
              </h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p>Lat: {userLocation.lat.toFixed(6)}</p>
                <p>Lng: {userLocation.lng.toFixed(6)}</p>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-2">Legend</h4>
            <div className="space-y-2 text-xs">
              {[
                { icon: Droplets, color: 'text-blue-500', label: 'Storage Tank' },
                { icon: Zap, color: 'text-green-500', label: 'Solar Pump' },
                { icon: Home, color: 'text-gray-600', label: 'Households' },
                { icon: CheckCircle, color: 'text-green-500', label: 'Sensor' },
                { icon: AlertTriangle, color: 'text-red-500', label: 'Issue/Leak' }
              ].map(({ icon: Icon, color, label }) => (
                <div key={label} className="flex items-center space-x-2">
                  <Icon className={`w-3 h-3 ${color}`} />
                  <span className="text-gray-600">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          {!mapLoaded ? (
            <div className="h-96 bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading Bhuvan Maps...</p>
              </div>
            </div>
          ) : (
            <div ref={mapRef} className="h-96 w-full" />
          )}

          {/* Map Controls */}
          {mapLoaded && (
            <div className="absolute top-4 right-4 space-y-2">
              <div className="bg-white rounded-lg p-2 shadow-md">
                <div className="text-xs font-bold text-gray-600 text-center mb-1">N</div>
                <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex items-center justify-center">
                  <div className="w-1 h-3 bg-red-500"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Point Details Panel */}
      {selectedPoint && (
        <div className="border-t bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center">
              {React.createElement(getIconComponent(selectedPoint.type), { 
                className: `w-4 h-4 mr-2 ${
                  selectedPoint.status === 'warning' ? 'text-yellow-500' :
                  selectedPoint.status === 'critical' || selectedPoint.type === 'leak' ? 'text-red-500' :
                  'text-green-500'
                }` 
              })}
              {selectedPoint.name}
            </h3>
            <button
              onClick={() => setSelectedPoint(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {Object.entries(selectedPoint)
              .filter(([key]) => !['id', 'type', 'lat', 'lng', 'name'].includes(key))
              .map(([key, value]) => (
                <div key={key} className="text-center p-2 bg-white rounded border">
                  <p className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                  <p className="font-medium text-gray-900">{value}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}