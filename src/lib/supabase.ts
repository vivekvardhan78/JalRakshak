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
  device_id?: string;
  battery_level?: number;
  signal_strength?: number;
}

export interface Complaint {
  id: string;
  description: string;
  location: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'resolved';
  submitted_by: string;
  submitted_at: string;
  photo_urls?: string[];
  gps_coordinates?: string;
  gps_accuracy?: number;
  resolved_at?: string;
  assigned_to?: string;
  resolution_notes?: string;
  category?: string;
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
  estimated_duration?: number;
  actual_duration?: number;
  cost?: number;
  notes?: string;
  photo_urls?: string[];
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
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_by?: string;
  resolved_at?: string;
  sensor_id?: string;
  threshold_value?: number;
  current_value?: number;
  location?: string;
  severity_score?: number;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'staff' | 'citizen';
  phone?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

// Photo Upload Helper
export class PhotoUploadService {
  static async uploadComplaintPhoto(file: File, complaintId: string): Promise<string> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `complaint_${complaintId}_${Date.now()}.${fileExt}`;
    const filePath = `complaints/${fileName}`;

    const { data, error } = await supabase.storage
      .from('complaint_photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('complaint_photos')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  }

  static async uploadMaintenancePhoto(file: File, taskId: string): Promise<string> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `maintenance_${taskId}_${Date.now()}.${fileExt}`;
    const filePath = `maintenance/${fileName}`;

    const { data, error } = await supabase.storage
      .from('maintenance_photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('maintenance_photos')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  }

  static async deletePhoto(bucket: string, filePath: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) throw error;
  }
}

// Camera Capture Helper
export class CameraService {
  static async capturePhoto(): Promise<File> {
    return new Promise((resolve, reject) => {
      // Create file input for camera
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // Use rear camera on mobile
      
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          resolve(file);
        } else {
          reject(new Error('No photo captured'));
        }
      };

      input.onclick = () => {
        // Reset input to allow same file selection
        input.value = '';
      };

      input.click();
    });
  }

  static async capturePhotoStream(): Promise<File> {
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });

      return new Promise((resolve, reject) => {
        // Create video element
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.playsInline = true;

        // Create canvas for capture
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        video.onloadedmetadata = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Auto-capture after 3 seconds or add capture button
          setTimeout(() => {
            if (context) {
              context.drawImage(video, 0, 0);
              canvas.toBlob((blob) => {
                stream.getTracks().forEach(track => track.stop());
                if (blob) {
                  const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
                  resolve(file);
                } else {
                  reject(new Error('Failed to capture photo'));
                }
              }, 'image/jpeg', 0.8);
            }
          }, 3000);
        };

        video.onerror = () => {
          stream.getTracks().forEach(track => track.stop());
          reject(new Error('Camera error'));
        };
      });
    } catch (error) {
      throw new Error('Camera access denied or not available');
    }
  }
}

// GPS Helper
export class GPSService {
  static async getCurrentPosition(): Promise<{latitude: number, longitude: number, accuracy: number}> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          let errorMessage = 'Unable to get location: ';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Permission denied';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Position unavailable';
              break;
            case error.TIMEOUT:
              errorMessage += 'Request timeout';
              break;
            default:
              errorMessage += 'Unknown error';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  }

  static formatCoordinates(lat: number, lng: number): string {
    return `POINT(${lng} ${lat})`;
  }
}

// API Functions
export class JalRakshakAPI {
  // Sensor Data
  static async getLatestSensorReadings(): Promise<SensorReading[]> {
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
    return data || [];
  }

  static async getSensorReadingsByType(sensorType: string): Promise<SensorReading[]> {
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
    return data || [];
  }

