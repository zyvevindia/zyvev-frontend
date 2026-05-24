/**
 * Supabase auth scaffolding — future admin security foundation.
 * Does NOT replace existing JWT PrivateRoute / Login flow yet.
 */

import { BACKEND_CONFIG } from "../config.js";
import { getSupabaseClient } from "../supabase/client.js";
import { mapSupabaseError } from "../supabase/errors.js";

/** Map Supabase session role to EVSavari admin roles */
export function normalizeRole(rawRole) {
  const role = String(rawRole || "").toLowerCase();
  if (BACKEND_CONFIG.adminRoles.includes(role)) return role;
  if (role === "authenticated") return "viewer";
  return "viewer";
}

/**
 * @returns {Promise<{ ok: boolean; session: object|null; skipped?: boolean; error?: Error }>}
 */
export async function getSupabaseSession() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { ok: false, session: null, skipped: true, reason: "not_configured" };
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return { ok: false, session: null, error: mapSupabaseError(error) };
  }

  return { ok: true, session: data.session ?? null, skipped: false };
}

/**
 * Prepare admin profile row after Supabase sign-in (upsert users table).
 * Requires authenticated Supabase session + RLS policies on users (future migration).
 */
export async function ensureAdminProfile({ email, role = "admin", displayName } = {}) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { ok: false, skipped: true, reason: "not_configured" };
  }

  const sessionResult = await getSupabaseSession();
  if (!sessionResult.ok || !sessionResult.session?.user) {
    return { ok: false, skipped: false, error: new Error("No Supabase session") };
  }

  const user = sessionResult.session.user;
  const normalizedRole = normalizeRole(role);

  const row = {
    auth_user_id: user.id,
    email: email || user.email,
    role: normalizedRole,
    display_name: displayName || user.email?.split("@")[0] || "Admin",
    metadata: { provider: user.app_metadata?.provider || "email" },
  };

  const { data, error } = await supabase
    .from(BACKEND_CONFIG.tables.users)
    .upsert(row, { onConflict: "auth_user_id" })
    .select("id, email, role")
    .single();

  if (error) {
    return { ok: false, skipped: false, error: mapSupabaseError(error) };
  }

  return { ok: true, data, skipped: false };
}

/**
 * Sign out Supabase session (parallel to legacy auth logout when wired).
 */
export async function signOutSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { ok: true, skipped: true };
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    return { ok: false, error: mapSupabaseError(error) };
  }

  return { ok: true, skipped: false };
}

/**
 * Whether Supabase auth is ready for future PrivateRoute integration.
 */
export function isSupabaseAuthConfigured() {
  return BACKEND_CONFIG.configured;
}
