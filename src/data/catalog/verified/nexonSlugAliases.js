function normalizeVehicleSlug(slug) {
  if (slug == null || slug === "") return "";
  return String(slug)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Legacy Nexon slugs → verified dossier canonical slugs.
 * Keeps SEO / compare / bookmark URLs resolving to dossier trims.
 */
export const NEXON_DOSSIER_SLUG_ALIASES = Object.freeze({
  "tata-nexon-ev-creative-plus": "tata-nexon-ev-creative-plus-mr",
  "tata-nexon-ev-long-range": "tata-nexon-ev-empowered-lr",
  "tata-nexon-ev-lr": "tata-nexon-ev-empowered-lr",
});

export function resolveNexonDossierSlug(slug = "") {
  const normalized = normalizeVehicleSlug(slug);
  if (!normalized) return "";
  return NEXON_DOSSIER_SLUG_ALIASES[normalized] || normalized;
}

export function isNexonLegacySlug(slug = "") {
  const normalized = normalizeVehicleSlug(slug);
  return Boolean(
    normalized && NEXON_DOSSIER_SLUG_ALIASES[normalized]
  );
}
