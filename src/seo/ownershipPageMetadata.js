/**
 * Programmatic ownership page SEO metadata.
 */

import { SITE_ORIGIN } from "../config.js";
import { OWNERSHIP_PAGE_CONFIG } from "../pages/ownership/ownershipRoutes.js";
import { buildPageMeta } from "./meta.js";
import { canonicalOwnershipUrl } from "./ownershipSchema.js";

/**
 * @param {{
 *   vehicleName: string,
 *   vehicleSlug: string,
 *   pageType: import("../pages/ownership/ownershipRoutes.js").OwnershipPageType,
 *   image?: string,
 *   siteOrigin?: string,
 * }} params
 */
export function buildOwnershipPageMeta({
  vehicleName,
  vehicleSlug,
  pageType,
  image,
  siteOrigin = SITE_ORIGIN,
}) {
  const config = OWNERSHIP_PAGE_CONFIG[pageType];
  const displayName = String(vehicleName || "Electric vehicle").trim();
  const title = `${displayName} ${config?.titleSuffix || "Ownership"}`;
  const description = `${displayName}: ${config?.subtitle || "EV ownership cost estimates on EVSavari."}`;

  return buildPageMeta({
    title,
    description,
    canonical: canonicalOwnershipUrl(vehicleSlug, pageType, siteOrigin),
    image,
    ogType: "article",
    keywords: [
      displayName,
      config?.titleSuffix || "ownership",
      "EV running cost",
      "EV ownership cost India",
      "electric car EMI",
    ].join(", "),
    h1: title,
  });
}
