/**
 * Operational snapshot persistence — beta summaries, maturity, trust ops.
 */

import { BACKEND_CONFIG } from "../config.js";
import { mapSupabaseError } from "../supabase/errors.js";
import { optionalClient, sanitizePayload } from "./persistenceUtils.js";

/**
 * @param {{
 *   snapshotType: string;
 *   phase?: string;
 *   summary?: object;
 *   payload?: object;
 *   generatedAt?: string;
 * }} input
 */
export async function insertOperationalSnapshot(input) {
  const supabase = optionalClient();
  if (!supabase) {
    return { ok: false, skipped: true, reason: "not_configured" };
  }

  const row = {
    snapshot_type: String(input.snapshotType || "unknown").slice(0, 64),
    phase: input.phase?.slice(0, 64) || null,
    summary: sanitizePayload(input.summary),
    payload: sanitizePayload(input.payload),
    generated_at: input.generatedAt || new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(BACKEND_CONFIG.tables.operationalSnapshots)
    .insert(row)
    .select("id, snapshot_type, phase, generated_at")
    .single();

  if (error) {
    return { ok: false, skipped: false, error: mapSupabaseError(error) };
  }

  return { ok: true, data, skipped: false };
}

/**
 * @param {{ snapshotType?: string; phase?: string; limit?: number }} [opts]
 */
export async function listOperationalSnapshots(opts = {}) {
  const supabase = optionalClient();
  if (!supabase) {
    return { ok: false, skipped: true, data: [], reason: "not_configured" };
  }

  let query = supabase
    .from(BACKEND_CONFIG.tables.operationalSnapshots)
    .select("id, snapshot_type, phase, summary, generated_at, created_at")
    .order("generated_at", { ascending: false })
    .limit(Math.min(opts.limit ?? 10, 50));

  if (opts.snapshotType) {
    query = query.eq("snapshot_type", opts.snapshotType);
  }
  if (opts.phase) {
    query = query.eq("phase", opts.phase);
  }

  const { data, error } = await query;
  if (error) {
    return { ok: false, skipped: false, data: [], error: mapSupabaseError(error) };
  }

  return { ok: true, data: data ?? [], skipped: false };
}
