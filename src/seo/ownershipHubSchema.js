/**
 * JSON-LD for ownership hub and vehicle ownership index pages.
 */

import { SITE_ORIGIN } from "../config.js";
import {
  buildOwnershipHubBreadcrumbs,
  buildOwnershipVehicleIndexBreadcrumbs,
} from "../ownership/ownershipBreadcrumbs.js";
import {
  OWNERSHIP_HUB_PATH,
  OWNERSHIP_HUB_SECTIONS,
  OWNERSHIP_VEHICLE_INDEX_PATH,
} from "../pages/ownership/ownershipHubConstants.js";
import { vehicleFamilyPath } from "../utils/vehicleRoutes.js";
import { buildBreadcrumbSchema } from "./schema.js";

/**
 * @param {{
 *   name: string,
 *   description: string,
 *   url: string,
 *   siteOrigin?: string,
 * }} params
 * @returns {object|null}
 */
export function buildCollectionPageSchema({
  name,
  description,
  url,
  siteOrigin = SITE_ORIGIN,
}) {
  if (!name || !url) return null;

  const absoluteUrl = url.startsWith("http")
    ? url
    : `${String(siteOrigin).replace(/\/$/, "")}${url}`;

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description: description || name,
    url: absoluteUrl,
    isPartOf: {
      "@type": "WebSite",
      name: "EVSavari",
      url: String(siteOrigin).replace(/\/$/, ""),
    },
  };
}

/**
 * @param {Array<{ name: string, url: string }>} items
 * @param {string} pageUrl
 * @param {string} listName
 * @param {string} [siteOrigin]
 * @returns {object|null}
 */
export function buildOwnershipItemListSchema(
  items,
  pageUrl,
  listName,
  siteOrigin = SITE_ORIGIN
) {
  if (!items?.length || !pageUrl) return null;

  const origin = String(siteOrigin).replace(/\/$/, "");
  const absolutePageUrl = pageUrl.startsWith("http")
    ? pageUrl
    : `${origin}${pageUrl}`;

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    url: absolutePageUrl,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Vehicle",
        name: item.name,
        url: item.url.startsWith("http") ? item.url : `${origin}${item.url}`,
      },
    })),
  };
}

/**
 * @param {string} [siteOrigin]
 * @returns {object[]}
 */
export function buildOwnershipHubSchemas(siteOrigin = SITE_ORIGIN) {
  const origin = String(siteOrigin).replace(/\/$/, "");
  const canonicalUrl = `${origin}${OWNERSHIP_HUB_PATH}`;
  const metaDescription =
    "Understand running costs, ownership costs, petrol savings, and EMI before buying an electric car in India.";

  const schemas = [
    buildBreadcrumbSchema(buildOwnershipHubBreadcrumbs(), siteOrigin),
    buildCollectionPageSchema({
      name: "EV Ownership Guides and Calculators",
      description: metaDescription,
      url: OWNERSHIP_HUB_PATH,
      siteOrigin,
    }),
    buildOwnershipItemListSchema(
      OWNERSHIP_HUB_SECTIONS.map((section) => ({
        name: section.title,
        url: section.exampleLinks[0]?.href || section.toolPath,
      })),
      OWNERSHIP_HUB_PATH,
      "EV ownership calculator topics",
      siteOrigin
    ),
  ];

  return schemas.filter(Boolean);
}

/**
 * @param {Array<{ familySlug: string, familyName: string, brand?: string, startingPrice?: number, image?: string }>} families
 * @param {string} [siteOrigin]
 * @returns {object[]}
 */
export function buildOwnershipVehicleIndexSchemas(
  families = [],
  siteOrigin = SITE_ORIGIN
) {
  const metaDescription =
    "Browse running cost, ownership cost, petrol savings, and EMI estimates for every major EV model family on EVSavari.";

  const schemas = [
    buildBreadcrumbSchema(buildOwnershipVehicleIndexBreadcrumbs(), siteOrigin),
    buildCollectionPageSchema({
      name: "Electric Vehicle Ownership Cost Guides",
      description: metaDescription,
      url: OWNERSHIP_VEHICLE_INDEX_PATH,
      siteOrigin,
    }),
    buildOwnershipItemListSchema(
      families.map((family) => ({
        name: family.familyName || family.familySlug,
        url: vehicleFamilyPath(family.familySlug),
      })),
      OWNERSHIP_VEHICLE_INDEX_PATH,
      "Electric vehicle ownership guides",
      siteOrigin
    ),
  ];

  return schemas.filter(Boolean);
}
