/**
 * Vehicle catalog persistence — ingestion-ready family records.
 */

import { BACKEND_CONFIG } from "../config.js";
import { mapSupabaseError } from "../supabase/errors.js";
import { optionalClient, sanitizePayload } from "./persistenceUtils.js";

/**
 * @param {{
 *   slug: string;
 *   brand: string;
 *   name: string;
 *   category?: string;
 *   oemFamily?: string;
 *   compareReady?: boolean;
 *   ownershipMeta?: object;
 *   chargingMeta?: object;
 *   seoMeta?: object;
 *   metadata?: object;
 * }} input
 */
export async function upsertVehicle(input) {
  const supabase = optionalClient();
  if (!supabase) {
    return { ok: false, skipped: true, reason: "not_configured" };
  }

  const row = {
    slug: String(input.slug).slice(0, 128),
    brand: String(input.brand).slice(0, 64),
    name: String(input.name).slice(0, 128),
    category: input.category?.slice(0, 32) || "SUV",
    oem_family: input.oemFamily?.slice(0, 64) || null,
    compare_ready: input.compareReady !== false,
    ownership_meta: sanitizePayload(input.ownershipMeta),
    charging_meta: sanitizePayload(input.chargingMeta),
    seo_meta: sanitizePayload(input.seoMeta),
    metadata: sanitizePayload(input.metadata),
    status: "active",
  };

  const { data, error } = await supabase
    .from(BACKEND_CONFIG.tables.vehicles)
    .upsert(row, { onConflict: "slug" })
    .select("id, slug, brand, name")
    .single();

  if (error) {
    return { ok: false, skipped: false, error: mapSupabaseError(error) };
  }

  return { ok: true, data, skipped: false };
}

/**
 * @param {{
 *   vehicleId: string;
 *   slug: string;
 *   name: string;
 *   priceInr?: number;
 *   rangeKmClaimed?: number;
 *   rangeKmRealWorld?: number;
 *   batteryKwh?: number;
 *   specs?: object;
 *   compareSpecs?: object;
 * }} input
 */
export async function upsertVehicleVariant(input) {
  const supabase = optionalClient();
  if (!supabase) {
    return { ok: false, skipped: true, reason: "not_configured" };
  }

  const row = {
    vehicle_id: input.vehicleId,
    slug: String(input.slug).slice(0, 128),
    name: String(input.name).slice(0, 128),
    price_inr: input.priceInr ?? null,
    range_km_claimed: input.rangeKmClaimed ?? null,
    range_km_real_world: input.rangeKmRealWorld ?? null,
    battery_kwh: input.batteryKwh ?? null,
    specs: sanitizePayload(input.specs),
    compare_specs: sanitizePayload(input.compareSpecs),
    status: "active",
  };

  const { data, error } = await supabase
    .from(BACKEND_CONFIG.tables.vehicleVariants)
    .upsert(row, { onConflict: "vehicle_id,slug" })
    .select("id, vehicle_id, slug, name")
    .single();

  if (error) {
    return { ok: false, skipped: false, error: mapSupabaseError(error) };
  }

  return { ok: true, data, skipped: false };
}

export async function getVehicleBySlug(slug) {
  const supabase = optionalClient();
  if (!supabase) {
    return { ok: false, skipped: true, data: null, reason: "not_configured" };
  }

  const { data, error } = await supabase
    .from(BACKEND_CONFIG.tables.vehicles)
    .select("id, slug, brand, name, category, compare_ready, ownership_meta, charging_meta")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return { ok: false, skipped: false, data: null, error: mapSupabaseError(error) };
  }

  return { ok: true, data, skipped: false };
}

export async function listActiveVehicles(opts = {}) {
  const supabase = optionalClient();
  if (!supabase) {
    return { ok: false, skipped: true, data: [], reason: "not_configured" };
  }

  let query = supabase
    .from(BACKEND_CONFIG.tables.vehicles)
    .select("id, slug, brand, name, category, compare_ready")
    .eq("status", "active")
    .order("brand")
    .limit(Math.min(opts.limit ?? 50, 100));

  if (opts.brand) {
    query = query.eq("brand", opts.brand);
  }

  const { data, error } = await query;
  if (error) {
    return { ok: false, skipped: false, data: [], error: mapSupabaseError(error) };
  }

  return { ok: true, data: data ?? [], skipped: false };
}
