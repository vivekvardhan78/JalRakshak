import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    const { data, error } = await supabase
      .from('sensor_readings')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    return data;
  }

  static async getSensorReadingsByType(sensorType: string) {
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
    const { data, error } = await supabase
      .from('sensor_readings')
      .insert([reading])
      .select();
    
    if (error) throw error;
    return data[0];
  }

  // Complaints
  static async getComplaints() {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('submitted_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async submitComplaint(complaint: Omit<Complaint, 'id' | 'submitted_at'>) {
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
    const { data, error } = await supabase
      .from('maintenance_tasks')
      .select('*')
      .order('due_date', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  static async createMaintenanceTask(task: Omit<MaintenanceTask, 'id'>) {
    const { data, error } = await supabase
      .from('maintenance_tasks')
      .insert([task])
      .select();
    
    if (error) throw error;
    return data[0];
  }

  static async completeMaintenanceTask(id: string) {
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
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async createAlert(alert: Omit<Alert, 'id'>) {
    const { data, error } = await supabase
      .from('alerts')
      .insert([alert])
      .select();
    
    if (error) throw error;
    return data[0];
  }

  static async acknowledgeAlert(id: string) {
    const { data, error } = await supabase
      .from('alerts')
      .update({ acknowledged: true })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  }

  static async resolveAlert(id: string) {
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