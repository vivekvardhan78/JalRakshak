import { useState, useEffect } from 'react';
import { JalRakshakAPI, SensorReading, Complaint, Alert, CameraService, GPSService } from '../lib/supabase';

// Custom hook for real-time sensor data
export function useSensorData() {
  const [sensorData, setSensorData] = useState({
    waterFlow: 45.2,
    pressure: 3.8,
    quality: 95,
    temperature: 24.5,
    ph: 7.2,
    turbidity: 0.8,
    solarPumpStatus: 'active'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const readings = await JalRakshakAPI.getLatestSensorReadings();
        
        // Process readings into the expected format
        const processedData = { ...sensorData };
        readings.forEach((reading: SensorReading) => {
          switch (reading.sensor_type) {
            case 'flow':
              processedData.waterFlow = reading.value;
              break;
            case 'pressure':
              processedData.pressure = reading.value;
              break;
            case 'quality':
              processedData.quality = reading.value;
              break;
            case 'temperature':
              processedData.temperature = reading.value;
              break;
            case 'ph':
              processedData.ph = reading.value;
              break;
            case 'turbidity':
              processedData.turbidity = reading.value;
              break;
          }
        });
        
        setSensorData(processedData);
        setLastUpdate(new Date());
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch sensor data');
        setLoading(false);
      }
    };

    fetchInitialData();

    // Subscribe to real-time updates
    const subscription = JalRakshakAPI.subscribeTo('sensor_readings', (payload) => {
      if (payload.eventType === 'INSERT') {
        const newReading = payload.new as SensorReading;
        setSensorData(prev => {
          const updated = { ...prev };
          switch (newReading.sensor_type) {
            case 'flow':
              updated.waterFlow = newReading.value;
              break;
            case 'pressure':
              updated.pressure = newReading.value;
              break;
            case 'quality':
              updated.quality = newReading.value;
              break;
            case 'temperature':
              updated.temperature = newReading.value;
              break;
            case 'ph':
              updated.ph = newReading.value;
              break;
            case 'turbidity':
              updated.turbidity = newReading.value;
              break;
          }
          return updated;
        });
        setLastUpdate(new Date());
      }
    });

    // Simulate real-time data updates every 30 seconds
    const simulationInterval = setInterval(async () => {
      try {
        await JalRakshakAPI.simulateSensorData();
      } catch (error) {
        console.error('Failed to simulate sensor data:', error);
      }
    }, 30000);

    return () => {
      subscription.unsubscribe();
      clearInterval(simulationInterval);
    };
  }, []);

  return { sensorData, loading, error, lastUpdate };
}

// Custom hook for complaints with photo support
export function useComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const data = await JalRakshakAPI.getComplaints();
        setComplaints(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch complaints');
        setLoading(false);
      }
    };

    fetchComplaints();

    // Subscribe to real-time updates
    const subscription = JalRakshakAPI.subscribeTo('complaints', (payload) => {
      if (payload.eventType === 'INSERT') {
        setComplaints(prev => [payload.new as Complaint, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setComplaints(prev => 
          prev.map(complaint => 
            complaint.id === payload.new.id ? payload.new as Complaint : complaint
          )
        );
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const submitComplaint = async (
    complaintData: Omit<Complaint, 'id' | 'submitted_at'>,
    photos?: File[]
  ) => {
    try {
      await JalRakshakAPI.submitComplaint(complaintData, photos);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to submit complaint');
    }
  };

  const capturePhoto = async (): Promise<File> => {
    try {
      return await CameraService.capturePhoto();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to capture photo');
    }
  };

  const getCurrentLocation = async (): Promise<{latitude: number, longitude: number, accuracy: number}> => {
    try {
      return await GPSService.getCurrentPosition();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to get location');
    }
  };

  return { 
    complaints, 
    loading, 
    error, 
    submitComplaint, 
    capturePhoto, 
    getCurrentLocation 
  };
}

// Custom hook for alerts
export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await JalRakshakAPI.getAlerts();
        setAlerts(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
        setLoading(false);
      }
    };

    fetchAlerts();

    // Subscribe to real-time updates
    const subscription = JalRakshakAPI.subscribeTo('alerts', (payload) => {
      if (payload.eventType === 'INSERT') {
        setAlerts(prev => [payload.new as Alert, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setAlerts(prev => 
          prev.map(alert => 
            alert.id === payload.new.id ? payload.new as Alert : alert
          )
        );
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const acknowledgeAlert = async (id: string) => {
    try {
      await JalRakshakAPI.acknowledgeAlert(id);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to acknowledge alert');
    }
  };

  const resolveAlert = async (id: string) => {
    try {
      await JalRakshakAPI.resolveAlert(id);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to resolve alert');
    }
  };

  return { alerts, loading, error, acknowledgeAlert, resolveAlert };
}

// Custom hook for analytics
export function useAnalytics() {
  const [analytics, setAnalytics] = useState({
    consumption: [],
    systemHealth: {},
    trends: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [consumption, systemHealth] = await Promise.all([
          JalRakshakAPI.getConsumptionAnalytics(7),
          JalRakshakAPI.getSystemHealth()
        ]);

        setAnalytics({
          consumption,
          systemHealth,
          trends: {} // Add trend calculations here
        });
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return { analytics, loading, error };
}

// Custom hook for real-time sensor monitoring
export function useSensorMonitoring() {
  const [sensorReadings, setSensorReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReadings = async () => {
      try {
        const data = await JalRakshakAPI.getLatestSensorReadings();
        setSensorReadings(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch sensor readings');
        setLoading(false);
      }
    };

    fetchReadings();

    // Subscribe to real-time sensor updates
    const subscription = JalRakshakAPI.subscribeTo('sensor_readings', (payload) => {
      if (payload.eventType === 'INSERT') {
        setSensorReadings(prev => [payload.new as SensorReading, ...prev.slice(0, 49)]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getSensorsByType = (type: string) => {
    return sensorReadings.filter(reading => reading.sensor_type === type);
  };

  const getLatestReading = (sensorType: string) => {
    return sensorReadings.find(reading => reading.sensor_type === sensorType);
  };

  return { 
    sensorReadings, 
    loading, 
    error, 
    getSensorsByType, 
    getLatestReading 
  };
}