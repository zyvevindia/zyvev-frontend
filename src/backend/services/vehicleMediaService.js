/**
 * Vehicle media persistence — Cloudinary role mapping + fallback hierarchy.
 */

import { BACKEND_CONFIG } from "../config.js";
import { mapSupabaseError } from "../supabase/errors.js";
import { optionalClient, sanitizePayload } from "./persistenceUtils.js";

function normalizeRole(role) {
  const r = String(role || "").trim();
  return BACKEND_CONFIG.mediaRoles.includes(r) ? r : null;
}

/**
 * @param {{
 *   vehicleId: string;
 *   variantId?: string;
 *   role: string;
 *   cloudinaryPublicId?: string;
 *   url?: string;
 *   sortOrder?: number;
 *   isFallback?: boolean;
 *   metadata?: object;
 * }} input
 */
export async function upsertVehicleMedia(input) {
  const supabase = optionalClient();
  if (!supabase) {
    return { ok: false, skipped: true, reason: "not_configured" };
  }

  const role = normalizeRole(input.role);
  if (!role) {
    return {
      ok: false,
      skipped: false,
      error: new Error(`Invalid media role: ${input.role}`),
    };
  }

  const row = {
    vehicle_id: input.vehicleId,
    variant_id: input.variantId || null,
    role,
    cloudinary_public_id: input.cloudinaryPublicId?.slice(0, 256) || null,
    url: input.url?.slice(0, 512) || null,
    sort_order: Number.isFinite(input.sortOrder) ? input.sortOrder : 0,
    is_fallback: Boolean(input.isFallback),
    metadata: sanitizePayload(input.metadata),
  };

  const { data, error } = await supabase
    .from(BACKEND_CONFIG.tables.vehicleMedia)
    .upsert(row, { onConflict: "vehicle_id,role,sort_order" })
    .select("id, vehicle_id, role, cloudinary_public_id, url, is_fallback")
    .single();

  if (error) {
    return { ok: false, skipped: false, error: mapSupabaseError(error) };
  }

  return { ok: true, data, skipped: false };
}

/**
 * @param {{ vehicleId: string; roles?: string[] }} opts
 */
export async function listVehicleMedia(opts) {
  const supabase = optionalClient();
  if (!supabase) {
    return { ok: false, skipped: true, data: [], reason: "not_configured" };
  }

  let query = supabase
    .from(BACKEND_CONFIG.tables.vehicleMedia)
    .select("id, role, cloudinary_public_id, url, sort_order, is_fallback")
    .eq("vehicle_id", opts.vehicleId)
    .order("role")
    .order("sort_order");

  if (opts.roles?.length) {
    query = query.in("role", opts.roles.filter((r) => normalizeRole(r)));
  }

  const { data, error } = await query;
  if (error) {
    return { ok: false, skipped: false, data: [], error: mapSupabaseError(error) };
  }

  return { ok: true, data: data ?? [], skipped: false };
}

/**
 * Build role → url map for compare / listing (mirrors existing Cloudinary hierarchy).
 */
export function buildMediaRoleMap(rows = []) {
  const map = {};
  for (const row of rows) {
    if (!row?.role) continue;
    if (!map[row.role] || !row.is_fallback) {
      map[row.role] = {
        url: row.url,
        cloudinaryPublicId: row.cloudinary_public_id,
        isFallback: row.is_fallback,
      };
    }
  }
  return map;
}
