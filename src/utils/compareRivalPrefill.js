import { useNavigate } from "react-router-dom";
import { useCallback, useState } from "react";

import { fetchCatalogCarsForCompareSlugs } from "./compareGuideCatalog";
import {
  MAX_COMPARE_CARS,
  replaceCompareCars,
  sanitizeCompareCar,
} from "./compareCarsStorage";
import { normalizeVehicleSlug } from "./vehicleRoutes";

/**
 * Build ordered slug list for a detail-page compare session.
 * @param {object} currentCar
 * @param {string[]} rivalSlugs
 * @param {number} [maxCars]
 */
export function buildRivalCompareSlugOrder(
  currentCar,
  rivalSlugs = [],
  maxCars = MAX_COMPARE_CARS
) {
  const currentSlug = normalizeVehicleSlug(
    currentCar?.slug || currentCar?.familySlug || ""
  );
  if (!currentSlug) return [];

  const rivals = [...new Set(rivalSlugs.map(normalizeVehicleSlug))]
    .filter((slug) => slug && slug !== currentSlug)
    .slice(0, Math.max(0, maxCars - 1));

  return [currentSlug, ...rivals].slice(0, maxCars);
}

/**
 * Fetch catalog cars and persist compare list for navigation.
 * @param {string[]} slugOrder
 */
export async function prefetchCompareCarsForSlugs(slugOrder) {
  const slugs = slugOrder.filter(Boolean);
  if (slugs.length < 2) return [];

  const fromCatalog = await fetchCatalogCarsForCompareSlugs(slugs);
  if (fromCatalog.length >= 2) {
    return replaceCompareCars(fromCatalog);
  }

  const stubs = slugs
    .map((slug) =>
      sanitizeCompareCar({
        _id: slug,
        slug,
        name: slug.replace(/-/g, " "),
      })
    )
    .filter(Boolean);

  return stubs.length >= 2 ? replaceCompareCars(stubs) : [];
}

/**
 * Navigate to /compare with prefilled vehicles (detail rival one-click).
 * @param {object} params
 * @param {object} params.currentCar
 * @param {string[]} params.rivalSlugs
 * @param {import('react-router-dom').NavigateFunction} params.navigate
 * @param {number} [params.maxCars]
 */
export async function startCompareWithRivals({
  currentCar,
  rivalSlugs = [],
  navigate,
  maxCars = MAX_COMPARE_CARS,
}) {
  const slugOrder = buildRivalCompareSlugOrder(
    currentCar,
    rivalSlugs,
    maxCars
  );
  if (slugOrder.length < 2) return;

  const list = await prefetchCompareCarsForSlugs(slugOrder);
  if (list.length < 2) return;

  navigate("/compare", {
    state: { cars: list },
  });
}

/**
 * Compare current vehicle with a single rival (2-up session).
 */
export async function startCompareWithSingleRival({
  currentCar,
  rivalSlug,
  navigate,
}) {
  return startCompareWithRivals({
    currentCar,
    rivalSlugs: [rivalSlug],
    navigate,
    maxCars: 2,
  });
}

/**
 * React hook for detail-page rival compare actions.
 */
export function useCompareRivalPrefill(currentCar) {
  const navigate = useNavigate();
  const [loadingSlug, setLoadingSlug] = useState(null);

  const compareWithRivals = useCallback(
    async (rivalSlugs, options = {}) => {
      setLoadingSlug("__all__");
      try {
        await startCompareWithRivals({
          currentCar,
          rivalSlugs,
          navigate,
          maxCars: options.maxCars,
        });
      } finally {
        setLoadingSlug(null);
      }
    },
    [currentCar, navigate]
  );

  const compareWithRival = useCallback(
    async (rivalSlug) => {
      setLoadingSlug(rivalSlug);
      try {
        await startCompareWithSingleRival({
          currentCar,
          rivalSlug,
          navigate,
        });
      } finally {
        setLoadingSlug(null);
      }
    },
    [currentCar, navigate]
  );

  return { compareWithRivals, compareWithRival, loadingSlug };
}
