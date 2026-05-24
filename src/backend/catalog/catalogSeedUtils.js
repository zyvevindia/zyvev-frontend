/**
 * Shared catalog seed utilities — service-role scripts only.
 */

import {
  cloudinaryPublicId,
  cloudinaryUrl,
  CATALOG_CONVENTIONS,
} from "./catalogConventions.js";

const TABLES = {
  vehicles: "vehicles",
  variants: "vehicle_variants",
  media: "vehicle_media",
};

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {import('./tier1CatalogDefinitions.js').TIER1_CATALOG_DEFINITIONS[0]} definition
 * @param {{ seedPhase?: string; cloudName?: string }} [opts]
 */
export async function seedCatalogVehicle(supabase, definition, opts = {}) {
  const seedPhase = opts.seedPhase || "day3-catalog-ops";
  const cloudName = opts.cloudName || process.env.VITE_CLOUDINARY_CLOUD_NAME || "dznvmumze";

  const vehicleRow = {
    slug: definition.slug,
    brand: definition.brand,
    name: definition.name,
    category: definition.category,
    oem_family: definition.slug,
    compare_ready: definition.compareReady !== false,
    status: "active",
    ownership_meta: definition.ownershipMeta || {},
    charging_meta: definition.chargingMeta || {},
    seo_meta: { canonicalFamily: definition.slug, market: "IN" },
    metadata: {
      seed: seedPhase,
      tier1: true,
      operationalNote: "Indicative specs — verify before campaigns",
    },
  };

  const { data: vehicle, error: vErr } = await supabase
    .from(TABLES.vehicles)
    .upsert(vehicleRow, { onConflict: "slug" })
    .select("id, slug, brand, name")
    .single();

  if (vErr) {
    return { ok: false, error: vErr, vehicle: null };
  }

  let primaryVariantId = null;
  const variantResults = [];

  for (const v of definition.variants || []) {
    const { data: variant, error: varErr } = await supabase
      .from(TABLES.variants)
      .upsert(
        {
          vehicle_id: vehicle.id,
          slug: v.slug,
          name: v.name,
          price_inr: v.priceInr,
          range_km_claimed: v.rangeKmClaimed,
          range_km_real_world: v.rangeKmRealWorld,
          battery_kwh: v.batteryKwh,
          specs: { drivetrain: "FWD", seats: 5, ...(v.specs || {}) },
          compare_specs: {
            claimedRangeKm: v.rangeKmClaimed,
            batteryKwh: v.batteryKwh,
            ...(v.compareSpecs || {}),
          },
          status: "active",
        },
        { onConflict: "vehicle_id,slug" }
      )
      .select("id, slug, name")
      .single();

    if (varErr) {
      return { ok: false, error: varErr, vehicle, variants: variantResults };
    }
    if (!primaryVariantId) primaryVariantId = variant.id;
    variantResults.push(variant);
  }

  const mediaResults = [];
  for (let i = 0; i < CATALOG_CONVENTIONS.mediaRoles.length; i += 1) {
    const role = CATALOG_CONVENTIONS.mediaRoles[i];
    const publicId = cloudinaryPublicId(definition.slug, role);
    const { error: mErr } = await supabase.from(TABLES.media).upsert(
      {
        vehicle_id: vehicle.id,
        variant_id: role === "hero" ? primaryVariantId : null,
        role,
        cloudinary_public_id: publicId,
        url: cloudinaryUrl(definition.slug, role, cloudName),
        sort_order: i,
        is_fallback: false,
        metadata: { seed: seedPhase },
      },
      { onConflict: "vehicle_id,role,sort_order" }
    );

    if (mErr) {
      return { ok: false, error: mErr, vehicle, variants: variantResults, media: mediaResults };
    }
    mediaResults.push(role);
  }

  return {
    ok: true,
    vehicle,
    variants: variantResults,
    media: mediaResults,
    variantCount: variantResults.length,
    mediaCount: mediaResults.length,
  };
}

export async function getCatalogVehicleCounts(supabase, familySlug) {
  const { data: vehicle, error: vErr } = await supabase
    .from(TABLES.vehicles)
    .select("id, slug")
    .eq("slug", familySlug)
    .maybeSingle();

  if (vErr || !vehicle) {
    return { ok: false, vehicle: null, variantCount: 0, mediaCount: 0 };
  }

  const { count: variantCount } = await supabase
    .from(TABLES.variants)
    .select("id", { count: "exact", head: true })
    .eq("vehicle_id", vehicle.id);

  const { count: mediaCount } = await supabase
    .from(TABLES.media)
    .select("id", { count: "exact", head: true })
    .eq("vehicle_id", vehicle.id);

  return {
    ok: true,
    vehicle,
    variantCount: variantCount ?? 0,
    mediaCount: mediaCount ?? 0,
  };
}

export { TABLES, CATALOG_CONVENTIONS };
