/**
 * Lead persistence — buyer intent records (CRM sync later).
 */

import { BACKEND_CONFIG } from "../config.js";
import { mapSupabaseError } from "../supabase/errors.js";
import { optionalClient, sanitizePayload } from "./persistenceUtils.js";

/**
 * @param {{
 *   sessionKey?: string;
 *   sourcePage?: string;
 *   pairSlug?: string;
 *   vehicleSlugs?: string[];
 *   confidence?: 'low'|'medium'|'high';
 *   payload?: object;
 * }} input
 */
export async function insertLead(input) {
  const supabase = optionalClient();
  if (!supabase) {
    return { ok: false, skipped: true, reason: "not_configured" };
  }

  const confidence = ["low", "medium", "high"].includes(input.confidence)
    ? input.confidence
    : "medium";

  const row = {
    session_key: input.sessionKey?.slice(0, 128) || null,
    source_page: input.sourcePage?.slice(0, 256) || null,
    pair_slug: input.pairSlug?.slice(0, 128) || null,
    vehicle_slugs: Array.isArray(input.vehicleSlugs)
      ? input.vehicleSlugs.map((s) => String(s).slice(0, 64)).slice(0, 8)
      : [],
    status: "new",
    confidence,
    payload: sanitizePayload(input.payload),
  };

  const { data, error } = await supabase
    .from(BACKEND_CONFIG.tables.leads)
    .insert(row)
    .select("id, status, created_at")
    .single();

  if (error) {
    return { ok: false, skipped: false, error: mapSupabaseError(error) };
  }

  return { ok: true, data, skipped: false };
}

export async function listRecentLeads(opts = {}) {
  const supabase = optionalClient();
  if (!supabase) {
    return { ok: false, skipped: true, data: [], reason: "not_configured" };
  }

  const { data, error } = await supabase
    .from(BACKEND_CONFIG.tables.leads)
    .select("id, source_page, pair_slug, status, confidence, created_at")
    .order("created_at", { ascending: false })
    .limit(Math.min(opts.limit ?? 20, 100));

  if (error) {
    return { ok: false, skipped: false, data: [], error: mapSupabaseError(error) };
  }

  return { ok: true, data: data ?? [], skipped: false };
}
