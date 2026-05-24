/**
 * Trust feedback persistence — buyer doubt / trust signals.
 */

import { BACKEND_CONFIG } from "../config.js";
import { mapSupabaseError } from "../supabase/errors.js";
import { optionalClient, sanitizePayload } from "./persistenceUtils.js";

/**
 * @param {{
 *   feedbackType: string;
 *   sessionKey?: string;
 *   pairSlug?: string;
 *   severity?: 'low'|'medium'|'high';
 *   payload?: object;
 * }} input
 */
export async function insertTrustFeedback(input) {
  const supabase = optionalClient();
  if (!supabase) {
    return { ok: false, skipped: true, reason: "not_configured" };
  }

  const severity = ["low", "medium", "high"].includes(input.severity)
    ? input.severity
    : "medium";

  const row = {
    session_key: input.sessionKey?.slice(0, 128) || null,
    feedback_type: String(input.feedbackType || "unknown").slice(0, 64),
    pair_slug: input.pairSlug?.slice(0, 128) || null,
    severity,
    payload: sanitizePayload(input.payload),
  };

  const { data, error } = await supabase
    .from(BACKEND_CONFIG.tables.trustFeedback)
    .insert(row)
    .select("id, created_at")
    .single();

  if (error) {
    return { ok: false, skipped: false, error: mapSupabaseError(error) };
  }

  return { ok: true, data, skipped: false };
}

export async function listRecentTrustFeedback(opts = {}) {
  const supabase = optionalClient();
  if (!supabase) {
    return { ok: false, skipped: true, data: [], reason: "not_configured" };
  }

  let query = supabase
    .from(BACKEND_CONFIG.tables.trustFeedback)
    .select("id, feedback_type, pair_slug, severity, created_at")
    .order("created_at", { ascending: false })
    .limit(Math.min(opts.limit ?? 20, 100));

  if (opts.pairSlug) {
    query = query.eq("pair_slug", opts.pairSlug);
  }

  const { data, error } = await query;
  if (error) {
    return { ok: false, skipped: false, data: [], error: mapSupabaseError(error) };
  }

  return { ok: true, data: data ?? [], skipped: false };
}
