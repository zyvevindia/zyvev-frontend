/**
 * Supabase browser client — anon key only.
 */

import { createClient } from "@supabase/supabase-js";

import { validateBackendEnv } from "../envValidation.js";

let client = null;
/** @type {string | null} */
let clientUrl = null;

/**
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 */
export function getSupabaseClient() {
  const env = validateBackendEnv();
  if (!env.configured) {
    client = null;
    clientUrl = null;
    return null;
  }

  if (!client || clientUrl !== env.supabaseUrl) {
    client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "evsavari-supabase-auth",
      },
    });
    clientUrl = env.supabaseUrl;
  }

  return client;
}

export function resetSupabaseClientForTests() {
  client = null;
  clientUrl = null;
}
