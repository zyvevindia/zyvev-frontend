import { useCallback, useEffect, useMemo, useState } from "react";

import {
  extractCompareSlugsFromSeoPage,
  fetchCatalogCarsForCompareSlugs,
  mergeRankedWithCatalogCars,
} from "../utils/compareGuideCatalog";
import { saveCompareCars } from "../utils/compareCarsStorage";

/**
 * Hydrate full compare cars for /compare/:slug (single fetch path per page).
 * @param {object | null} seoPage
 * @param {{ syncStorage?: boolean }} [opts]
 */
export default function useCompareGuideCars(seoPage, opts = {}) {
  const { syncStorage = true } = opts;
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(Boolean(seoPage));
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  const retry = useCallback(() => setRetryKey((k) => k + 1), []);

  const slugOrder = useMemo(
    () => (seoPage ? extractCompareSlugsFromSeoPage(seoPage) : []),
    [seoPage]
  );

  useEffect(() => {
    if (!seoPage || slugOrder.length < 2) {
      setCars([]);
      setLoading(false);
      setError(seoPage && slugOrder.length < 2 ? "insufficient_slugs" : null);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const catalog = await fetchCatalogCarsForCompareSlugs(slugOrder);
        if (cancelled) return;
        const merged = mergeRankedWithCatalogCars(seoPage, catalog);
        setCars(merged);
        if (syncStorage && merged.length >= 2) {
          saveCompareCars(merged);
        }
        if (merged.length < 2) setError("catalog_partial");
      } catch (e) {
        if (cancelled) return;
        const fallback = mergeRankedWithCatalogCars(seoPage, []);
        setCars(fallback);
        if (syncStorage && fallback.length >= 2) {
          saveCompareCars(fallback);
        }
        setError(fallback.length >= 2 ? null : "load_failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [seoPage, slugOrder.join("|"), syncStorage, retryKey]);

  return { cars, loading, error, slugOrder, retry };
}
