import { useEffect, useMemo, useState } from "react";

import { fetchListingCatalogVariants } from "../../utils/vehicleDetailResolver.js";
import { aggregateModelFamilies } from "../../utils/modelFamily.js";
import { applyLandingCatalogFilter } from "../filters/landingFilter.js";

/**
 * Read-only catalog hook for landing pages.
 * @param {import('../types.js').LandingFilterConfig | undefined} filterConfig
 */
export default function useLandingCatalog(filterConfig) {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    fetchListingCatalogVariants({ limit: 120 })
      .then((cars) => {
        if (cancelled) return;
        setFamilies(aggregateModelFamilies(cars));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("catalog_unavailable");
        setFamilies([]);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () => applyLandingCatalogFilter(families, filterConfig),
    [families, filterConfig]
  );

  return {
    families: filtered.families,
    cards: filtered.cards,
    fallbackNotice: filtered.fallbackNotice,
    loading,
    error,
    catalogSize: families.length,
  };
}
