import { API_URL } from "../config";

import normalizeCar from "./normalizeCar";

import {
  aggregateModelFamilies,
  extractFamilySlug,
  isVariantSlug,
} from "./modelFamily";

import {
  normalizeVehicleSlug,
  resolveSlugCandidates,
} from "./vehicleRoutes";

import {
  logSlugLookupFailure,
  logSlugResolved,
} from "./routeObservability";

import { logProduction } from "./productionLog";

const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

function vehicleFromCatalogDto(dto) {
  if (!dto) return null;
  if (dto.marketplace) return dto.marketplace;
  if (dto.slug && dto.name) return dto;
  return null;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) return { ok: false, status: res.status, data: null };
  const data = await res.json();
  return { ok: true, status: res.status, data };
}

/**
 * Fetch vehicle by slug with deterministic fallback chain.
 * @returns {Promise<{ vehicle: object, resolvedSlug: string, source?: string } | null>}
 */
export async function fetchVehicleBySlug(rawSlug) {
  const candidates = resolveSlugCandidates(rawSlug);

  for (const candidate of candidates) {
    try {
      const primary = await fetchJson(
        `${API_URL}/cars/slug/${encodeURIComponent(candidate)}`
      );

      if (primary.ok && primary.data && !primary.data.error) {
        const resolvedSlug =
          normalizeVehicleSlug(primary.data.slug) || candidate;

        logSlugResolved(rawSlug, resolvedSlug, "cars-slug");

        return {
          vehicle: primary.data,
          resolvedSlug,
          source: primary.data.catalogSource || "api",
        };
      }

      if (primary.status >= 500) {
        logProduction(
          "api",
          "detail_slug_fetch_failed",
          { candidate, status: primary.status },
          "warn"
        );
      }
    } catch (err) {
      logProduction(
        "api",
        "detail_slug_fetch_error",
        { candidate, message: err?.message },
        "warn"
      );
    }

    try {
      const catalog = await fetchJson(
        `${API_URL}/api/catalog/variants/slug/${encodeURIComponent(candidate)}`
      );

      if (catalog.ok && catalog.data && !catalog.data.error) {
        const vehicle = vehicleFromCatalogDto(catalog.data);
        if (vehicle) {
          const resolvedSlug =
            normalizeVehicleSlug(
              vehicle.slug || catalog.data?.identity?.slug
            ) || candidate;

          logSlugResolved(rawSlug, resolvedSlug, "catalog-api");

          return {
            vehicle,
            resolvedSlug,
            source: catalog.data.catalogSource || "catalog-api",
          };
        }
      }
    } catch {
      /* try next candidate */
    }
  }

  const trimmed = String(rawSlug || "").trim();
  if (OBJECT_ID_PATTERN.test(trimmed)) {
    try {
      const res = await fetch(
        `${API_URL}/cars/${encodeURIComponent(trimmed)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error) {
          const resolvedSlug =
            normalizeVehicleSlug(data.slug) || trimmed;
          return {
            vehicle: data,
            resolvedSlug,
            source: "id",
          };
        }
      }
    } catch {
      /* fall through */
    }
  }

  logSlugLookupFailure(rawSlug, candidates);
  return null;
}

/**
 * Load catalog vehicles for related-vehicle fallback UI.
 * @returns {Promise<object[]>}
 */
export async function fetchCatalogVehiclesForFallback(limit = 50) {
  try {
    const res = await fetch(
      `${API_URL}/cars?limit=${encodeURIComponent(limit)}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.cars) ? data.cars : [];
  } catch {
    return [];
  }
}

/**
 * Load model family + all variants for detail page.
 * @returns {Promise<{
 *   family: object,
 *   variants: object[],
 *   vehicle: object,
 *   familySlug: string,
 *   selectedVariantSlug: string,
 *   canonicalizeTo?: string
 * } | null>}
 */
export async function fetchVehicleFamilyBySlug(
  rawSlug,
  options = {}
) {
  const requested = normalizeVehicleSlug(rawSlug);
  if (!requested) return null;

  const familySlug = extractFamilySlug(requested);
  const catalogRaw = await fetchCatalogVehiclesForFallback(50);
  const catalog = catalogRaw.map(normalizeCar);
  const siblings = catalog.filter(
    (c) => extractFamilySlug(c.slug) === familySlug
  );

  let variants = siblings;

  if (variants.length === 0) {
    const single = await fetchVehicleBySlug(requested);
    if (!single?.vehicle) return null;
    variants = [normalizeCar(single.vehicle)];
  }

  const families = aggregateModelFamilies(variants);
  const family =
    families.find((f) => f.familySlug === familySlug) ||
    families[0];

  if (!family) return null;

  const preferredVariant =
    normalizeVehicleSlug(options.variantSlug) ||
    (isVariantSlug(requested) ? requested : null);

  const selected =
    family.variants.find(
      (v) => v.slug === preferredVariant
    ) ||
    family.defaultVariant ||
    family.variants[0];

  const canonicalizeTo =
    isVariantSlug(requested) &&
    requested !== familySlug
      ? familySlug
      : null;

  return {
    family,
    variants: family.variants,
    vehicle: selected,
    familySlug: family.familySlug,
    selectedVariantSlug: selected.slug,
    canonicalizeTo,
  };
}

export async function fetchModelFamiliesForListing(limit = 50) {
  const cars = await fetchCatalogVehiclesForFallback(limit);
  return aggregateModelFamilies(cars.map(normalizeCar));
}

