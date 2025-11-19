import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { MobileApp } from './components/MobileApp';
import { GISMap } from './components/GISMap';
import { AlertSystem } from './components/AlertSystem';
import { Smartphone, Monitor, Map, Bell } from 'lucide-react';

function App() {
  const [activeView, setActiveView] = useState<'dashboard' | 'mobile' | 'gis' | 'alerts'>('dashboard');
  const [sensorData, setSensorData] = useState({
    waterFlow: 45.2,
    pressure: 3.8,
    quality: 95,
    temperature: 24.5,
    ph: 7.2,
    turbidity: 0.8,
    solarPumpStatus: 'active'
  });

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSensorData(prev => ({
        ...prev,
        waterFlow: prev.waterFlow + (Math.random() - 0.5) * 2,
        pressure: Math.max(0, prev.pressure + (Math.random() - 0.5) * 0.2),
        quality: Math.max(85, Math.min(100, prev.quality + (Math.random() - 0.5) * 2)),
        temperature: prev.temperature + (Math.random() - 0.5) * 0.5,
        ph: Math.max(6.5, Math.min(8.5, prev.ph + (Math.random() - 0.5) * 0.1)),
        turbidity: Math.max(0, prev.turbidity + (Math.random() - 0.5) * 0.1)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const navigationButtons = [
    { id: 'dashboard', label: 'Control Dashboard', icon: Monitor, color: 'bg-blue-500' },
    { id: 'mobile', label: 'Mobile App', icon: Smartphone, color: 'bg-green-500' },
    { id: 'gis', label: 'GIS Mapping', icon: Map, color: 'bg-purple-500' },
    { id: 'alerts', label: 'Alert System', icon: Bell, color: 'bg-red-500' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/WhatsApp Image 2025-09-29 at 19.24.06_6ea8945d.jpg" 
                alt="JalRakshak Logo" 
                className="w-12 h-12 rounded-lg object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">JalRakshak</h1>
                <p className="text-sm text-gray-600">Smart Rural Water Management Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span>System Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto py-3">
            {navigationButtons.map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => setActiveView(id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                  activeView === id
                    ? `${color} text-white shadow-lg`
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeView === 'dashboard' && <Dashboard sensorData={sensorData} />}
        {activeView === 'mobile' && <MobileApp sensorData={sensorData} />}
        {activeView === 'gis' && <GISMap />}
        {activeView === 'alerts' && <AlertSystem sensorData={sensorData} />}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-3">JalRakshak Features</h3>
              <ul className="space-y-1 text-gray-300">
                <li>• Real-time IoT sensor monitoring</li>
                <li>• AI-powered leak detection</li>
                <li>• Water quality analysis</li>
                <li>• Solar pump automation</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-3">Technology Stack</h3>
              <ul className="space-y-1 text-gray-300">
                <li>• IoT sensors with 4G connectivity</li>
                <li>• Machine learning algorithms</li>
                <li>• GIS mapping integration</li>
                <li>• Mobile-first design</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-3">Impact</h3>
              <ul className="space-y-1 text-gray-300">
                <li>• 40% reduction in water loss</li>
                <li>• 90% faster leak detection</li>
                <li>• Improved rural water access</li>
                <li>• Enhanced community engagement</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400">
            <p>&copy; 2025 JalRakshak Platform. Empowering rural communities with smart water management.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;