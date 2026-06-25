-- ============================================
-- BuildTrack — PostgreSQL Initialization
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create a read-only role for reporting (future use)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'buildtrack_readonly') THEN
    CREATE ROLE buildtrack_readonly;
  END IF;
END
$$;

-- Grant read permissions on all tables to readonly role
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO buildtrack_readonly;
