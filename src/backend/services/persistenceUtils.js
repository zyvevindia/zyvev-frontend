/**
 * Shared persistence helpers — connection checks and safe table access.
 */

import { BACKEND_CONFIG } from "../config.js";
import { getSupabaseClient } from "../supabase/client.js";
import { mapSupabaseError, PersistenceError } from "../supabase/errors.js";

export function requireClient() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new PersistenceError(
      "Supabase is not configured (set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)",
      { code: "not_configured" }
    );
  }
  return supabase;
}

export function optionalClient() {
  return getSupabaseClient();
}

/**
 * Lightweight connection sanity — does not write data.
 */
export async function checkPersistenceConnection() {
  if (!BACKEND_CONFIG.configured) {
    return {
      ok: false,
      configured: false,
      reachable: false,
      message: "Supabase env not configured",
    };
  }

  try {
    const supabase = requireClient();
    const { error } = await supabase
      .from(BACKEND_CONFIG.tables.operationalSnapshots)
      .select("id")
      .limit(1);

    if (error) {
      return {
        ok: false,
        configured: true,
        reachable: false,
        message: error.message,
        code: error.code,
      };
    }

    return {
      ok: true,
      configured: true,
      reachable: true,
      message: "Connected",
    };
  } catch (err) {
    const mapped = mapSupabaseError(err);
    return {
      ok: false,
      configured: true,
      reachable: false,
      message: mapped.message,
      code: mapped.code,
    };
  }
}

export function sanitizePayload(obj, maxKeys = 40) {
  if (!obj || typeof obj !== "object") return {};
  const out = {};
  let n = 0;
  for (const [k, v] of Object.entries(obj)) {
    if (n >= maxKeys) break;
    if (typeof k !== "string" || k.startsWith("_")) continue;
    out[k.slice(0, 64)] = v;
    n += 1;
  }
  return out;
}
