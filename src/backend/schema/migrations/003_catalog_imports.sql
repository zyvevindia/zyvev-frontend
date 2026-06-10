-- EVSavari catalog acquisition — import drafts + source snapshots (v1)
-- Enables admin wizard, human approval, and future change-detection agents.

CREATE TABLE IF NOT EXISTS public.catalog_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft',
      'processing',
      'review_required',
      'approved',
      'published',
      'rejected'
    )),
  source_type TEXT NOT NULL
    CHECK (source_type IN ('oem_url', 'pdf_brochure')),
  source_url TEXT,
  source_file JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw_content TEXT,
  raw_content_hash TEXT,
  extracted_vehicle JSONB NOT NULL DEFAULT '{}'::jsonb,
  reviewed_vehicle JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence_score NUMERIC(5, 2),
  publish_result JSONB NOT NULL DEFAULT '{}'::jsonb,
  diagnostics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_imports_status ON public.catalog_imports (status);
CREATE INDEX IF NOT EXISTS idx_catalog_imports_created ON public.catalog_imports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_catalog_imports_source_hash ON public.catalog_imports (raw_content_hash);

-- Immutable source snapshots for future change-detection agents.
CREATE TABLE IF NOT EXISTS public.catalog_import_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id UUID NOT NULL REFERENCES public.catalog_imports (id) ON DELETE CASCADE,
  snapshot_type TEXT NOT NULL DEFAULT 'source_raw'
    CHECK (snapshot_type IN ('source_raw', 'extracted', 'reviewed', 'published')),
  content_hash TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_import_snapshots_import ON public.catalog_import_snapshots (import_id);
CREATE INDEX IF NOT EXISTS idx_catalog_import_snapshots_type ON public.catalog_import_snapshots (snapshot_type);
CREATE INDEX IF NOT EXISTS idx_catalog_import_snapshots_hash ON public.catalog_import_snapshots (content_hash);

DROP TRIGGER IF EXISTS trg_catalog_imports_updated_at ON public.catalog_imports;
CREATE TRIGGER trg_catalog_imports_updated_at
  BEFORE UPDATE ON public.catalog_imports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.catalog_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_import_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS catalog_imports_auth_all ON public.catalog_imports;
CREATE POLICY catalog_imports_auth_all ON public.catalog_imports
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS catalog_import_snapshots_auth_all ON public.catalog_import_snapshots;
CREATE POLICY catalog_import_snapshots_auth_all ON public.catalog_import_snapshots
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Dev/ops: allow service role bypass via default Supabase service policies.
