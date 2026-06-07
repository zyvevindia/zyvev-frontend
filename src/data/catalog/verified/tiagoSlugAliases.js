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
 * Legacy Tiago slugs → verified dossier canonical slugs.
 */
export const TIAGO_DOSSIER_SLUG_ALIASES = Object.freeze({
  "tata-tiago-ev-xt": "tata-tiago-ev-smart-19-mr",
  "tata-tiago-ev-xz-plus": "tata-tiago-ev-creative-plus-24-lr",
  "tata-tiago-ev-smart": "tata-tiago-ev-smart-19-mr",
  "tata-tiago-ev-pure-plus": "tata-tiago-ev-pure-plus-19-mr",
});

export function resolveTiagoDossierSlug(slug = "") {
  const normalized = normalizeVehicleSlug(slug);
  if (!normalized) return "";
  return TIAGO_DOSSIER_SLUG_ALIASES[normalized] || normalized;
}

export function isTiagoLegacySlug(slug = "") {
  const normalized = normalizeVehicleSlug(slug);
  return Boolean(
    normalized && TIAGO_DOSSIER_SLUG_ALIASES[normalized]
  );
}
