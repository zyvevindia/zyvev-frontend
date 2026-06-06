import { TATA_NEXON_FAMILY_SLUG } from "./tataNexonEvVerified.js";
import { resolveNexonDossierSlug } from "./nexonSlugAliases.js";

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
 * Resolve legacy slugs to verified dossier canonical slugs (family-aware).
 * @param {string} slug
 * @param {string} [familySlug]
 */
export function resolveDossierSlug(slug = "", familySlug = "") {
  const normalized = normalizeVehicleSlug(slug);
  if (!normalized) return "";

  const family = normalizeVehicleSlug(familySlug);
  if (
    family === TATA_NEXON_FAMILY_SLUG ||
    normalized.startsWith(`${TATA_NEXON_FAMILY_SLUG}-`)
  ) {
    return resolveNexonDossierSlug(normalized);
  }

  return normalized;
}
