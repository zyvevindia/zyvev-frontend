/**
 * Supabase admin client — Node/scripts ONLY.
 * Uses SUPABASE_SERVICE_ROLE_KEY (never VITE_* service role).
 */

import { createClient } from "@supabase/supabase-js";

/**
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 */
export function getSupabaseAdminClient() {
  const url = String(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ""
  )
    .trim()
    .replace(/\/$/, "");

  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!url || !serviceKey) {
    return null;
  }

  if (serviceKey.startsWith("VITE_")) {
    throw new Error("Service role key must not use VITE_ prefix");
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isSupabaseAdminConfigured() {
  return Boolean(getSupabaseAdminClient());
}