  static async insertSensorReading(reading: Omit<SensorReading, 'id'>): Promise<SensorReading> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    const { data, error } = await supabase
      .from('sensor_readings')
      .insert([reading])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Complaints with Photo Support
  static async getComplaints(): Promise<Complaint[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning mock data');
      return [];
    }
    
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('submitted_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async submitComplaint(
    complaint: Omit<Complaint, 'id' | 'submitted_at'>, 
    photos?: File[]
  ): Promise<Complaint> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    // Insert complaint first
    const { data: complaintData, error: complaintError } = await supabase
      .from('complaints')
      .insert([{
        ...complaint,
        submitted_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (complaintError) throw complaintError;

    // Upload photos if provided
    if (photos && photos.length > 0) {
      const photoUrls: string[] = [];
      
      for (const photo of photos) {
        try {
          const photoUrl = await PhotoUploadService.uploadComplaintPhoto(photo, complaintData.id);
          photoUrls.push(photoUrl);
        } catch (error) {
          console.error('Failed to upload photo:', error);
        }
      }

      // Update complaint with photo URLs
      if (photoUrls.length > 0) {
        const { data: updatedData, error: updateError } = await supabase
          .from('complaints')
          .update({ photo_urls: photoUrls })
          .eq('id', complaintData.id)
          .select()
          .single();

        if (updateError) throw updateError;
        return updatedData;
      }
    }
    
    return complaintData;
  }

  static async updateComplaintStatus(
    id: string, 
    status: string, 
    assignedTo?: string,
    resolutionNotes?: string
  ): Promise<Complaint> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    const updateData: any = { status };
    if (assignedTo) updateData.assigned_to = assignedTo;
    if (resolutionNotes) updateData.resolution_notes = resolutionNotes;
    if (status === 'resolved') updateData.resolved_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('complaints')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Maintenance Tasks
  static async getMaintenanceTasks(): Promise<MaintenanceTask[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning mock data');
      return [];
    }
    
    const { data, error } = await supabase
      .from('maintenance_tasks')
      .select('*')
      .order('due_date', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  static async createMaintenanceTask(task: Omit<MaintenanceTask, 'id'>): Promise<MaintenanceTask> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    const { data, error } = await supabase
      .from('maintenance_tasks')
      .insert([task])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async completeMaintenanceTask(id: string, notes?: string, photos?: File[]): Promise<MaintenanceTask> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    let photoUrls: string[] = [];
    
    // Upload photos if provided
    if (photos && photos.length > 0) {
      for (const photo of photos) {
        try {
          const photoUrl = await PhotoUploadService.uploadMaintenancePhoto(photo, id);
          photoUrls.push(photoUrl);
        } catch (error) {
          console.error('Failed to upload maintenance photo:', error);
        }
      }
    }
    
    const updateData: any = {
      status: 'completed',
      completed_at: new Date().toISOString()
    };
    
    if (notes) updateData.notes = notes;
    if (photoUrls.length > 0) updateData.photo_urls = photoUrls;

    const { data, error } = await supabase
      .from('maintenance_tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Alerts
  static async getAlerts(): Promise<Alert[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning mock data');
      return [];
    }
    
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createAlert(alert: Omit<Alert, 'id'>): Promise<Alert> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    const { data, error } = await supabase
      .from('alerts')
      .insert([alert])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async acknowledgeAlert(id: string, userId?: string): Promise<Alert> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    const updateData: any = { 
      acknowledged: true,
      acknowledged_at: new Date().toISOString()
    };
    
    if (userId) updateData.acknowledged_by = userId;

    const { data, error } = await supabase
      .from('alerts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async resolveAlert(id: string, userId?: string): Promise<Alert> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }
    
    const updateData: any = { 
      resolved: true, 
      acknowledged: true,
      resolved_at: new Date().toISOString(),
      acknowledged_at: new Date().toISOString()
    };
    
    if (userId) {
      updateData.resolved_by = userId;
      updateData.acknowledged_by = userId;
    }

    const { data, error } = await supabase
      .from('alerts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
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
  static async getConsumptionAnalytics(days: number = 7): Promise<any[]> {
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
    return data || [];
  }

  static async getSystemHealth(): Promise<Record<string, string>> {
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
    (data || []).forEach(reading => {
      if (!healthMap.has(reading.sensor_type)) {
        healthMap.set(reading.sensor_type, reading.status);
      }
    });
    
    return Object.fromEntries(healthMap);
  }

  // Real-time sensor data simulation (for demo purposes)
  static async simulateSensorData(): Promise<void> {
    if (!supabase) return;

    const sensorTypes = [
      { type: 'flow', unit: 'L/min', location: 'Main Distribution', baseValue: 45 },
      { type: 'pressure', unit: 'bar', location: 'Pump Station 1', baseValue: 3.8 },
      { type: 'quality', unit: '%', location: 'Storage Tank A', baseValue: 95 },
      { type: 'temperature', unit: '°C', location: 'Storage Tank A', baseValue: 24 }
    ];

    for (const sensor of sensorTypes) {
      const variation = (Math.random() - 0.5) * 2; // ±1 unit variation
      const value = sensor.baseValue + variation;
      const status = value < sensor.baseValue * 0.8 ? 'warning' : 'normal';

      await this.insertSensorReading({
        sensor_id: `${sensor.type.toUpperCase()}_001`,
        sensor_type: sensor.type as any,
        value: Math.max(0, value),
        unit: sensor.unit,
        location: sensor.location,
        timestamp: new Date().toISOString(),
        status: status as any,
        battery_level: Math.floor(Math.random() * 20) + 80, // 80-100%
        signal_strength: Math.floor(Math.random() * 30) + 70 // 70-100%
      });
    }
  }
}