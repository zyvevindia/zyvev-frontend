/**
 * JSON-LD for programmatic ownership pages.
 */

import { SITE_ORIGIN } from "../config.js";
import { buildOwnershipFaqSchemaItems } from "../ownership/buildOwnershipFaqs.js";
import { buildOwnershipVehicleTopicBreadcrumbs } from "../ownership/ownershipBreadcrumbs.js";
import {
  OWNERSHIP_PAGE_CONFIG,
  ownershipPagePath,
} from "../pages/ownership/ownershipRoutes.js";
import { isEditorialReviewAvailable } from "../reviews/reviewRoutes.js";
import { vehicleFamilyPath } from "../utils/vehicleRoutes.js";
import {
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildFaqPageSchema,
  buildVehicleSchema,
} from "./schema.js";

/**
 * @param {string} vehicleSlug
 * @param {import("../pages/ownership/ownershipRoutes.js").OwnershipPageType} pageType
 * @param {string} [siteOrigin]
 * @returns {string}
 */
export function canonicalOwnershipUrl(
  vehicleSlug,
  pageType,
  siteOrigin = SITE_ORIGIN
) {
  const path = ownershipPagePath(vehicleSlug, pageType);
  return `${String(siteOrigin).replace(/\/$/, "")}${path}`;
}

/**
 * @param {{
 *   pageType: import("../pages/ownership/ownershipRoutes.js").OwnershipPageType,
 *   vehicleSlug: string,
 *   vehicleName: string,
 *   vehicle?: object|null,
 *   canonicalUrl: string,
 *   image?: string,
 *   summaryText?: string,
 *   siteOrigin?: string,
 * }} params
 * @returns {object[]}
 */
export function buildOwnershipPageSchemas({
  pageType,
  vehicleSlug,
  vehicleName,
  vehicle = null,
  canonicalUrl,
  image,
  summaryText = "",
  siteOrigin = SITE_ORIGIN,
}) {
  if (!vehicleSlug || !canonicalUrl) return [];

  const config = OWNERSHIP_PAGE_CONFIG[pageType];
  const schemas = [];
  const pageLabel = config?.breadcrumbLabel || "Ownership";

  const breadcrumbs = buildOwnershipVehicleTopicBreadcrumbs({
    vehicleName,
    pageLabel,
    pagePath: ownershipPagePath(vehicleSlug, pageType),
  });

  schemas.push(buildBreadcrumbSchema(breadcrumbs, siteOrigin));

  const headline = `${vehicleName} ${config?.titleSuffix || "Ownership"}`;
  const article = buildArticleSchema({
    headline,
    description: summaryText || config?.subtitle || headline,
    url: canonicalUrl,
  });
  if (article) schemas.push(article);

  const vehicleSchema = buildVehicleSchema({
    name: vehicleName,
    brand: vehicle?.brand || vehicle?.catalogMeta?.brand,
    description: summaryText || config?.subtitle,
    images: image ? [image] : [],
    priceInr: vehicle?.startingPrice || vehicle?.price,
    slug: vehicleSlug,
    siteOrigin,
  });
  if (vehicleSchema) {
    vehicleSchema.mainEntityOfPage = canonicalUrl;
    vehicleSchema.url = `${siteOrigin}${vehicleFamilyPath(vehicleSlug)}`;
    schemas.push(vehicleSchema);
  }

  const faqItems = buildOwnershipFaqSchemaItems({
    pageType,
    vehicleSlug,
    vehicleName,
    summaryText,
    hasReview: isEditorialReviewAvailable(vehicleSlug),
  });
  const faqSchema = buildFaqPageSchema(faqItems, canonicalUrl);
  if (faqSchema) schemas.push(faqSchema);

  return schemas.filter(Boolean);
}

export { buildOwnershipFaqSchemaItems as buildOwnershipFaqItems };
