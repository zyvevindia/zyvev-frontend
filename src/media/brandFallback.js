/**
 * Brand-level media fallbacks (same OEM, different family asset).
 */

import { PRODUCTION_FAMILY_MEDIA } from "./familyMediaManifest.js";
import { TIER1_OEM_GROUPS } from "../ops/tier1Families.js";
import { cloudinaryDeliveryUrl } from "./cloudinary.js";
import { normalizeVehicleSlug } from "./slugMapping.js";

export function resolveBrandKeyFromFamily(familySlug = "") {
  const family = normalizeVehicleSlug(familySlug);
  if (!family) return null;

  const group = TIER1_OEM_GROUPS.find((g) =>
    g.families.includes(family)
  );
  if (group) {
    return group.oem.toLowerCase().replace(/\s+/g, "-");
  }

  const prefix = family.split("-")[0];
  return prefix || null;
}

/**
 * Cloudinary brand logo delivery URL (extensionless public_id).
 * @param {string} brandKey e.g. tata, mg, mahindra
 */
export function brandLogoUrl(brandKey) {
  const key = normalizeVehicleSlug(brandKey);
  if (!key) return null;
  return cloudinaryDeliveryUrl(`evsavari/catalog/brands/${key}/logo`);
}

/**
 * Listing/compare/hero URLs from sibling families under the same OEM.
 */
export function brandSiblingMediaUrls(familySlug, role = "listing") {
  const family = normalizeVehicleSlug(familySlug);
  if (!family) return [];

  const group = TIER1_OEM_GROUPS.find((g) => g.families.includes(family));
  if (!group) return [];

  const urls = [];
  for (const sibling of group.families) {
    if (sibling === family) continue;
    const block = PRODUCTION_FAMILY_MEDIA[sibling];
    if (!block) continue;

    if (role === "compare") {
      urls.push(
        block.compareThumbnail,
        block.listingThumbnail,
        block.heroImage
      );
    } else if (role === "hero") {
      urls.push(block.heroImage, block.listingThumbnail);
    } else {
      urls.push(
        block.listingThumbnail,
        block.heroImage,
        block.compareThumbnail
      );
    }
  }
  return urls.filter(Boolean);
}
