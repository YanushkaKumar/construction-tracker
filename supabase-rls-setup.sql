-- ==========================================
-- Supabase Row Level Security (RLS) Setup
-- ==========================================
-- This script enables RLS on all public tables created by Prisma.
-- Since this project uses a NestJS backend (Prisma) to connect to the database,
-- the backend uses a direct connection string (postgres role) which bypasses RLS.
-- Enabling RLS here ensures that the Supabase Data API (PostgREST) is locked down,
-- preventing direct access from the frontend and resolving the Supabase Advisor warnings.

-- Enable RLS for all tables in the public schema
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
  LOOP
    EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
  END LOOP;
END $$;

-- Optional: If you ever decide to use Supabase Data API directly from the frontend,
-- you would add policies here. For example:
-- CREATE POLICY "Users can view their company data" ON public.users
--   FOR SELECT USING (
--     company_id = (SELECT company_id FROM public.users WHERE email = auth.jwt()->>'email')
--   );
-- 
-- For now, no policies are created, meaning PostgREST access is completely blocked (secure default).
