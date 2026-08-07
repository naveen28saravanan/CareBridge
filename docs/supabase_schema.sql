-- CareBridge One - Guaranteed Clean Supabase Schema & Login Audit System
-- Database Engine: PostgreSQL / Supabase Platform
-- Execute this script inside the Supabase SQL Editor.

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing tables with CASCADE to ensure clean column types (resolves type mismatch 42804)
DROP TABLE IF EXISTS public.login_logs CASCADE;
DROP TABLE IF EXISTS public.user_data CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- 3. User Profiles Table (Patient, Doctor, Operations Workspaces)
-- Primary key 'id' is TEXT to support both string IDs and UUIDs from auth providers
CREATE TABLE public.user_profiles (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'operations')),
  provider TEXT NOT NULL DEFAULT 'email',
  verified BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);

-- 4. Login Logs Table (Appears directly in Supabase Table Editor)
CREATE TABLE public.login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'operations')),
  provider TEXT NOT NULL DEFAULT 'email',
  login_time TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT DEFAULT '127.0.0.1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_login_logs_role ON public.login_logs(role);
CREATE INDEX idx_login_logs_user_id ON public.login_logs(user_id);
CREATE INDEX idx_login_logs_login_time ON public.login_logs(login_time DESC);

-- 5. User Data Store (Appointments, Medical Records, Prescriptions & Vitals)
CREATE TABLE public.user_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  data_key TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_datakey UNIQUE (user_id, data_key)
);

CREATE INDEX idx_user_data_user_key ON public.user_data(user_id, data_key);

-- 6. Audit Log Table (System Activity Tracking)
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id TEXT REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT DEFAULT '127.0.0.1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 7. Trigger to automatically record a Login Log whenever user_profiles is updated on login
CREATE OR REPLACE FUNCTION public.log_user_login()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.login_logs (user_id, display_name, email, role, provider, login_time)
  VALUES (NEW.id, NEW.display_name, NEW.email, NEW.role, NEW.provider, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_user_login ON public.user_profiles;
CREATE TRIGGER trigger_log_user_login
AFTER INSERT OR UPDATE OF last_login_at, updated_at ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.log_user_login();

-- 8. Automatic Timestamp Trigger
CREATE OR REPLACE FUNCTION public.update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_timestamp ON public.user_profiles;
CREATE TRIGGER update_user_profiles_timestamp
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();

DROP TRIGGER IF EXISTS update_user_data_timestamp ON public.user_data;
CREATE TRIGGER update_user_data_timestamp
BEFORE UPDATE ON public.user_data
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();

-- 9. Enable Row Level Security (RLS) & Define Public Access Policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select on user_profiles" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Allow insert/update on user_profiles" ON public.user_profiles FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow select on login_logs" ON public.login_logs FOR SELECT USING (true);
CREATE POLICY "Allow insert on login_logs" ON public.login_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select on user_data" ON public.user_data FOR SELECT USING (true);
CREATE POLICY "Allow insert/update on user_data" ON public.user_data FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow select on audit_logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow insert on audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- 10. Seed Workspaces & Default Accounts (Patient, Doctor, Operations)
INSERT INTO public.user_profiles (id, display_name, email, role, provider, verified)
VALUES 
  ('demo_patient', 'Riya Sharma', 'patient@carebridge.demo', 'patient', 'email', true),
  ('demo_doctor', 'Dr. Ananya Kumar', 'doctor@carebridge.demo', 'doctor', 'email', true),
  ('demo_operations', 'Operations Admin', 'admin@carebridge.demo', 'operations', 'email', true)
ON CONFLICT (id) DO UPDATE 
SET updated_at = NOW(), last_login_at = NOW();

-- Initial Login entries so login_logs table immediately has data in Table Editor
INSERT INTO public.login_logs (user_id, display_name, email, role, provider, login_time)
VALUES
  ('demo_patient', 'Riya Sharma', 'patient@carebridge.demo', 'patient', 'email', NOW() - INTERVAL '2 hours'),
  ('demo_doctor', 'Dr. Ananya Kumar', 'doctor@carebridge.demo', 'doctor', 'email', NOW() - INTERVAL '1 hour'),
  ('demo_operations', 'Operations Admin', 'admin@carebridge.demo', 'operations', 'email', NOW())
ON CONFLICT DO NOTHING;
