/**
 * Tier-1 families with Cloudinary catalog assets (soft launch).
 */

export const PRODUCTION_FAMILY_SLUGS = [
  "tata-nexon-ev",
  "tata-punch-ev",
  "tata-curvv-ev",
  "mg-comet-ev",
  "mg-zs-ev",
  "mahindra-be-6",
];

export function isProductionFamilySlug(familySlug = "") {
  const key = String(familySlug || "").trim().toLowerCase();
  return Boolean(key && PRODUCTION_FAMILY_SLUGS.includes(key));
}
