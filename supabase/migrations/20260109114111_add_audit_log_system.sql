/*
  # Add Audit Log System

  1. New Tables
    - `audit_logs`
      - `id` (uuid, primary key) - Unique identifier for each log entry
      - `user_id` (uuid) - References auth.users who made the change
      - `table_name` (text) - Name of the table that was modified
      - `record_id` (uuid) - ID of the record that was modified
      - `action` (text) - Type of action: 'INSERT', 'UPDATE', 'DELETE'
      - `old_data` (jsonb) - Previous data before change (for UPDATE/DELETE)
      - `new_data` (jsonb) - New data after change (for INSERT/UPDATE)
      - `created_at` (timestamptz) - When the change occurred

  2. Security
    - Enable RLS on `audit_logs` table
    - Add policy for authenticated users to view audit logs
    - Only system can insert audit logs (through triggers)

  3. Triggers
    - Add triggers to all main tables to automatically log changes
*/

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all audit logs
CREATE POLICY "Authenticated users can view audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Create audit function
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, table_name, record_id, action, old_data)
    VALUES (auth.uid(), TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (user_id, table_name, record_id, action, old_data, new_data)
    VALUES (auth.uid(), TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, table_name, record_id, action, new_data)
    VALUES (auth.uid(), TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW));
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to all main tables
CREATE TRIGGER sales_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON sales
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER products_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER suppliers_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER supplier_orders_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON supplier_orders
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER supplier_payments_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON supplier_payments
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER categories_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON categories
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER sales_channels_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON sales_channels
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER users_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();