import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  Bell, 
  Clock,
  Zap,
  Droplets,
  TrendingDown,
  Settings,
  X
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

interface AlertSystemProps {
  sensorData: SensorData;
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  source: string;
  acknowledged: boolean;
  resolved: boolean;
  actions?: string[];
}

export function AlertSystem({ sensorData }: AlertSystemProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  // Generate alerts based on sensor data
  useEffect(() => {
    const newAlerts: Alert[] = [];

    if (sensorData.pressure < 3.0) {
      newAlerts.push({
        id: `pressure-${Date.now()}`,
        type: 'critical',
        title: 'Low System Pressure Detected',
        description: `Pressure has dropped to ${sensorData.pressure.toFixed(1)} bar, below the critical threshold of 3.0 bar.`,
        timestamp: new Date().toLocaleString(),
        source: 'Pressure Sensor P1',
        acknowledged: false,
        resolved: false,
        actions: ['Check pump operation', 'Inspect for leaks', 'Contact maintenance team']
      });
    }

    if (sensorData.waterFlow < 35) {
      newAlerts.push({
        id: `flow-${Date.now()}`,
        type: 'warning',
        title: 'Low Water Flow Rate',
        description: `Flow rate is ${sensorData.waterFlow.toFixed(1)} L/min, below optimal range.`,
        timestamp: new Date().toLocaleString(),
        source: 'Flow Sensor F1',
        acknowledged: false,
        resolved: false,
        actions: ['Check filter condition', 'Verify pump settings', 'Inspect inlet valve']
      });
    }

    if (sensorData.quality < 90) {
      newAlerts.push({
        id: `quality-${Date.now()}`,
        type: 'warning',
        title: 'Water Quality Below Standard',
        description: `Quality index is ${sensorData.quality.toFixed(0)}%, below the recommended 90% threshold.`,
        timestamp: new Date().toLocaleString(),
        source: 'Quality Sensor Q1',
        acknowledged: false,
        resolved: false,
        actions: ['Test chlorine levels', 'Check filtration system', 'Schedule water sampling']
      });
    }

    if (sensorData.ph < 6.5 || sensorData.ph > 8.5) {
      newAlerts.push({
        id: `ph-${Date.now()}`,
        type: 'warning',
        title: 'pH Level Out of Range',
        description: `pH level is ${sensorData.ph.toFixed(1)}, outside the safe range of 6.5-8.5.`,
        timestamp: new Date().toLocaleString(),
        source: 'pH Sensor',
        acknowledged: false,
        resolved: false,
        actions: ['Test pH manually', 'Check sensor calibration', 'Adjust treatment system']
      });
    }

    // Add some static alerts for demonstration
    const staticAlerts: Alert[] = [
      {
        id: 'leak-001',
        type: 'critical',
        title: 'Pipeline Leak Detected',
        description: 'AI algorithms detected potential leak in Ward 3 distribution line based on pressure drop patterns.',
        timestamp: '2025-01-21 14:30:00',
        source: 'ML Leak Detection',
        acknowledged: false,
        resolved: false,
        actions: ['Dispatch field team', 'Isolate affected section', 'Notify affected households']
      },
      {
        id: 'maintenance-001',
        type: 'info',
        title: 'Scheduled Maintenance Reminder',
        description: 'Monthly tank cleaning is due for Main Storage Tank.',
        timestamp: '2025-01-21 12:00:00',
        source: 'Maintenance Schedule',
        acknowledged: true,
        resolved: false,
        actions: ['Schedule cleaning crew', 'Notify supervisor', 'Prepare equipment']
      },
      {
        id: 'consumption-001',
        type: 'warning',
        title: 'Unusual Consumption Pattern',
        description: 'Ward 2 showing 25% higher than average water consumption in the last 24 hours.',
        timestamp: '2025-01-21 10:15:00',
        source: 'Consumption Analytics',
        acknowledged: true,
        resolved: true,
        actions: ['Investigate cause', 'Check for leaks', 'Contact ward representative']
      }
    ];

    setAlerts([...newAlerts, ...staticAlerts]);
  }, [sensorData]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return AlertTriangle;
      case 'warning': return AlertCircle;
      case 'info': return CheckCircle;
      default: return Bell;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'from-red-500 to-red-600';
      case 'warning': return 'from-yellow-500 to-yellow-600';
      case 'info': return 'from-blue-500 to-blue-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'critical': return 'border-red-200';
      case 'warning': return 'border-yellow-200';
      case 'info': return 'border-blue-200';
      default: return 'border-gray-200';
    }
  };

  const filteredAlerts = filter === 'all' ? alerts : alerts.filter(alert => alert.type === filter);
  const criticalCount = alerts.filter(a => a.type === 'critical' && !a.resolved).length;
  const warningCount = alerts.filter(a => a.type === 'warning' && !a.resolved).length;

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true, acknowledged: true } : alert
    ));
  };

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Critical Alerts', count: criticalCount, color: 'from-red-500 to-red-600', icon: AlertTriangle },
          { label: 'Warnings', count: warningCount, color: 'from-yellow-500 to-yellow-600', icon: AlertCircle },
          { label: 'Total Active', count: alerts.filter(a => !a.resolved).length, color: 'from-blue-500 to-blue-600', icon: Bell },
          { label: 'Resolved Today', count: alerts.filter(a => a.resolved).length, color: 'from-green-500 to-green-600', icon: CheckCircle }
        ].map(({ label, count, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className={`bg-gradient-to-r ${color} p-4`}>
              <div className="flex items-center justify-between text-white">
                <Icon className="w-8 h-8" />
                <span className="text-2xl font-bold">{count}</span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-600">{label}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-2 overflow-x-auto">
        {['all', 'critical', 'warning', 'info'].map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
              filter === filterType
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <span className="capitalize">{filterType}</span>
            <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">
              {filterType === 'all' ? alerts.length : alerts.filter(a => a.type === filterType).length}
            </span>
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => {
          const IconComponent = getAlertIcon(alert.type);
          return (
            <div
              key={alert.id}
              className={`bg-white rounded-xl shadow-lg border-l-4 ${getBorderColor(alert.type)} ${
                alert.resolved ? 'opacity-60' : ''
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`bg-gradient-to-r ${getAlertColor(alert.type)} p-2 rounded-lg`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{alert.title}</h3>
                        {alert.acknowledged && (
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                            Acknowledged
                          </span>
                        )}
                        {alert.resolved && (
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                            Resolved
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 mb-2">{alert.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{alert.timestamp}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Settings className="w-4 h-4" />
                          <span>{alert.source}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}
                    {!alert.resolved && (
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Resolve
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedAlert(alert)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Bell className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {alert.actions && alert.actions.length > 0 && !alert.resolved && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Recommended Actions:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {alert.actions.map((action, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Alerts Found</h3>
          <p className="text-gray-600">All systems are operating normally.</p>
        </div>
      )}

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{selectedAlert.title}</h3>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Description</h4>
                  <p className="text-gray-600">{selectedAlert.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Source</h4>
                    <p className="text-gray-600">{selectedAlert.source}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Timestamp</h4>
                    <p className="text-gray-600">{selectedAlert.timestamp}</p>
                  </div>
                </div>
                {selectedAlert.actions && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Recommended Actions</h4>
                    <ul className="space-y-2">
                      {selectedAlert.actions.map((action, index) => (
                        <li key={index} className="flex items-center space-x-2 text-gray-600">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex space-x-3 pt-4">
                  {!selectedAlert.acknowledged && (
                    <button
                      onClick={() => {
                        acknowledgeAlert(selectedAlert.id);
                        setSelectedAlert(null);
                      }}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                  {!selectedAlert.resolved && (
                    <button
                      onClick={() => {
                        resolveAlert(selectedAlert.id);
                        setSelectedAlert(null);
                      }}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}