-- EVSavari catalog acquisition v2 — multi-source evidence records
-- Extends v1; does not replace catalog_imports workflow.

CREATE TABLE IF NOT EXISTS public.evidence_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id UUID NOT NULL REFERENCES public.catalog_imports (id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_value TEXT NOT NULL,
  source_type TEXT NOT NULL
    CHECK (source_type IN ('OEM_PDF', 'OEM_WEBSITE', 'TRUSTED_REFERENCE', 'SEARCH_RESULT')),
  source_name TEXT,
  source_url TEXT,
  trust_score INTEGER NOT NULL CHECK (trust_score >= 0 AND trust_score <= 100),
  extraction_confidence NUMERIC(5, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evidence_records_import ON public.evidence_records (import_id);
CREATE INDEX IF NOT EXISTS idx_evidence_records_field ON public.evidence_records (import_id, field_name);
CREATE INDEX IF NOT EXISTS idx_evidence_records_source ON public.evidence_records (source_type);

-- Optional multi-source inputs on import (v1 columns remain for backward compatibility).
ALTER TABLE public.catalog_imports
  ADD COLUMN IF NOT EXISTS source_inputs JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.catalog_imports
  ADD COLUMN IF NOT EXISTS evidence_summary JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.catalog_imports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS evidence_records_auth_all ON public.evidence_records;
CREATE POLICY evidence_records_auth_all ON public.evidence_records
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
