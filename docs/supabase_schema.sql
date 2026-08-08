-- CareBridge One - Secure Supabase Schema
-- FIXED FINDING-07: All RLS policies are now user-scoped (not USING(true))
-- FIXED FINDING-14: Audit logs restricted to server-side service role only
-- Database Engine: PostgreSQL / Supabase Platform
-- Execute inside the Supabase SQL Editor.

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing tables for clean migration
DROP TABLE IF EXISTS public.login_logs CASCADE;
DROP TABLE IF EXISTS public.user_data CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- 3. User Profiles Table
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

-- 4. Login Logs Table
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

-- 5. User Data Store
CREATE TABLE public.user_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  data_key TEXT NOT NULL CHECK (data_key IN (
    'appointments', 'records', 'medicines', 'vitals',
    'symptom_checks', 'emergency_contacts', 'system_audit_events'
  )),
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_datakey UNIQUE (user_id, data_key)
);

CREATE INDEX idx_user_data_user_key ON public.user_data(user_id, data_key);

-- 6. Audit Log Table
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

-- 7. Automatic Timestamp Trigger
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

-- 8. Login trigger
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

-- ============================================================
-- 9. FIXED FINDING-07: Row Level Security — User-Scoped Policies
-- ============================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- user_profiles: each user can only read and update their own profile
CREATE POLICY "Users can read own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

-- Allow insert for authenticated users (new account creation via server)
CREATE POLICY "Authenticated users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid()::text = id);

-- login_logs: users can only read their own login history; insert via trigger only
CREATE POLICY "Users can read own login logs"
  ON public.login_logs FOR SELECT
  USING (auth.uid()::text = user_id);

-- user_data: strict user isolation — each user accesses only their own rows
CREATE POLICY "Users can read own data"
  ON public.user_data FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own data"
  ON public.user_data FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own data"
  ON public.user_data FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own data"
  ON public.user_data FOR DELETE
  USING (auth.uid()::text = user_id);

-- FIXED FINDING-14: audit_logs — no client access at all.
-- Reads and writes go through service role key only (server-side).
-- No SELECT/INSERT policies granted to anon or authenticated roles.
-- Audit integrity is preserved because the anon key cannot touch this table.

-- ============================================================
-- 10. Seed Demo Accounts (minimal — no login log seeding via SQL)
-- ============================================================
-- NOTE: Seed passwords are handled by the backend server using env vars.
-- Do NOT insert plaintext passwords here. Only profile metadata is seeded.
INSERT INTO public.user_profiles (id, display_name, email, role, provider, verified)
VALUES
  ('demo_patient',    'Riya Sharma',       'patient@carebridge.demo', 'patient',    'email', true),
  ('demo_doctor',     'Dr. Ananya Kumar',  'doctor@carebridge.demo',  'doctor',     'email', true),
  ('demo_operations', 'Operations Admin',  'admin@carebridge.demo',   'operations', 'email', true)
ON CONFLICT (id) DO UPDATE
  SET updated_at = NOW(), last_login_at = NOW();
