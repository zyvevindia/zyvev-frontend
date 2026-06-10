/**
 * v7.1 — known trim catalogs for high-gap vehicles (golden-aligned names).
 */

export const TRIM_CATALOG = Object.freeze({
  "tata-nexon-ev": [
    "Creative+ MR",
    "Fearless MR",
    "Fearless+ MR",
    "Fearless+ S MR",
    "Empowered MR",
    "Creative 45",
    "Fearless 45",
    "Empowered LR",
    "Empowered+ 45",
    "Empowered+ 45 Red Dark",
    "Empowered+ A 45",
    "Empowered+ A 45 Dark",
    "Empowered+ A 45 Red Dark",
  ],
  "mg-windsor-ev": ["Excite", "Exclusive", "Essence"],
  "hyundai-creta-electric": ["Executive", "Premium", "Signature"],
});

export function trimToSearchRegex(trimName = "") {
  const escaped = String(trimName)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\+/g, "\\+");
  return new RegExp(`\\b${escaped.replace(/\s+/g, "\\s+")}\\b`, "i");
}

export function hasTrimCatalog(familySlug = "") {
  return Boolean(TRIM_CATALOG[familySlug]?.length);
}
