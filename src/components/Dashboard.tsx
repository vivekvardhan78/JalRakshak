import React from 'react';
import { useSensorData, useAnalytics } from '../hooks/useRealTimeData';
import { 
  Droplets, 
  Gauge, 
  Shield, 
  Thermometer, 
  Zap, 
  Users, 
  TrendingUp,
  Activity,
  Sun,
  Settings
} from 'lucide-react';

interface SensorData {
  waterFlow: number;
  pressure: number;
  quality: number;
  temperature: number;
  ph: number;
  turbidity: number;
  solarPumpStatus: string;
}

interface DashboardProps {
  sensorData: SensorData;
}

export function Dashboard({ sensorData }: DashboardProps) {
  // Use real-time data hooks
  const { sensorData: realTimeSensorData, loading: sensorLoading, error: sensorError } = useSensorData();
  const { analytics, loading: analyticsLoading } = useAnalytics();
  
  // Use real-time data if available, fallback to props
  const currentSensorData = sensorLoading ? sensorData : realTimeSensorData;

  if (sensorError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading sensor data: {sensorError}</p>
      </div>
    );
  }

  const metrics = [
    {
      label: 'Water Flow Rate',
      value: `${currentSensorData.waterFlow.toFixed(1)} L/min`,
      icon: Droplets,
      color: 'from-blue-500 to-blue-600',
      status: currentSensorData.waterFlow > 40 ? 'normal' : 'warning'
    },
    {
      label: 'System Pressure',
      value: `${currentSensorData.pressure.toFixed(1)} bar`,
      icon: Gauge,
      color: 'from-green-500 to-green-600',
      status: currentSensorData.pressure > 3 ? 'normal' : 'critical'
    },
    {
      label: 'Water Quality',
      value: `${currentSensorData.quality.toFixed(0)}%`,
      icon: Shield,
      color: 'from-emerald-500 to-emerald-600',
      status: currentSensorData.quality > 90 ? 'normal' : 'warning'
    },
    {
      label: 'Temperature',
      value: `${currentSensorData.temperature.toFixed(1)}°C`,
      icon: Thermometer,
      color: 'from-orange-500 to-orange-600',
      status: 'normal'
    }
  ];

  const additionalMetrics = [
    { label: 'pH Level', value: currentSensorData.ph.toFixed(1), unit: 'pH' },
    { label: 'Turbidity', value: currentSensorData.turbidity.toFixed(1), unit: 'NTU' },
    { label: 'Active Connections', value: '247', unit: 'homes' },
    { label: 'Daily Consumption', value: '12,450', unit: 'L' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map(({ label, value, icon: Icon, color, status }) => (
          <div key={label} className="bg-white rounded-xl shadow-lg overflow-hidden">
            {sensorLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            )}
            <div className={`bg-gradient-to-r ${color} p-4`}>
              <div className="flex items-center justify-between text-white">
                <Icon className="w-8 h-8" />
                <div className={`w-3 h-3 rounded-full ${
                  status === 'normal' ? 'bg-white' : 
                  status === 'warning' ? 'bg-yellow-300' : 'bg-red-300'
                } animate-pulse`}></div>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-1">{label}</h3>
              <p className={`text-2xl font-bold ${getStatusColor(status)}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* System Status Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Solar Pump Status */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Sun className="w-5 h-5 text-yellow-500 mr-2" />
              Solar Pump System
            </h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium">Active</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">95%</p>
              <p className="text-sm text-gray-600">Battery Level</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">420W</p>
              <p className="text-sm text-gray-600">Power Output</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 text-blue-500 mr-2" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {[
              { time: '10:30 AM', event: 'Pressure sensor calibrated', type: 'maintenance' },
              { time: '09:45 AM', event: 'Water quality test completed', type: 'routine' },
              { time: '09:15 AM', event: 'Citizen complaint resolved', type: 'service' },
              { time: '08:30 AM', event: 'Daily backup completed', type: 'system' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'maintenance' ? 'bg-yellow-500' :
                  activity.type === 'routine' ? 'bg-green-500' :
                  activity.type === 'service' ? 'bg-blue-500' : 'bg-gray-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.event}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 text-purple-500 mr-2" />
          Detailed Analytics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {additionalMetrics.map(({ label, value, unit }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-600">{label}</p>
              <p className="text-xs text-gray-500">{unit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Settings className="w-5 h-5 text-gray-500 mr-2" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Run Diagnostics', color: 'bg-blue-500 hover:bg-blue-600' },
            { label: 'Generate Report', color: 'bg-green-500 hover:bg-green-600' },
            { label: 'Schedule Maintenance', color: 'bg-yellow-500 hover:bg-yellow-600' },
            { label: 'View Complaints', color: 'bg-purple-500 hover:bg-purple-600' }
          ].map(({ label, color }) => (
            <button
              key={label}
              className={`${color} text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 text-sm`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}