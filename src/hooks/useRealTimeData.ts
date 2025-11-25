import { useState, useEffect } from 'react';
import { JalRakshakAPI, SensorReading, Complaint, Alert } from '../lib/supabase';

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
        setSensorData(prev => ({
          ...prev,
          [newReading.sensor_type === 'flow' ? 'waterFlow' : newReading.sensor_type]: newReading.value
        }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { sensorData, loading, error };
}

// Custom hook for complaints
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

  const submitComplaint = async (complaintData: Omit<Complaint, 'id' | 'submitted_at'>) => {
    try {
      await JalRakshakAPI.submitComplaint(complaintData);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to submit complaint');
    }
  };

  return { complaints, loading, error, submitComplaint };
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