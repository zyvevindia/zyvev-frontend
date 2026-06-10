/**
 * Catalog import persistence — Supabase CRUD + snapshots.
 */

import { BACKEND_CONFIG } from "../config.js";
import { mapSupabaseError } from "../supabase/errors.js";
import { optionalClient, sanitizePayload } from "./persistenceUtils.js";
import { IMPORT_STATUS, SNAPSHOT_TYPE } from "../../catalogAcquisition/constants.js";

const TABLE = "catalog_imports";
const SNAPSHOT_TABLE = "catalog_import_snapshots";

function rowFromInput(input) {
  return {
    status: input.status || IMPORT_STATUS.DRAFT,
    source_type: input.sourceType,
    source_url: input.sourceUrl || null,
    source_file: sanitizePayload(input.sourceFile, 20),
    raw_content: input.rawContent?.slice(0, 500_000) || null,
    raw_content_hash: input.rawContentHash || null,
    extracted_vehicle: sanitizePayload(input.extractedVehicle, 80),
    reviewed_vehicle: sanitizePayload(input.reviewedVehicle, 80),
    confidence_score: input.confidenceScore ?? null,
    publish_result: sanitizePayload(input.publishResult, 30),
    diagnostics: sanitizePayload(input.diagnostics, 30),
    source_inputs: sanitizePayload(input.sourceInputs, 20),
    evidence_summary: sanitizePayload(input.evidenceSummary, 80),
    created_by: input.createdBy?.slice(0, 128) || null,
    approved_by: input.approvedBy?.slice(0, 128) || null,
    approved_at: input.approvedAt || null,
    published_at: input.publishedAt || null,
  };
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    status: row.status,
    sourceType: row.source_type,
    sourceUrl: row.source_url,
    sourceFile: row.source_file,
    rawContent: row.raw_content,
    rawContentHash: row.raw_content_hash,
    extractedVehicle: row.extracted_vehicle,
    reviewedVehicle: row.reviewed_vehicle,
    confidenceScore: row.confidence_score,
    publishResult: row.publish_result,
    diagnostics: row.diagnostics,
    sourceInputs: row.source_inputs,
    evidenceSummary: row.evidence_summary,
    createdBy: row.created_by,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient | null} client
 */
function resolveClient(client) {
  return client || optionalClient();
}

export async function createCatalogImport(input, client = null) {
  const supabase = resolveClient(client);
  if (!supabase) {
    return { ok: false, skipped: true, reason: "not_configured" };
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert(rowFromInput(input))
    .select("*")
    .single();

  if (error) {
    return { ok: false, skipped: false, error: mapSupabaseError(error) };
  }
  return { ok: true, data: mapRow(data), skipped: false };
}

export async function updateCatalogImport(id, patch, client = null) {
  const supabase = resolveClient(client);
  if (!supabase) {
    return { ok: false, skipped: true, reason: "not_configured" };
  }

  const row = {};
  if (patch.status) row.status = patch.status;
  if (patch.rawContent !== undefined) row.raw_content = patch.rawContent?.slice(0, 500_000);
  if (patch.rawContentHash !== undefined) row.raw_content_hash = patch.rawContentHash;
  if (patch.extractedVehicle !== undefined) {
    row.extracted_vehicle = sanitizePayload(patch.extractedVehicle, 80);
  }
  if (patch.reviewedVehicle !== undefined) {
    row.reviewed_vehicle = sanitizePayload(patch.reviewedVehicle, 80);
  }
  if (patch.confidenceScore !== undefined) row.confidence_score = patch.confidenceScore;
  if (patch.publishResult !== undefined) row.publish_result = sanitizePayload(patch.publishResult, 30);
  if (patch.diagnostics !== undefined) row.diagnostics = sanitizePayload(patch.diagnostics, 30);
  if (patch.sourceInputs !== undefined) row.source_inputs = sanitizePayload(patch.sourceInputs, 20);
  if (patch.evidenceSummary !== undefined) {
    row.evidence_summary = sanitizePayload(patch.evidenceSummary, 80);
  }
  if (patch.approvedBy !== undefined) row.approved_by = patch.approvedBy;
  if (patch.approvedAt !== undefined) row.approved_at = patch.approvedAt;
  if (patch.publishedAt !== undefined) row.published_at = patch.publishedAt;

  const { data, error } = await supabase
    .from(TABLE)
    .update(row)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return { ok: false, skipped: false, error: mapSupabaseError(error) };
  }
  return { ok: true, data: mapRow(data), skipped: false };
}

export async function getCatalogImport(id, client = null) {
  const supabase = resolveClient(client);
  if (!supabase) {
    return { ok: false, skipped: true, data: null, reason: "not_configured" };
  }

  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();

  if (error) {
    return { ok: false, skipped: false, data: null, error: mapSupabaseError(error) };
  }
  return { ok: true, data: mapRow(data), skipped: false };
}

export async function listCatalogImports(opts = {}, client = null) {
  const supabase = resolveClient(client);
  if (!supabase) {
    return { ok: false, skipped: true, data: [], reason: "not_configured" };
  }

  let q = supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 50);

  if (opts.status) q = q.eq("status", opts.status);

  const { data, error } = await q;
  if (error) {
    return { ok: false, skipped: false, data: [], error: mapSupabaseError(error) };
  }
  return { ok: true, data: (data || []).map(mapRow), skipped: false };
}

export async function insertCatalogImportSnapshot(snapshot, client = null) {
  const supabase = resolveClient(client);
  if (!supabase) {
    return { ok: false, skipped: true, reason: "not_configured" };
  }

  const row = {
    import_id: snapshot.import_id || snapshot.importId,
    snapshot_type: snapshot.snapshot_type || snapshot.snapshotType,
    content_hash: snapshot.content_hash || snapshot.contentHash,
    payload: sanitizePayload(snapshot.payload, 80),
    captured_at: snapshot.captured_at || snapshot.capturedAt || new Date().toISOString(),
  };

  const { data, error } = await supabase.from(SNAPSHOT_TABLE).insert(row).select("id").single();

  if (error) {
    return { ok: false, skipped: false, error: mapSupabaseError(error) };
  }
  return { ok: true, data, skipped: false };
}

export async function listImportSnapshots(importId, client = null) {
  const supabase = resolveClient(client);
  if (!supabase) {
    return { ok: false, skipped: true, data: [], reason: "not_configured" };
  }

  const { data, error } = await supabase
    .from(SNAPSHOT_TABLE)
    .select("*")
    .eq("import_id", importId)
    .order("captured_at", { ascending: false });

  if (error) {
    return { ok: false, skipped: false, data: [], error: mapSupabaseError(error) };
  }
  return { ok: true, data: data || [], skipped: false };
}

export { TABLE as CATALOG_IMPORTS_TABLE, SNAPSHOT_TABLE as CATALOG_IMPORT_SNAPSHOTS_TABLE };
