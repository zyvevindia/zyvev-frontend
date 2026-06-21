/**
 * JSON-LD for programmatic ownership pages.
 */

import { SITE_ORIGIN } from "../config.js";
import {
  OWNERSHIP_PAGE_CONFIG,
  ownershipPagePath,
} from "../pages/ownership/ownershipRoutes.js";
import { buildReviewSlug, reviewPagePath } from "../reviews/reviewRoutes.js";
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

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Ownership", url: "/tools" },
    { name: vehicleName, url: vehicleFamilyPath(vehicleSlug) },
    { name: pageLabel, url: ownershipPagePath(vehicleSlug, pageType) },
  ];

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

  const faqItems = buildOwnershipFaqItems({
    pageType,
    vehicleName,
    summaryText,
    vehicleSlug,
  });
  const faqSchema = buildFaqPageSchema(faqItems, canonicalUrl);
  if (faqSchema) schemas.push(faqSchema);

  return schemas.filter(Boolean);
}

/**
 * @param {{
 *   pageType: import("../pages/ownership/ownershipRoutes.js").OwnershipPageType,
 *   vehicleName: string,
 *   summaryText?: string,
 *   vehicleSlug: string,
 * }} params
 * @returns {Array<{ question: string, answer: string }>}
 */
function buildOwnershipFaqItems({
  pageType,
  vehicleName,
  summaryText = "",
  vehicleSlug,
}) {
  const config = OWNERSHIP_PAGE_CONFIG[pageType];
  const reviewPath = reviewPagePath(buildReviewSlug(vehicleSlug));
  const vehiclePath = vehicleFamilyPath(vehicleSlug);

  const items = [
    {
      question: `How is ${vehicleName} ${config?.titleSuffix.toLowerCase() || "ownership cost"} calculated?`,
      answer:
        summaryText ||
        `EVSavari uses the same ownership calculators as our tools hub, prefilled for ${vehicleName}, with editable assumptions for charging, usage, and finance.`,
    },
    {
      question: `Where can I compare ${vehicleName} with other EVs?`,
      answer: `Visit the ${vehicleName} vehicle page at ${vehiclePath} or read our editorial review for broader ownership context.`,
    },
    {
      question: `Can I adjust assumptions on this page?`,
      answer:
        "Yes. Use the calculator inputs to change tariff, annual driving, loan terms, or petrol comparison assumptions. Results update instantly.",
    },
  ];

  if (pageType === "petrol-savings") {
    items.push({
      question: `Does ${vehicleName} save money versus petrol?`,
      answer:
        summaryText ||
        "Savings depend on your annual driving, fuel price, and charging mix. Adjust the inputs to match your ownership pattern.",
    });
  }

  if (pageType === "emi") {
    items.push({
      question: `What EMI assumptions are used for ${vehicleName}?`,
      answer:
        summaryText ||
        "Default assumptions include a 20% down payment, 9% interest, and a 5-year loan unless you change them in the calculator.",
    });
  }

  return items.slice(0, 4);
}

export { buildOwnershipFaqItems };
