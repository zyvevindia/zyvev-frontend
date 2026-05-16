/**
 * Lightweight route drift logging (dev + optional prod console).
 */

const PREFIX = "[EVSavari routes]";

export function logRouteRedirect(from, to, slug) {
  if (import.meta.env.DEV) {
    console.info(PREFIX, "redirect", { from, to, slug });
  }
}

export function logSlugLookupFailure(rawSlug, candidates) {
  console.warn(PREFIX, "detail_lookup_failed", {
    rawSlug,
    candidates,
    at: new Date().toISOString(),
  });
}

export function logSlugResolved(rawSlug, resolvedSlug) {
  if (
    import.meta.env.DEV &&
    rawSlug &&
    resolvedSlug &&
    rawSlug !== resolvedSlug
  ) {
    console.info(PREFIX, "slug_resolved", {
      rawSlug,
      resolvedSlug,
    });
  }
}
