import React, { useState } from 'react';
import { 
  Map, 
  Home, 
  Factory, 
  Droplets, 
  Zap,
  AlertTriangle,
  CheckCircle,
  Eye,
  Layers
} from 'lucide-react';

export function GISMap() {
  const [selectedLayer, setSelectedLayer] = useState('all');
  const [selectedPoint, setSelectedPoint] = useState<any>(null);

  const mapPoints = [
    { id: 1, type: 'tank', x: 30, y: 20, name: 'Main Storage Tank', capacity: '5000L', status: 'normal', level: '85%' },
    { id: 2, type: 'pump', x: 25, y: 25, name: 'Solar Pump Station', power: '2kW', status: 'active', output: '420W' },
    { id: 3, type: 'household', x: 45, y: 35, name: 'Ward 1 - 42 Homes', connections: 42, status: 'normal', consumption: '2.8kL/day' },
    { id: 4, type: 'household', x: 55, y: 45, name: 'Ward 2 - 38 Homes', connections: 38, status: 'normal', consumption: '2.5kL/day' },
    { id: 5, type: 'household', x: 35, y: 55, name: 'Ward 3 - 31 Homes', connections: 31, status: 'warning', consumption: '1.9kL/day' },
    { id: 6, type: 'leak', x: 40, y: 40, name: 'Detected Leak', severity: 'medium', flow: '2.3L/min', detected: '2 hours ago' },
    { id: 7, type: 'sensor', x: 50, y: 30, name: 'Pressure Sensor P1', reading: '3.8 bar', status: 'normal', battery: '92%' },
    { id: 8, type: 'sensor', x: 35, y: 45, name: 'Flow Sensor F1', reading: '45.2 L/min', status: 'normal', battery: '88%' }
  ];

  const pipelines = [
    { from: mapPoints[0], to: mapPoints[6], status: 'normal' },
    { from: mapPoints[6], to: mapPoints[2], status: 'normal' },
    { from: mapPoints[6], to: mapPoints[3], status: 'normal' },
    { from: mapPoints[6], to: mapPoints[4], status: 'warning' },
    { from: mapPoints[1], to: mapPoints[0], status: 'normal' }
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

  const getPointColor = (type: string, status: string) => {
    if (status === 'warning') return 'text-yellow-500 bg-yellow-100';
    if (status === 'critical' || type === 'leak') return 'text-red-500 bg-red-100';
    if (status === 'active' || status === 'normal') return 'text-green-500 bg-green-100';
    return 'text-blue-500 bg-blue-100';
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

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center">
              <Map className="w-5 h-5 mr-2" />
              GIS Water Network Map
            </h2>
            <p className="text-sm opacity-90">Village Infrastructure Overview</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-75">Coverage Area</p>
            <p className="font-medium">2.4 km²</p>
          </div>
        </div>
      </div>

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

        {/* Map Area */}
        <div className="flex-1 relative">
          <div className="h-96 bg-gradient-to-br from-green-100 to-blue-100 relative overflow-hidden">
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-20">
              <svg width="100%" height="100%" className="absolute inset-0">
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#94a3b8" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Pipelines */}
            <svg className="absolute inset-0 w-full h-full">
              {pipelines.map((pipeline, index) => (
                <line
                  key={index}
                  x1={`${pipeline.from.x}%`}
                  y1={`${pipeline.from.y}%`}
                  x2={`${pipeline.to.x}%`}
                  y2={`${pipeline.to.y}%`}
                  stroke={pipeline.status === 'warning' ? '#f59e0b' : '#3b82f6'}
                  strokeWidth="3"
                  strokeDasharray={pipeline.status === 'warning' ? '5,5' : 'none'}
                  className="drop-shadow-sm"
                />
              ))}
            </svg>

            {/* Map Points */}
            {filteredPoints.map((point) => {
              const IconComponent = getIconComponent(point.type);
              return (
                <button
                  key={point.id}
                  onClick={() => setSelectedPoint(point)}
                  style={{ left: `${point.x}%`, top: `${point.y}%` }}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 p-2 rounded-full border-2 border-white shadow-lg transition-all duration-200 hover:scale-110 ${getPointColor(point.type, point.status)}`}
                >
                  <IconComponent className="w-5 h-5" />
                </button>
              );
            })}

            {/* Compass */}
            <div className="absolute top-4 right-4 bg-white rounded-lg p-3 shadow-md">
              <div className="w-8 h-8 flex items-center justify-center text-xs font-bold text-gray-600 border-2 border-gray-300 rounded-full">
                N
              </div>
            </div>
          </div>

          {/* Point Details Panel */}
          {selectedPoint && (
            <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-xl border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  {React.createElement(getIconComponent(selectedPoint.type), { 
                    className: `w-4 h-4 mr-2 ${getPointColor(selectedPoint.type, selectedPoint.status).split(' ')[0]}` 
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
                  .filter(([key]) => !['id', 'type', 'x', 'y', 'name'].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                      <p className="font-medium text-gray-900">{value}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}