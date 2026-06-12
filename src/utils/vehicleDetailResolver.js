import { API_URL } from "../config";
import { safeFetchJsonWithRetry } from "./safeFetch";

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

import { pickDefaultVariantForDetail } from "./variantInsights";
import {
  buildVerifiedDossierMarketplaceVariants,
  hasVerifiedDossier,
} from "../data/catalog/verified/buildVerifiedDossierVariants.js";
import { resolveDossierSlug } from "../data/catalog/verified/resolveDossierSlug.js";
import {
  fetchGoldenDatasetMarketplaceVariants,
  goldenDossierToMarketplaceVariants,
  isGoldenDatasetFamily,
  loadBundledGoldenDatasetFamilyVariants,
  loadBundledGoldenDatasetMarketplaceVariants,
} from "./goldenCatalogListing.js";
import { loadGoldenDossierByFamilySlug } from "../catalogAcquisition/benchmark/goldenLoader.js";

const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

/**
 * Phase 2 authority: families in golden manifest always use public golden JSON.
 * Verified dossier and API paths apply only when the family is absent from manifest.
 * @param {string} familySlug
 * @returns {Promise<object[]>}
 */
async function loadGoldenAuthorityFamilyVariants(familySlug) {
  let variants = loadBundledGoldenDatasetFamilyVariants(familySlug);

  if (variants.length === 0) {
    const golden = await loadGoldenDossierByFamilySlug(familySlug);
    if (golden?.dossier) {
      variants = goldenDossierToMarketplaceVariants(golden.dossier).map(
        normalizeCar
      );
    }
  }

  return variants;
}

function vehicleFromCatalogDto(dto) {
  if (!dto) return null;
  if (dto.marketplace) return dto.marketplace;
  if (dto.slug && dto.name) return dto;
  return null;
}

async function fetchJson(url, label = "vehicle_detail") {
  return safeFetchJsonWithRetry(url, {
    label,
    fallback: null,
    timeoutMs: 20000,
  });
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
      const byId = await fetchJson(
        `${API_URL}/cars/${encodeURIComponent(trimmed)}`,
        "vehicle_by_id"
      );
      if (byId.ok && byId.data && !byId.data.error) {
        const data = byId.data;
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
  const res = await safeFetchJsonWithRetry(
    `${API_URL}/cars?limit=${encodeURIComponent(limit)}`,
    {
      label: "catalog_fallback_list",
      fallback: { cars: [] },
      timeoutMs: 20000,
    }
  );
  if (!res.ok) return [];
  return Array.isArray(res.data?.cars) ? res.data.cars : [];
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

  let variants;
  if (isGoldenDatasetFamily(familySlug)) {
    variants = await loadGoldenAuthorityFamilyVariants(familySlug);
  } else if (hasVerifiedDossier(familySlug)) {
    variants = buildVerifiedDossierMarketplaceVariants(familySlug);
  } else {
    const catalogRaw = await fetchCatalogVehiclesForFallback(50);
    const catalog = catalogRaw.map(normalizeCar);
    const siblings = catalog.filter(
      (c) => extractFamilySlug(c.slug) === familySlug
    );

    variants = siblings;

    if (variants.length === 0) {
      const golden = await loadGoldenDossierByFamilySlug(familySlug);
      if (golden?.dossier) {
        variants = goldenDossierToMarketplaceVariants(golden.dossier).map(
          normalizeCar
        );
      } else {
        variants = loadBundledGoldenDatasetMarketplaceVariants().filter(
          (c) => extractFamilySlug(c.slug) === familySlug
        );
      }
    }

    if (variants.length === 0) {
      const single = await fetchVehicleBySlug(requested);
      if (!single?.vehicle) return null;
      variants = [normalizeCar(single.vehicle)];
    }
  }

  const families = aggregateModelFamilies(variants);
  const family =
    families.find((f) => f.familySlug === familySlug) ||
    families[0];

  if (!family) return null;

  const preferredRaw =
    normalizeVehicleSlug(options.variantSlug) ||
    (isVariantSlug(requested) ? requested : null);
  const preferredVariant = preferredRaw
    ? resolveDossierSlug(preferredRaw, familySlug)
    : null;

  const selected =
    family.variants.find(
      (v) =>
        normalizeVehicleSlug(v.slug) ===
        normalizeVehicleSlug(preferredVariant)
    ) ||
    pickDefaultVariantForDetail(family.variants) ||
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

export async function fetchListingCatalogVariants(options = {}) {
  const limit = options.limit ?? 120;

  const [apiRaw, goldenFetched] = await Promise.all([
    fetchCatalogVehiclesForFallback(limit),
    fetchGoldenDatasetMarketplaceVariants(),
  ]);

  const goldenVariants = goldenFetched.length
    ? goldenFetched
    : loadBundledGoldenDatasetMarketplaceVariants();

  const apiVariants = apiRaw.map(normalizeCar);

  const familySlugs = new Set([
    ...goldenVariants.map((v) => extractFamilySlug(v.slug)),
    ...apiVariants.map((v) => extractFamilySlug(v.slug)),
  ]);

  const merged = [];

  for (const familySlug of familySlugs) {
    if (!familySlug) continue;

    if (isGoldenDatasetFamily(familySlug)) {
      const goldenFam = goldenVariants.filter(
        (v) => extractFamilySlug(v.slug) === familySlug
      );
      const familyVariants =
        goldenFam.length > 0
          ? goldenFam
          : loadBundledGoldenDatasetFamilyVariants(familySlug);

      if (familyVariants.length > 0) {
        merged.push(...familyVariants);
        continue;
      }
    }

    if (hasVerifiedDossier(familySlug)) {
      merged.push(
        ...buildVerifiedDossierMarketplaceVariants(familySlug).map(normalizeCar)
      );
      continue;
    }

    const goldenFam = goldenVariants.filter(
      (v) => extractFamilySlug(v.slug) === familySlug
    );

    const apiFam = apiVariants.filter(
      (v) => extractFamilySlug(v.slug) === familySlug
    );

    if (apiFam.length > 0) {
      merged.push(...apiFam);
      continue;
    }

    merged.push(...goldenFam);
  }

  return merged;
}

export async function fetchModelFamiliesForListing(limit = 120) {
  const variants = await fetchListingCatalogVariants({ limit });
  return aggregateModelFamilies(variants);
}

