-- EVSavari foundation schema (Day 1 — Real Production Infrastructure)
-- Apply in Supabase SQL editor or via CLI migrations.
-- Version: 001

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- users (profiles linked to Supabase auth when enabled)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE,
  email TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'viewer'
    CHECK (role IN ('admin', 'sales', 'editor', 'dealer', 'viewer')),
  display_name TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users (auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);

-- ---------------------------------------------------------------------------
-- sessions (anonymous + authenticated browsing sessions)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_seen ON public.sessions (last_seen_at DESC);

-- ---------------------------------------------------------------------------
-- compare_events (compare funnel + trust signals)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.compare_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key TEXT,
  event_type TEXT NOT NULL,
  pair_slug TEXT,
  vehicle_slugs TEXT[] DEFAULT '{}',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compare_events_type ON public.compare_events (event_type);
CREATE INDEX IF NOT EXISTS idx_compare_events_pair ON public.compare_events (pair_slug);
CREATE INDEX IF NOT EXISTS idx_compare_events_created ON public.compare_events (created_at DESC);

-- ---------------------------------------------------------------------------
-- trust_feedback (buyer trust / doubt signals)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trust_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key TEXT,
  feedback_type TEXT NOT NULL,
  pair_slug TEXT,
  severity TEXT DEFAULT 'medium'
    CHECK (severity IN ('low', 'medium', 'high')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trust_feedback_type ON public.trust_feedback (feedback_type);
CREATE INDEX IF NOT EXISTS idx_trust_feedback_pair ON public.trust_feedback (pair_slug);
CREATE INDEX IF NOT EXISTS idx_trust_feedback_created ON public.trust_feedback (created_at DESC);

-- ---------------------------------------------------------------------------
-- leads (buyer intent — contact details stay in payload until CRM sync)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key TEXT,
  source_page TEXT,
  vehicle_slugs TEXT[] DEFAULT '{}',
  pair_slug TEXT,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'qualified', 'closed', 'spam')),
  confidence TEXT DEFAULT 'medium'
    CHECK (confidence IN ('low', 'medium', 'high')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON public.leads (created_at DESC);

-- ---------------------------------------------------------------------------
-- vehicles (catalog families — ingestion-ready)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'SUV',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'upcoming', 'inactive')),
  oem_family TEXT,
  compare_ready BOOLEAN NOT NULL DEFAULT true,
  ownership_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  charging_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  seo_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_brand ON public.vehicles (brand);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles (status);

-- ---------------------------------------------------------------------------
-- vehicle_variants (trim / battery variants)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vehicle_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles (id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  price_inr NUMERIC(12, 2),
  range_km_claimed INTEGER,
  range_km_real_world INTEGER,
  battery_kwh NUMERIC(6, 2),
  specs JSONB NOT NULL DEFAULT '{}'::jsonb,
  compare_specs JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'upcoming', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (vehicle_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_variants_vehicle ON public.vehicle_variants (vehicle_id);

-- ---------------------------------------------------------------------------
-- vehicle_media (Cloudinary role mapping)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vehicle_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles (id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.vehicle_variants (id) ON DELETE SET NULL,
  role TEXT NOT NULL
    CHECK (role IN (
      'hero',
      'listing-thumb',
      'compare-thumb',
      'og',
      'exterior',
      'interior',
      'charging-port'
    )),
  cloudinary_public_id TEXT,
  url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_fallback BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (vehicle_id, role, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_media_vehicle ON public.vehicle_media (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_media_role ON public.vehicle_media (role);

-- ---------------------------------------------------------------------------
-- operational_snapshots (ops maturity / beta summaries)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.operational_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_type TEXT NOT NULL,
  phase TEXT,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operational_snapshots_type ON public.operational_snapshots (snapshot_type);
CREATE INDEX IF NOT EXISTS idx_operational_snapshots_phase ON public.operational_snapshots (phase);
CREATE INDEX IF NOT EXISTS idx_operational_snapshots_generated ON public.operational_snapshots (generated_at DESC);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users', 'leads', 'vehicles', 'vehicle_variants', 'vehicle_media']
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I;
       CREATE TRIGGER trg_%I_updated_at
       BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      t, t, t, t
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Row Level Security (foundation — tighten in production)
-- ---------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compare_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_snapshots ENABLE ROW LEVEL SECURITY;

-- Public read for catalog (anon)
DROP POLICY IF EXISTS vehicles_public_read ON public.vehicles;
CREATE POLICY vehicles_public_read ON public.vehicles
  FOR SELECT TO anon, authenticated USING (status = 'active');

DROP POLICY IF EXISTS vehicle_variants_public_read ON public.vehicle_variants;
CREATE POLICY vehicle_variants_public_read ON public.vehicle_variants
  FOR SELECT TO anon, authenticated USING (status = 'active');

DROP POLICY IF EXISTS vehicle_media_public_read ON public.vehicle_media;
CREATE POLICY vehicle_media_public_read ON public.vehicle_media
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS compare_events_anon_insert ON public.compare_events;
CREATE POLICY compare_events_anon_insert ON public.compare_events
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS trust_feedback_anon_insert ON public.trust_feedback;
CREATE POLICY trust_feedback_anon_insert ON public.trust_feedback
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS leads_anon_insert ON public.leads;
CREATE POLICY leads_anon_insert ON public.leads
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS operational_snapshots_auth_read ON public.operational_snapshots;
CREATE POLICY operational_snapshots_auth_read ON public.operational_snapshots
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS operational_snapshots_auth_insert ON public.operational_snapshots;
CREATE POLICY operational_snapshots_auth_insert ON public.operational_snapshots
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS sessions_anon_insert ON public.sessions;
CREATE POLICY sessions_anon_insert ON public.sessions
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS sessions_anon_update ON public.sessions;
CREATE POLICY sessions_anon_update ON public.sessions
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
