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
  location TEXT NOT NULL,
  asset_name TEXT,
  problem_description TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'cancelled')),
  assigned_to UUID, -- reference to profiles.id or user id
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  images TEXT[] DEFAULT '{}', -- array of image URLs from Supabase Storage
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'resolved', 'cancelled'))
);

-- Users Profile (optional, extend Supabase auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  department TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'technician', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Enable Row Level Security (RLS)
ALTER TABLE repair_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (adjust as needed)
CREATE POLICY "Users can view own tickets" ON repair_tickets
FOR SELECT USING (requester_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Technicians can view all tickets" ON repair_tickets
FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('technician', 'admin')));

-- Real-time enable (done in Supabase dashboard or SQL)
-- SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';
