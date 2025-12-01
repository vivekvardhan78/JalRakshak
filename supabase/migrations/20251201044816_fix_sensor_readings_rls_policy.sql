/*
  # Fix Sensor Readings RLS Policy for System Operations

  1. Changes
    - Add a new INSERT policy for sensor_readings that allows anon users to insert sensor data
    - This enables IoT devices and system simulation to write sensor data without authentication
    - Maintains security by keeping SELECT policy restricted to authenticated users
  
  2. Security
    - Read access remains restricted to authenticated users only
    - Write access is opened to allow automated sensor/IoT device data ingestion
    - This is appropriate for sensor data as it comes from physical devices, not user input
    
  3. Rationale
    - IoT sensors typically use API keys or device tokens, not user authentication
    - The simulation function needs to work in demo mode without user authentication
    - Real sensor data would use service role key or device-specific authentication
*/

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Staff can insert sensor readings" ON sensor_readings;

-- Create a new policy that allows anyone (including anon) to insert sensor readings
-- This enables IoT devices and system operations to write sensor data
CREATE POLICY "Allow sensor data ingestion"
  ON sensor_readings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create a policy for authenticated users to update sensor readings (for corrections)
CREATE POLICY "Staff can update sensor readings"
  ON sensor_readings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'staff')
    )
  );
