/**
 * Compare event persistence — mirrors usageLearningBuffer event types.
 */

import { BACKEND_CONFIG } from "../config.js";
import { mapSupabaseError } from "../supabase/errors.js";
import {
  optionalClient,
  sanitizePayload,
} from "./persistenceUtils.js";

/**
 * @param {{
 *   eventType: string;
 *   sessionKey?: string;
 *   pairSlug?: string;
 *   vehicleSlugs?: string[];
 *   payload?: object;
 * }} input
 */
export async function insertCompareEvent(input) {
  const supabase = optionalClient();
  if (!supabase) {
    return { ok: false, skipped: true, reason: "not_configured" };
  }

  const row = {
    session_key: input.sessionKey?.slice(0, 128) || null,
    event_type: String(input.eventType || "unknown").slice(0, 64),
    pair_slug: input.pairSlug?.slice(0, 128) || null,
    vehicle_slugs: Array.isArray(input.vehicleSlugs)
      ? input.vehicleSlugs.map((s) => String(s).slice(0, 64)).slice(0, 8)
      : [],
    payload: sanitizePayload(input.payload),
  };

  const { data, error } = await supabase
    .from(BACKEND_CONFIG.tables.compareEvents)
    .insert(row)
    .select("id, created_at")
    .single();

  if (error) {
    return { ok: false, skipped: false, error: mapSupabaseError(error) };
  }

  return { ok: true, data, skipped: false };
}

/**
 * @param {{ pairSlug?: string; limit?: number }} [opts]
 */
export async function listRecentCompareEvents(opts = {}) {
  const supabase = optionalClient();
  if (!supabase) {
    return { ok: false, skipped: true, data: [], reason: "not_configured" };
  }

  let query = supabase
    .from(BACKEND_CONFIG.tables.compareEvents)
    .select("id, event_type, pair_slug, session_key, created_at")
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
