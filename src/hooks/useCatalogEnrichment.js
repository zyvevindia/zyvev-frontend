import { useEffect, useState } from "react";

import { API_URL } from "../config";

import {
  CATALOG_DETAIL_ENRICH,
  hasCatalogExperience,
  isGoldTierSlug,
  mergeCatalogIntoVehicle,
} from "../utils/catalogExperience";

/**
 * Optionally merges master catalog API data into vehicle for gold UX.
 * Default OFF in production (VITE_CATALOG_DETAIL_ENRICH !== true).
 */
export default function useCatalogEnrichment(
  vehicle,
  slug
) {
  const [enriched, setEnriched] =
    useState(vehicle);

  const [catalogLoading, setCatalogLoading] =
    useState(false);

  useEffect(() => {
    setEnriched(vehicle);
  }, [vehicle]);

  useEffect(() => {
    if (!slug || !vehicle) return;

    if (hasCatalogExperience(vehicle)) {
      return;
    }

    const shouldTry =
      CATALOG_DETAIL_ENRICH &&
      isGoldTierSlug(slug);

    if (!shouldTry) return;

    let cancelled = false;

    async function load() {
      setCatalogLoading(true);

      try {
        const res = await fetch(
          `${API_URL}/api/catalog/variants/slug/${encodeURIComponent(slug)}`
        );

        if (!res.ok) {
          return;
        }

        const catalogDto = await res.json();

        if (cancelled) return;

        setEnriched(
          mergeCatalogIntoVehicle(
            vehicle,
            catalogDto
          )
        );
      } catch {
        /* keep legacy vehicle */
      } finally {
        if (!cancelled) {
          setCatalogLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [slug, vehicle]);

  return {
    vehicle: enriched,
    catalogLoading,
    hasGoldExperience:
      hasCatalogExperience(enriched),
  };
}
