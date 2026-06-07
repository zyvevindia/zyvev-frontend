import { TATA_NEXON_FAMILY_SLUG } from "./tataNexonEvVerified.js";
import { TATA_PUNCH_FAMILY_SLUG } from "./tataPunchEvVerified.js";
import { TATA_TIAGO_FAMILY_SLUG } from "./tataTiagoEvVerified.js";
import { resolveNexonDossierSlug } from "./nexonSlugAliases.js";
import { resolvePunchDossierSlug } from "./punchSlugAliases.js";
import { resolveTiagoDossierSlug } from "./tiagoSlugAliases.js";

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

  if (
    family === TATA_PUNCH_FAMILY_SLUG ||
    normalized.startsWith(`${TATA_PUNCH_FAMILY_SLUG}-`)
  ) {
    return resolvePunchDossierSlug(normalized);
  }

  if (
    family === TATA_TIAGO_FAMILY_SLUG ||
    normalized.startsWith(`${TATA_TIAGO_FAMILY_SLUG}-`)
  ) {
    return resolveTiagoDossierSlug(normalized);
  }

  return normalized;
}
