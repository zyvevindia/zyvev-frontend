/**
 * Evidence records persistence — Supabase CRUD.
 */

import { BACKEND_CONFIG } from "../config.js";
import { mapSupabaseError } from "../supabase/errors.js";
import { optionalClient, sanitizePayload } from "./persistenceUtils.js";

const TABLE = "evidence_records";

function rowFromRecord(record) {
  return {
    import_id: record.importId || record.import_id,
    field_name: record.fieldName || record.field_name,
    field_value: String(record.fieldValue ?? record.field_value ?? ""),
    source_type: record.sourceType || record.source_type,
    source_name: record.sourceName || record.source_name || null,
    source_url: record.sourceUrl || record.source_url || null,
    trust_score: record.trustScore ?? record.trust_score,
    extraction_confidence: record.extractionConfidence ?? record.extraction_confidence ?? null,
  };
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    importId: row.import_id,
    fieldName: row.field_name,
    fieldValue: row.field_value,
    sourceType: row.source_type,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    trustScore: row.trust_score,
    extractionConfidence: row.extraction_confidence,
    createdAt: row.created_at,
  };
}

function resolveClient(client) {
  return client || optionalClient();
}

export async function insertEvidenceRecords(records = [], client = null) {
  const supabase = resolveClient(client);
  if (!supabase) {
    return { ok: false, skipped: true, reason: "not_configured" };
  }
  if (!records.length) {
    return { ok: true, data: [], skipped: false };
  }

  const rows = records.map(rowFromRecord);
  const { data, error } = await supabase.from(TABLE).insert(rows).select("*");

  if (error) {
    return { ok: false, skipped: false, error: mapSupabaseError(error) };
  }
  return { ok: true, data: (data || []).map(mapRow), skipped: false };
}

export async function deleteEvidenceRecordsForImport(importId, client = null) {
  const supabase = resolveClient(client);
  if (!supabase) {
    return { ok: false, skipped: true, reason: "not_configured" };
  }

  const { error } = await supabase.from(TABLE).delete().eq("import_id", importId);
  if (error) {
    return { ok: false, skipped: false, error: mapSupabaseError(error) };
  }
  return { ok: true, skipped: false };
}

export async function listEvidenceRecords(importId, client = null) {
  const supabase = resolveClient(client);
  if (!supabase) {
    return { ok: false, skipped: true, data: [], reason: "not_configured" };
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("import_id", importId)
    .order("created_at", { ascending: true });

  if (error) {
    return { ok: false, skipped: false, data: [], error: mapSupabaseError(error) };
  }
  return { ok: true, data: (data || []).map(mapRow), skipped: false };
}

export async function replaceEvidenceRecords(importId, records = [], client = null) {
  const del = await deleteEvidenceRecordsForImport(importId, client);
  if (!del.ok && !del.skipped) return del;
  return insertEvidenceRecords(records, client);
}

export { TABLE as EVIDENCE_RECORDS_TABLE };
