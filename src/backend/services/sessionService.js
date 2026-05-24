/**
 * Session persistence — anonymous + future authenticated sessions.
 */

import { BACKEND_CONFIG } from "../config.js";
import { mapSupabaseError } from "../supabase/errors.js";
import { optionalClient, sanitizePayload } from "./persistenceUtils.js";

/**
 * @param {{ sessionKey: string; userId?: string; source?: string; metadata?: object }} input
 */
export async function touchSession(input) {
  const supabase = optionalClient();
  if (!supabase) {
    return { ok: false, skipped: true, reason: "not_configured" };
  }

  const sessionKey = String(input.sessionKey || "").slice(0, 128);
  if (!sessionKey) {
    return { ok: false, skipped: false, error: new Error("sessionKey required") };
  }

  const now = new Date().toISOString();
  const row = {
    session_key: sessionKey,
    user_id: input.userId || null,
    last_seen_at: now,
    source: input.source?.slice(0, 64) || "web",
    metadata: sanitizePayload(input.metadata),
  };

  const { data: existing, error: findError } = await supabase
    .from(BACKEND_CONFIG.tables.sessions)
    .select("id")
    .eq("session_key", sessionKey)
    .maybeSingle();

  if (findError) {
    return { ok: false, skipped: false, error: mapSupabaseError(findError) };
  }

  if (existing?.id) {
    const { data, error } = await supabase
      .from(BACKEND_CONFIG.tables.sessions)
      .update({ last_seen_at: now, source: row.source })
      .eq("id", existing.id)
      .select("id, session_key, last_seen_at")
      .single();

    if (error) {
      return { ok: false, skipped: false, error: mapSupabaseError(error) };
    }
    return { ok: true, data, skipped: false, created: false };
  }

  const { data, error } = await supabase
    .from(BACKEND_CONFIG.tables.sessions)
    .insert({ ...row, started_at: now })
    .select("id, session_key, started_at")
    .single();

  if (error) {
    return { ok: false, skipped: false, error: mapSupabaseError(error) };
  }

  return { ok: true, data, skipped: false, created: true };
}

export async function getSessionByKey(sessionKey) {
  const supabase = optionalClient();
  if (!supabase) {
    return { ok: false, skipped: true, data: null, reason: "not_configured" };
  }

  const { data, error } = await supabase
    .from(BACKEND_CONFIG.tables.sessions)
    .select("id, session_key, user_id, started_at, last_seen_at")
    .eq("session_key", String(sessionKey).slice(0, 128))
    .maybeSingle();

  if (error) {
    return { ok: false, skipped: false, data: null, error: mapSupabaseError(error) };
  }

  return { ok: true, data, skipped: false };
}
