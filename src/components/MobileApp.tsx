import React, { useState } from 'react';
import { useComplaints } from '../hooks/useRealTimeData';
import { 
  Plus, 
  Send, 
  Camera, 
  MapPin, 
  Calendar,
  CheckCircle,
  AlertCircle,
  User,
  Phone,
  Mail,
  Image,
  Navigation
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

interface MobileAppProps {
  sensorData: SensorData;
}

export function MobileApp({ sensorData }: MobileAppProps) {
  // Use real-time complaints data
  const { complaints: realTimeComplaints, loading: complaintsLoading, submitComplaint } = useComplaints();
  
  const [activeTab, setActiveTab] = useState<'readings' | 'complaints' | 'maintenance'>('readings');
  const [newReading, setNewReading] = useState({
    location: '',
    reading: '',
    notes: ''
  });
  const [complaint, setComplaint] = useState({
    description: '',
    location: '',
    priority: 'medium',
    hasPhoto: false,
    hasGPS: false,
    gpsCoordinates: ''
  });

  const recentReadings = [
    { location: 'Village Center Tank', value: '1850 L', time: '2 hours ago', status: 'normal' },
    { location: 'School Connection', value: '45.2 L/min', time: '3 hours ago', status: 'normal' },
    { location: 'Pump House', value: '3.8 bar', time: '4 hours ago', status: 'warning' },
    { location: 'Distribution Point A', value: '95% quality', time: '5 hours ago', status: 'normal' }
  ];

  const maintenanceTasks = [
    { task: 'Clean storage tank', due: 'Today', priority: 'high', completed: false },
    { task: 'Check pipeline joints', due: 'Tomorrow', priority: 'medium', completed: false },
    { task: 'Calibrate pressure sensors', due: 'Dec 28', priority: 'low', completed: true },
    { task: 'Solar panel cleaning', due: 'Dec 30', priority: 'medium', completed: false }
  ];

  const handleReadingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate submission
    alert('Reading logged successfully!');
    setNewReading({ location: '', reading: '', notes: '' });
  };

  const handleComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const complaintData = {
      description: complaint.description,
      location: complaint.location,
      priority: complaint.priority as 'low' | 'medium' | 'high',
      status: 'pending' as const,
      submitted_by: 'field-staff-001', // This would come from authentication
      photo_url: complaint.hasPhoto ? 'photo-url-here' : undefined,
      gps_coordinates: complaint.hasGPS ? complaint.gpsCoordinates : undefined
    };

    submitComplaint(complaintData)
      .then(() => {
        alert('Complaint submitted successfully!');
        setComplaint({ 
          description: '', 
          location: '', 
          priority: 'medium',
          hasPhoto: false,
          hasGPS: false,
          gpsCoordinates: ''
        });
      })
      .catch((error) => {
        alert(`Error submitting complaint: ${error.message}`);
      });
  };

  const handlePhotoCapture = () => {
    // Simulate photo capture
    setComplaint({...complaint, hasPhoto: true});
    alert('Photo captured successfully!');
  };

  const handleGPSCapture = () => {
    // Simulate GPS capture
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
          setComplaint({...complaint, hasGPS: true, gpsCoordinates: coords});
          alert(`GPS location captured: ${coords}`);
        },
        () => {
          // Fallback for demo
          const demoCoords = '23.2599, 77.4126'; // Sample coordinates
          setComplaint({...complaint, hasGPS: true, gpsCoordinates: demoCoords});
          alert(`GPS location captured: ${demoCoords}`);
        }
      );
    } else {
      // Fallback for demo
      const demoCoords = '23.2599, 77.4126';
      setComplaint({...complaint, hasGPS: true, gpsCoordinates: demoCoords});
      alert(`GPS location captured: ${demoCoords}`);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
      {/* Mobile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">JalRakshak Mobile</h2>
            <p className="text-sm opacity-90">Field Staff Interface</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-75">Last Sync</p>
            <p className="text-sm font-medium">2 min ago</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-gray-50 border-b">
        {[
          { id: 'readings', label: 'Readings', icon: Plus },
          { id: 'complaints', label: 'Complaints', icon: Send },
          { id: 'maintenance', label: 'Tasks', icon: Calendar }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex-1 flex items-center justify-center space-x-1 py-3 px-2 text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4 h-96 overflow-y-auto">
        {activeTab === 'readings' && (
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <p className="text-lg font-bold text-blue-600">{sensorData.waterFlow.toFixed(1)}</p>
                <p className="text-xs text-gray-600">Flow Rate (L/min)</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <p className="text-lg font-bold text-green-600">{sensorData.pressure.toFixed(1)}</p>
                <p className="text-xs text-gray-600">Pressure (bar)</p>
              </div>
            </div>

            {/* Log New Reading Form */}
            <form onSubmit={handleReadingSubmit} className="space-y-3">
              <h3 className="font-medium text-gray-900">Log New Reading</h3>
              <input
                type="text"
                placeholder="Location (e.g., Tank A, Pump 2)"
                value={newReading.location}
                onChange={(e) => setNewReading({...newReading, location: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                required
              />
              <input
                type="text"
                placeholder="Reading value"
                value={newReading.reading}
                onChange={(e) => setNewReading({...newReading, reading: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                required
              />
              <textarea
                placeholder="Notes (optional)"
                value={newReading.notes}
                onChange={(e) => setNewReading({...newReading, notes: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm h-16"
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Log Reading
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Camera className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </form>

            {/* Recent Readings */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Recent Readings</h3>
              <div className="space-y-2">
                {recentReadings.map((reading, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{reading.location}</p>
                      <p className="text-xs text-gray-600">{reading.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{reading.value}</p>
                      <div className={`w-2 h-2 rounded-full ml-auto ${
                        reading.status === 'normal' ? 'bg-green-400' : 'bg-yellow-400'
                      }`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'complaints' && (
          <div className="space-y-4">
            {/* Submit Complaint Form */}
            <form onSubmit={handleComplaintSubmit} className="space-y-3">
              <h3 className="font-medium text-gray-900">Citizen Complaint</h3>
              <textarea
                placeholder="Describe the issue..."
                value={complaint.description}
                onChange={(e) => setComplaint({...complaint, description: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm h-20"
                required
              />
              <input
                type="text"
                placeholder="Location"
                value={complaint.location}
                onChange={(e) => setComplaint({...complaint, location: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                required
              />
              <select
                value={complaint.priority}
                onChange={(e) => setComplaint({...complaint, priority: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              
              {/* Photo and GPS Options */}
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handlePhotoCapture}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    complaint.hasPhoto 
                      ? 'bg-green-100 text-green-700 border border-green-300' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>{complaint.hasPhoto ? 'Photo Added' : 'Add Photo'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleGPSCapture}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    complaint.hasGPS 
                      ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Navigation className="w-4 h-4" />
                  <span>{complaint.hasGPS ? 'GPS Added' : 'Add GPS'}</span>
                </button>
              </div>
              
              {/* Show GPS coordinates if captured */}
              {complaint.hasGPS && complaint.gpsCoordinates && (
                <div className="p-2 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600 font-medium">GPS Coordinates:</p>
                  <p className="text-sm text-blue-800 font-mono">{complaint.gpsCoordinates}</p>
                </div>
              )}
              
              <button
                type="submit"
                className="w-full bg-red-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Submit Complaint
              </button>
            </form>

            {/* Recent Complaints */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Recent Complaints</h3>
              {complaintsLoading && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              )}
              <div className="space-y-2">
                {realTimeComplaints.slice(0, 3).map((complaint) => (
                  <div key={complaint.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-500">#{complaint.id}</span>
                      <div className={`flex items-center space-x-1 ${
                        complaint.status === 'resolved' ? 'text-green-600' :
                        complaint.status === 'in-progress' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {complaint.status === 'resolved' ? 
                          <CheckCircle className="w-3 h-3" /> : 
                          <AlertCircle className="w-3 h-3" />
                        }
                        <span className="text-xs font-medium capitalize">{complaint.status}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-900">{complaint.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-600">{new Date(complaint.submitted_at).toLocaleDateString()}</p>
                      <div className="flex items-center space-x-2">
                        {complaint.photo_url && (
                          <div className="flex items-center space-x-1 text-green-600">
                            <Image className="w-3 h-3" />
                            <span className="text-xs">Photo</span>
                          </div>
                        )}
                        {complaint.gps_coordinates && (
                          <div className="flex items-center space-x-1 text-blue-600">
                            <Navigation className="w-3 h-3" />
                            <span className="text-xs">GPS</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Maintenance Schedule</h3>
            <div className="space-y-2">
              {maintenanceTasks.map((task, index) => (
                <div key={index} className={`p-3 rounded-lg border ${
                  task.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${
                      task.completed ? 'text-green-900' : 'text-gray-900'
                    }`}>{task.task}</span>
                    {task.completed && <CheckCircle className="w-4 h-4 text-green-600" />}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Due: {task.due}</span>
                    <span className={`font-medium ${
                      task.priority === 'high' ? 'text-red-600' :
                      task.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {task.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contact Footer */}
      <div className="bg-gray-50 p-3 border-t">
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <Phone className="w-3 h-3" />
            <span>Support: 1800-XXX-XXXX</span>
          </div>
          <div className="flex items-center space-x-1">
            <User className="w-3 h-3" />
            <span>Staff ID: JP001</span>
          </div>
        </div>
      </div>
    </div>
  );
}