/**
 * AUTO-GENERATED — factual catalog metadata for SEO (no editorial copy).
 * Regenerate: npm run catalog:generate-seo
 */

import catalogBundle from "./catalog-vehicles.json";

export const GENERATED_SEO_CATALOG_AT = catalogBundle.generatedAt;

const GENERATED_SEO_CATALOG = Object.freeze(
  Object.fromEntries(
    (catalogBundle.vehicles || []).map((meta) => [meta.familySlug, meta])
  )
);

function normalizeSlug(slug = "") {
  return String(slug || "").trim().toLowerCase();
}

export function hasGeneratedSeoCatalogMeta(slug = "") {
  const key = normalizeSlug(slug);
  return Boolean(key && GENERATED_SEO_CATALOG[key]);
}

export function loadGeneratedSeoCatalogMeta(slug = "") {
  const key = normalizeSlug(slug);
  return GENERATED_SEO_CATALOG[key] || null;
}

export function listGeneratedSeoCatalogMetaSlugs() {
  return Object.keys(GENERATED_SEO_CATALOG).sort();
}

export { GENERATED_SEO_CATALOG, catalogBundle };
