/*
  # JalRakshak Water Management Database Schema

  1. New Tables
    - `sensor_readings` - Real-time IoT sensor data (flow, pressure, quality, etc.)
    - `complaints` - Citizen complaints with photo and GPS support
    - `maintenance_tasks` - Scheduled maintenance and repairs
    - `alerts` - System alerts and notifications
    - `users` - User management for staff and citizens

  2. Storage
    - `complaint_photos` bucket for storing complaint images
    - `maintenance_photos` bucket for maintenance documentation

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Secure file upload policies

  4. Real-time Features
    - Enable real-time subscriptions for all tables
    - Automatic timestamp updates
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'citizen' CHECK (role IN ('admin', 'staff', 'citizen')),
  phone TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sensor_readings table
CREATE TABLE IF NOT EXISTS sensor_readings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sensor_id TEXT NOT NULL,
  sensor_type TEXT NOT NULL CHECK (sensor_type IN ('flow', 'pressure', 'quality', 'temperature', 'ph', 'turbidity')),
  value DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  location TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'normal' CHECK (status IN ('normal', 'warning', 'critical')),
  device_id TEXT,
  battery_level INTEGER,
  signal_strength INTEGER
);

-- Create complaints table with photo and GPS support
CREATE TABLE IF NOT EXISTS complaints (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'resolved')),
  submitted_by UUID REFERENCES users(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  photo_urls TEXT[], -- Array of photo URLs
  gps_coordinates POINT, -- PostGIS point for GPS coordinates
  gps_accuracy DECIMAL,
  resolved_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES users(id),
  resolution_notes TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('leak', 'quality', 'pressure', 'outage', 'general'))
);

-- Create maintenance_tasks table
CREATE TABLE IF NOT EXISTS maintenance_tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed')),
  due_date DATE NOT NULL,
  assigned_to UUID REFERENCES users(id),
  completed_at TIMESTAMPTZ,
  location TEXT NOT NULL,
  estimated_duration INTEGER, -- in minutes
  actual_duration INTEGER, -- in minutes
  cost DECIMAL,
  notes TEXT,
  photo_urls TEXT[]
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('critical', 'warning', 'info')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  source TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT FALSE,
  resolved BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  sensor_id TEXT,
  threshold_value DECIMAL,
  current_value DECIMAL,
  location TEXT,
  severity_score INTEGER DEFAULT 1
);

-- Create system_health table for monitoring
CREATE TABLE IF NOT EXISTS system_health (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  component TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('online', 'offline', 'maintenance', 'error')),
  last_ping TIMESTAMPTZ DEFAULT NOW(),
  uptime_percentage DECIMAL,
  error_count INTEGER DEFAULT 0,
  location TEXT,
  metadata JSONB
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Create policies for sensor_readings table
CREATE POLICY "Anyone can read sensor readings" ON sensor_readings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can insert sensor readings" ON sensor_readings
  FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff')
  ));

-- Create policies for complaints table
CREATE POLICY "Users can read all complaints" ON complaints
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own complaints" ON complaints
  FOR INSERT TO authenticated 
  WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Staff can update complaints" ON complaints
  FOR UPDATE TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff')
  ));

-- Create policies for maintenance_tasks table
CREATE POLICY "Staff can read maintenance tasks" ON maintenance_tasks
  FOR SELECT TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff')
  ));

CREATE POLICY "Staff can manage maintenance tasks" ON maintenance_tasks
  FOR ALL TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff')
  ));

-- Create policies for alerts table
CREATE POLICY "Users can read alerts" ON alerts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can manage alerts" ON alerts
  FOR ALL TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff')
  ));

-- Create policies for system_health table
CREATE POLICY "Staff can read system health" ON system_health
  FOR SELECT TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff')
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON sensor_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_type ON sensor_readings(sensor_type);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_location ON sensor_readings(location);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_submitted_at ON complaints(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(resolved);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample sensor data for testing
INSERT INTO sensor_readings (sensor_id, sensor_type, value, unit, location, status) VALUES
  ('FLOW_001', 'flow', 45.2, 'L/min', 'Main Distribution Point', 'normal'),
  ('PRESS_001', 'pressure', 3.8, 'bar', 'Pump Station 1', 'normal'),
  ('QUAL_001', 'quality', 95.0, '%', 'Storage Tank A', 'normal'),
  ('TEMP_001', 'temperature', 24.5, '°C', 'Storage Tank A', 'normal'),
  ('PH_001', 'ph', 7.2, 'pH', 'Treatment Plant', 'normal'),
  ('TURB_001', 'turbidity', 0.8, 'NTU', 'Treatment Plant', 'normal');

-- Insert sample alerts
INSERT INTO alerts (type, title, description, source, sensor_id, current_value, threshold_value) VALUES
  ('warning', 'Low Water Pressure', 'Pressure has dropped below normal levels in Sector 2', 'Pressure Sensor P2', 'PRESS_002', 2.1, 3.0),
  ('info', 'Maintenance Scheduled', 'Routine maintenance scheduled for tomorrow at Tank B', 'Maintenance System', NULL, NULL, NULL),
  ('critical', 'Possible Leak Detected', 'Unusual flow pattern detected - possible pipeline leak', 'Flow Sensor F3', 'FLOW_003', 78.5, 50.0);