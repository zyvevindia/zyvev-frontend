/**
 * JSON-LD for editorial vehicle review pages.
 */

import { SITE_ORIGIN } from "../config.js";
import {
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildVehicleSchema,
} from "./schema.js";
import { vehicleFamilyPath } from "../utils/vehicleRoutes.js";

/**
 * @param {{
 *   review: import("../reviews/types.js").VehicleReview,
 *   vehicle?: object|null,
 *   canonicalUrl: string,
 *   image?: string,
 *   siteOrigin?: string,
 * }} params
 * @returns {object[]}
 */
export function buildReviewPageSchemas({
  review,
  vehicle = null,
  canonicalUrl,
  image,
  siteOrigin = SITE_ORIGIN,
}) {
  if (!review || !canonicalUrl) return [];

  const schemas = [];
  const vehicleName =
    vehicle?.name ||
    vehicle?.displayName ||
    review.title.replace(/ Review$/, "");

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Electric Cars", url: "/cars" },
    { name: review.title, url: canonicalUrl },
  ];

  schemas.push(buildBreadcrumbSchema(breadcrumbs, siteOrigin));

  const article = buildArticleSchema({
    headline: review.title,
    description: review.overview?.body || review.title,
    url: canonicalUrl,
  });
  if (article) schemas.push(article);

  const vehicleSchema = buildVehicleSchema({
    name: vehicleName,
    brand: vehicle?.brand || vehicle?.catalogMeta?.brand,
    description: review.overview?.body,
    images: image ? [image] : [],
    priceInr: vehicle?.startingPrice || vehicle?.price,
    slug: review.vehicleSlug,
    siteOrigin,
  });
  if (vehicleSchema) schemas.push(vehicleSchema);

  if (review.vehicleSlug && vehicleSchema) {
    vehicleSchema.mainEntityOfPage = canonicalUrl;
    vehicleSchema.url = `${siteOrigin}${vehicleFamilyPath(review.vehicleSlug)}`;
  }

  return schemas.filter(Boolean);
}
