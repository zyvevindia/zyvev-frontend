import { useCallback, useEffect, useState } from "react";

import { loadDiscoveryPage } from "../seo/discoveryLoader";

/**
 * @param {import('../seo/registry').DiscoveryRouteContext | null} routeContext
 */
export default function useDiscoveryPage(routeContext) {
  const [seoPage, setSeoPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  const retry = useCallback(() => {
    setRetryKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!routeContext?.contentSlug) {
      setSeoPage(null);
      setLoading(false);
      setError("invalid_route");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    loadDiscoveryPage(routeContext).then((result) => {
      if (cancelled) return;

      if (result?.seoPage) {
        setSeoPage(result.seoPage);
        setError(null);
      } else {
        setSeoPage(null);
        setError("not_found");
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [
    routeContext?.contentSlug,
    routeContext?.canonicalUrl,
    routeContext?.pageType,
    retryKey,
  ]);

  return {
    seoPage,
    routeContext,
    loading,
    error,
    retry,
  };
}
