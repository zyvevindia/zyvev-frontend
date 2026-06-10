-- v5 catalog source registry — official OEM URLs and brochure links
CREATE TABLE IF NOT EXISTS public.catalog_source_registry (
  id TEXT PRIMARY KEY,
  family_slug TEXT NOT NULL UNIQUE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  official_url TEXT,
  brochure_url TEXT,
  reference_urls JSONB DEFAULT '[]'::jsonb,
  vehicle_keywords JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'needs_verification',
  last_verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_source_registry_status
  ON public.catalog_source_registry (status);

CREATE INDEX IF NOT EXISTS idx_catalog_source_registry_family
  ON public.catalog_source_registry (family_slug);

ALTER TABLE public.catalog_source_registry ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.catalog_source_registry IS
  'v5 OEM URL registry — admin-editable official and brochure source URLs';
