import { useEffect, useMemo, useState } from "react";

import { TIER1_MODEL_FAMILY_SLUGS } from "../../data/tier1ModelFamilies.js";
import { resolveReviewFamilyName } from "../../reviews/reviewBuilderUtils.js";
import { fetchVehicleFamilyBySlug } from "../../utils/vehicleDetailResolver.js";
import { normalizeVehicleSlug } from "../../utils/vehicleRoutes.js";

/**
 * @param {string|null|undefined} routeSlug
 * @returns {{
 *   vehicleSlug: string,
 *   vehicle: object|null,
 *   variants: object[],
 *   familyName: string,
 *   loading: boolean,
 *   error: "not_found"|"load_failed"|null,
 *   isValidSlug: boolean,
 * }}
 */
export function useOwnershipPageVehicle(routeSlug) {
  const vehicleSlug = normalizeVehicleSlug(routeSlug);
  const isValidSlug = TIER1_MODEL_FAMILY_SLUGS.includes(vehicleSlug);

  const [vehicle, setVehicle] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadVehicle() {
      if (!vehicleSlug || !isValidSlug) {
        setVehicle(null);
        setVariants([]);
        setError(vehicleSlug ? "not_found" : "not_found");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await fetchVehicleFamilyBySlug(vehicleSlug);
        if (cancelled) return;

        if (!result?.vehicle) {
          setVehicle(null);
          setVariants([]);
          setError("not_found");
          return;
        }

        setVehicle(result.vehicle);
        setVariants(result.variants || []);
      } catch {
        if (!cancelled) {
          setVehicle(null);
          setVariants([]);
          setError("load_failed");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadVehicle();

    return () => {
      cancelled = true;
    };
  }, [vehicleSlug, isValidSlug]);

  const familyName = useMemo(
    () => resolveReviewFamilyName(vehicle, vehicleSlug),
    [vehicle, vehicleSlug]
  );

  return {
    vehicleSlug,
    vehicle,
    variants,
    familyName,
    loading,
    error,
    isValidSlug,
  };
}
