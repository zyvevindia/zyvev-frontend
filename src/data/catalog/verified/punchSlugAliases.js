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
 * Legacy Punch slugs → verified dossier canonical slugs.
 * Keeps SEO / compare / bookmark URLs resolving to dossier trims.
 */
export const PUNCH_DOSSIER_SLUG_ALIASES = Object.freeze({
  "tata-punch-ev-smart-plus": "tata-punch-ev-smart-plus-40-kwh",
  "tata-punch-ev-empowered-lr": "tata-punch-ev-empowered-plus",
});

export function resolvePunchDossierSlug(slug = "") {
  const normalized = normalizeVehicleSlug(slug);
  if (!normalized) return "";
  return PUNCH_DOSSIER_SLUG_ALIASES[normalized] || normalized;
}

export function isPunchLegacySlug(slug = "") {
  const normalized = normalizeVehicleSlug(slug);
  return Boolean(
    normalized && PUNCH_DOSSIER_SLUG_ALIASES[normalized]
  );
}
