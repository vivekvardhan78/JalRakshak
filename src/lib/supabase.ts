import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only create Supabase client if credentials are properly configured
export const supabase = (supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' && 
  supabaseAnonKey !== 'your-anon-key-here') 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabase !== null;
};

// Database Types
export interface SensorReading {
  id: string;
  sensor_id: string;
  sensor_type: 'flow' | 'pressure' | 'quality' | 'temperature' | 'ph' | 'turbidity';
  value: number;
  unit: string;
  location: string;
  timestamp: string;
  status: 'normal' | 'warning' | 'critical';
}

export interface Complaint {
  id: string;
  description: string;
  location: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'resolved';
  submitted_by: string;
  submitted_at: string;
  photo_url?: string;
  gps_coordinates?: string;
  resolved_at?: string;
  assigned_to?: string;
}

export interface MaintenanceTask {
  id: string;
  task: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  due_date: string;
  assigned_to: string;
  completed_at?: string;
  location: string;
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  source: string;
  timestamp: string;
  acknowledged: boolean;
  resolved: boolean;
  sensor_id?: string;
  threshold_value?: number;
  current_value?: number;
}

// API Functions
export class JalRakshakAPI {
  // Sensor Data
  static async getLatestSensorReadings() {
    if (!supabase) {
      console.warn('Supabase not configured, returning mock data');
      return [];
    }
    
    const { data, error } = await supabase
      .from('sensor_readings')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    return data;
  }

  static async getSensorReadingsByType(sensorType: string) {
    if (!supabase) {
      console.warn('Supabase not configured, returning mock data');
      return [];
    }
    
    const { data, error } = await supabase
      .from('sensor_readings')
      .select('*')
      .eq('sensor_type', sensorType)
      .order('timestamp', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    return data;
  }

  static async insertSensorReading(reading: Omit<SensorReading, 'id'>) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    const { data, error } = await supabase
      .from('sensor_readings')
      .insert([reading])
      .select();
    
    if (error) throw error;
    return data[0];
  }

  // Complaints
  static async getComplaints() {
    if (!supabase) {
      console.warn('Supabase not configured, returning mock data');
      return [];
    }
    
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('submitted_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async submitComplaint(complaint: Omit<Complaint, 'id' | 'submitted_at'>) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    const { data, error } = await supabase
      .from('complaints')
      .insert([{
        ...complaint,
        submitted_at: new Date().toISOString()
      }])
      .select();
    
    if (error) throw error;
    return data[0];
  }

  static async updateComplaintStatus(id: string, status: string, assignedTo?: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    const updateData: any = { status };
    if (assignedTo) updateData.assigned_to = assignedTo;
    if (status === 'resolved') updateData.resolved_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('complaints')
      .update(updateData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  }

  // Maintenance Tasks
  static async getMaintenanceTasks() {
    if (!supabase) {
      console.warn('Supabase not configured, returning mock data');
      return [];
    }
    
    const { data, error } = await supabase
      .from('maintenance_tasks')
      .select('*')
      .order('due_date', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  static async createMaintenanceTask(task: Omit<MaintenanceTask, 'id'>) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    const { data, error } = await supabase
      .from('maintenance_tasks')
      .insert([task])
      .select();
    
    if (error) throw error;
    return data[0];
  }

  static async completeMaintenanceTask(id: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    const { data, error } = await supabase
      .from('maintenance_tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  }

  // Alerts
  static async getAlerts() {
    if (!supabase) {
      console.warn('Supabase not configured, returning mock data');
      return [];
    }
    
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async createAlert(alert: Omit<Alert, 'id'>) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    const { data, error } = await supabase
      .from('alerts')
      .insert([alert])
      .select();
    
    if (error) throw error;
    return data[0];
  }

  static async acknowledgeAlert(id: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    const { data, error } = await supabase
      .from('alerts')
      .update({ acknowledged: true })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  }

  static async resolveAlert(id: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    const { data, error } = await supabase
      .from('alerts')
      .update({ resolved: true, acknowledged: true })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  }

  // Real-time subscriptions
  static subscribeTo(table: string, callback: (payload: any) => void) {
    if (!supabase) {
      console.warn('Supabase not configured, real-time subscriptions disabled');
      return { unsubscribe: () => {} };
    }
    
    return supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table }, 
        callback
      )
      .subscribe();
  }

  // Analytics
  static async getConsumptionAnalytics(days: number = 7) {
    if (!supabase) {
      console.warn('Supabase not configured, returning mock data');
      return [];
    }
    
    const { data, error } = await supabase
      .from('sensor_readings')
      .select('value, timestamp')
      .eq('sensor_type', 'flow')
      .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  static async getSystemHealth() {
    if (!supabase) {
      console.warn('Supabase not configured, returning mock data');
      return {};
    }
    
    const { data, error } = await supabase
      .from('sensor_readings')
      .select('sensor_type, status, timestamp')
      .order('timestamp', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    
    // Process data to get latest status for each sensor type
    const healthMap = new Map();
    data.forEach(reading => {
      if (!healthMap.has(reading.sensor_type)) {
        healthMap.set(reading.sensor_type, reading.status);
      }
    });
    
    return Object.fromEntries(healthMap);
  }
}