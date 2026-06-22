import { useEffect, useMemo, useState } from "react";

import { TIER1_MODEL_FAMILY_SLUGS } from "../../data/tier1ModelFamilies.js";
import { fetchModelFamiliesForListing } from "../../utils/vehicleDetailResolver.js";

/**
 * @returns {{
 *   families: object[],
 *   loading: boolean,
 *   error: "load_failed"|null,
 * }}
 */
export function useOwnershipVehicleIndex() {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFamilies() {
      setLoading(true);
      setError(null);

      try {
        const allFamilies = await fetchModelFamiliesForListing(120);
        if (cancelled) return;

        const tier1Set = new Set(TIER1_MODEL_FAMILY_SLUGS);
        const tier1Families = allFamilies
          .filter((family) => tier1Set.has(family.familySlug))
          .sort((a, b) =>
            String(a.familyName || a.familySlug).localeCompare(
              String(b.familyName || b.familySlug)
            )
          );

        setFamilies(tier1Families);
      } catch {
        if (!cancelled) {
          setFamilies([]);
          setError("load_failed");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadFamilies();

    return () => {
      cancelled = true;
    };
  }, []);

  const familyCount = useMemo(() => families.length, [families]);

  return {
    families,
    familyCount,
    loading,
    error,
  };
}
