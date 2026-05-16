import { API_URL } from "../config";

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
