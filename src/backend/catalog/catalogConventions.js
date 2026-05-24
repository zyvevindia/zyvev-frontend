/**
 * Tier-1 catalog normalization conventions — Day 3 operations.
 */

export const CATALOG_CONVENTIONS = Object.freeze({
  slugPattern: /^[a-z0-9]+(-[a-z0-9]+)*$/,
  variantSlugPattern: /^[a-z0-9]+(-[a-z0-9]+)*$/,
  cloudinaryPublicIdPrefix: "evsavari/catalog/families",
  mediaRoles: [
    "hero",
    "listing-thumb",
    "compare-thumb",
    "og",
    "exterior",
    "interior",
    "charging-port",
  ],
  comparePairSlugPattern: /^[a-z0-9-]+-vs-[a-z0-9-]+$/,
  onboardingSequence: [
    "tata-nexon-ev",
    "tata-punch-ev",
    "tata-tiago-ev",
    "tata-curvv-ev",
    "mg-comet-ev",
    "mg-zs-ev",
    "mahindra-be-6",
    "mahindra-xev-9e",
    "mahindra-xuv400",
    "byd-atto-3",
    "hyundai-kona-electric",
  ],
  qualityGates: [
    "compare-ready",
    "media-ready",
    "seo-ready",
    "ownership-ready",
    "trust-ready",
  ],
});

/** Day 3 operational compare pairs — family slugs for persistence validation */
export const DAY3_COMPARE_PAIRS = Object.freeze([
  {
    label: "Nexon EV vs Punch EV",
    compareSlug: "tata-punch-ev-vs-tata-nexon-ev",
    families: ["tata-nexon-ev", "tata-punch-ev"],
  },
  {
    label: "Nexon EV vs Curvv EV",
    compareSlug: "tata-nexon-ev-vs-tata-curvv-ev",
    families: ["tata-nexon-ev", "tata-curvv-ev"],
  },
  {
    label: "MG Comet vs Tiago EV",
    compareSlug: "comet-ev-vs-tiago-ev",
    families: ["mg-comet-ev", "tata-tiago-ev"],
  },
  {
    label: "BE 6 vs XEV 9e",
    compareSlug: "mahindra-xev-9e-vs-mahindra-be-6",
    families: ["mahindra-be-6", "mahindra-xev-9e"],
  },
]);

export function cloudinaryPublicId(familySlug, role) {
  return `${CATALOG_CONVENTIONS.cloudinaryPublicIdPrefix}/${familySlug}/${role}`;
}

export function cloudinaryUrl(familySlug, role, cloudName = "dznvmumze") {
  const publicId = cloudinaryPublicId(familySlug, role);
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,c_limit/${publicId}`;
}

export function comparePairSlug(familyA, familyB) {
  const [a, b] = [familyA, familyB].sort();
  return `${a}-vs-${b}`;
}

export function validateFamilySlug(slug) {
  return CATALOG_CONVENTIONS.slugPattern.test(String(slug || ""));
}
