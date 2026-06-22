/**
 * JSON-LD for question-based ownership pages.
 */

import { SITE_ORIGIN } from "../config.js";
import { buildOwnershipFaqSchemaItems } from "../ownership/buildOwnershipFaqs.js";
import { buildOwnershipVehicleTopicBreadcrumbs } from "../ownership/ownershipBreadcrumbs.js";
import {
  OWNERSHIP_QUESTION_CONFIG,
  formatOwnershipQuestionTitle,
  ownershipQuestionPagePath,
} from "../pages/ownership/ownershipQuestionRoutes.js";
import { isEditorialReviewAvailable } from "../reviews/reviewRoutes.js";
import { vehicleFamilyPath } from "../utils/vehicleRoutes.js";
import {
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildFaqPageSchema,
  buildVehicleSchema,
} from "./schema.js";

/**
 * @param {{
 *   questionTitle: string,
 *   shortAnswer: string,
 *   canonicalUrl: string,
 * }} params
 * @returns {object|null}
 */
export function buildQaPageSchema({
  questionTitle,
  shortAnswer,
  canonicalUrl,
}) {
  if (!questionTitle || !shortAnswer || !canonicalUrl) return null;

  return {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: questionTitle,
      text: questionTitle,
      answerCount: 1,
      acceptedAnswer: {
        "@type": "Answer",
        text: shortAnswer,
        url: canonicalUrl,
      },
    },
    url: canonicalUrl,
  };
}

/**
 * @param {{
 *   questionType: import("../pages/ownership/ownershipQuestionRoutes.js").OwnershipQuestionType,
 *   vehicleSlug: string,
 *   vehicleName: string,
 *   vehicle?: object|null,
 *   canonicalUrl: string,
 *   image?: string,
 *   shortAnswer?: string,
 *   siteOrigin?: string,
 * }} params
 * @returns {object[]}
 */
export function buildOwnershipQuestionPageSchemas({
  questionType,
  vehicleSlug,
  vehicleName,
  vehicle = null,
  canonicalUrl,
  image,
  shortAnswer = "",
  siteOrigin = SITE_ORIGIN,
}) {
  if (!vehicleSlug || !canonicalUrl || !questionType) return [];

  const config = OWNERSHIP_QUESTION_CONFIG[questionType];
  const pageType = config?.pageType;
  const questionTitle = formatOwnershipQuestionTitle(
    config?.titleTemplate || "",
    vehicleName
  );
  const schemas = [];

  const breadcrumbs = buildOwnershipVehicleTopicBreadcrumbs({
    vehicleName,
    pageLabel: config?.breadcrumbLabel || "Ownership",
    pagePath: ownershipQuestionPagePath(vehicleSlug, questionType),
  });

  schemas.push(buildBreadcrumbSchema(breadcrumbs, siteOrigin));

  const article = buildArticleSchema({
    headline: questionTitle,
    description: shortAnswer || questionTitle,
    url: canonicalUrl,
  });
  if (article) schemas.push(article);

  const vehicleSchema = buildVehicleSchema({
    name: vehicleName,
    brand: vehicle?.brand || vehicle?.catalogMeta?.brand,
    description: shortAnswer || questionTitle,
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

  const qaSchema = buildQaPageSchema({
    questionTitle,
    shortAnswer,
    canonicalUrl,
  });
  if (qaSchema) schemas.push(qaSchema);

  if (pageType) {
    const faqItems = buildOwnershipFaqSchemaItems({
      pageType,
      vehicleSlug,
      vehicleName,
      summaryText: shortAnswer,
      hasReview: isEditorialReviewAvailable(vehicleSlug),
    });
    const faqSchema = buildFaqPageSchema(faqItems, canonicalUrl);
    if (faqSchema) schemas.push(faqSchema);
  }

  return schemas.filter(Boolean);
}

/**
 * @param {string} vehicleSlug
 * @param {import("../pages/ownership/ownershipQuestionRoutes.js").OwnershipQuestionType} questionType
 * @param {string} [siteOrigin]
 * @returns {string}
 */
export function canonicalOwnershipQuestionUrl(
  vehicleSlug,
  questionType,
  siteOrigin = SITE_ORIGIN
) {
  const path = ownershipQuestionPagePath(vehicleSlug, questionType);
  return `${String(siteOrigin).replace(/\/$/, "")}${path}`;
}
