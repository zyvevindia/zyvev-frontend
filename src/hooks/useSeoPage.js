import { useEffect, useState } from "react";

import { fetchSeoPage } from "../utils/seoPageApi";

import { normalizeSeoSlug } from "../utils/seoRoutes";

import { logProduction } from "../utils/productionLog";

/**
 * @param {string} slug
 */
export default function useSeoPage(slug) {
  const [seoPage, setSeoPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const normalized = normalizeSeoSlug(slug);

    async function load(attempt = 0) {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchSeoPage(normalized);

        if (cancelled) return;

        if (result?.seoPage) {
          setSeoPage(result.seoPage);
        } else {
          setSeoPage(null);
          setError("not_found");
          logProduction(
            "seo_page",
            "load_not_found",
            { slug: normalized },
            "warn"
          );
        }
      } catch (err) {
        if (cancelled) return;

        if (attempt < 1) {
          await new Promise((r) => setTimeout(r, 800));
          return load(attempt + 1);
        }

        setSeoPage(null);
        setError("load_failed");
        logProduction(
          "seo_page",
          "load_failed",
          { slug: normalized, message: err?.message },
          "error"
        );
      }

      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [slug, retryKey]);

  const retry = () => setRetryKey((k) => k + 1);

  return { seoPage, loading, error, retry };
}
