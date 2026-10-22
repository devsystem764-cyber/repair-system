-- Repair & Maintenance System Database Schema
-- PostgreSQL / Supabase

-- Enable UUID extension if not already
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Repair Tickets Table
CREATE TABLE IF NOT EXISTS repair_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number TEXT UNIQUE NOT NULL,
  requester_name TEXT NOT NULL,
  requester_email TEXT,
  requester_phone TEXT,
  department TEXT,
  unit TEXT,
  location TEXT NOT NULL,
  asset_name TEXT,
  issue_type TEXT,
  hardware_failure TEXT,
  symptom TEXT,
  contact_phone TEXT,
  problem_description TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'cancelled')),
  assigned_to UUID, -- reference to profiles.id or user id
  created_by UUID REFERENCES auth.users(id),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  images TEXT[] DEFAULT '{}', -- array of image URLs from Supabase Storage
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'resolved', 'cancelled'))
);

-- Add missing columns if they don't exist (migration-safe)
ALTER TABLE repair_tickets ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE repair_tickets ADD COLUMN IF NOT EXISTS issue_type TEXT;
ALTER TABLE repair_tickets ADD COLUMN IF NOT EXISTS hardware_failure TEXT;
ALTER TABLE repair_tickets ADD COLUMN IF NOT EXISTS symptom TEXT;
ALTER TABLE repair_tickets ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE repair_tickets ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE repair_tickets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Users Profile (optional, extend Supabase auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  department TEXT,
  unit TEXT,
  employee_id TEXT,
  computer_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'technician', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist (migration-safe)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS computer_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ticket Comments / History
CREATE TABLE IF NOT EXISTS ticket_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES repair_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_status ON repair_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON repair_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON repair_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_department ON repair_tickets(department);
CREATE INDEX IF NOT EXISTS idx_comments_ticket ON ticket_comments(ticket_id);

-- Function to auto-generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_number := 'RM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                       LPAD((SELECT COUNT(*) + 1 FROM repair_tickets 
                             WHERE DATE(created_at) = DATE(NOW()))::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_ticket_number
BEFORE INSERT ON repair_tickets
FOR EACH ROW EXECUTE FUNCTION generate_ticket_number();

-- Master Data Tables
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(department_id, name)
);

CREATE TABLE IF NOT EXISTS repair_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  category TEXT CHECK (category IN ('hardware', 'software', 'network', 'other')) DEFAULT 'hardware',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE repair_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_items ENABLE ROW LEVEL SECURITY;

-- Repair Tickets policies
DROP POLICY IF EXISTS "Users can view own tickets" ON repair_tickets;
DROP POLICY IF EXISTS "Technicians can view all tickets" ON repair_tickets;

CREATE POLICY "Users can view own tickets" ON repair_tickets
FOR SELECT USING (
  requester_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
  created_by = auth.uid() OR
  user_id = auth.uid()
);

CREATE POLICY "Users can insert own tickets" ON repair_tickets
FOR INSERT WITH CHECK (
  created_by = auth.uid() OR user_id = auth.uid()
);

CREATE POLICY "Technicians can view all tickets" ON repair_tickets
FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('technician', 'admin')));

CREATE POLICY "Technicians can update tickets" ON repair_tickets
FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('technician', 'admin')));

CREATE POLICY "Admins can manage tickets" ON repair_tickets
FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update all profiles" ON profiles
FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can insert profiles" ON profiles
FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Ticket Comments policies
DROP POLICY IF EXISTS "Users can view comments on their tickets" ON ticket_comments;
DROP POLICY IF EXISTS "Technicians can view all comments" ON ticket_comments;

CREATE POLICY "Users can view comments on their tickets" ON ticket_comments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM repair_tickets t 
    WHERE t.id = ticket_comments.ticket_id 
    AND (t.requester_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR t.created_by = auth.uid() OR t.user_id = auth.uid())
  ) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('technician', 'admin'))
);

CREATE POLICY "Users and technicians can insert comments" ON ticket_comments
FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  (
    EXISTS (
      SELECT 1 FROM repair_tickets t 
      WHERE t.id = ticket_comments.ticket_id 
      AND (t.requester_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR t.created_by = auth.uid() OR t.user_id = auth.uid())
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('technician', 'admin'))
  )
);

CREATE POLICY "Admins can manage comments" ON ticket_comments
FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Master data policies (readable by all authenticated, managed by admin)
CREATE POLICY "Authenticated users can view departments" ON departments
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view units" ON units
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view repair items" ON repair_items
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage departments" ON departments
FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage units" ON units
FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage repair items" ON repair_items
FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Real-time enable (done in Supabase dashboard or SQL)
-- SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';
