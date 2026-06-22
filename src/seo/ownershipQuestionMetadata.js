/**
 * SEO metadata for question-based ownership pages.
 */

import { SITE_ORIGIN } from "../config.js";
import {
  OWNERSHIP_QUESTION_CONFIG,
  formatOwnershipQuestionTitle,
  ownershipQuestionPagePath,
} from "../pages/ownership/ownershipQuestionRoutes.js";
import { buildPageMeta } from "./meta.js";

/**
 * @param {{
 *   vehicleName: string,
 *   vehicleSlug: string,
 *   questionType: import("../pages/ownership/ownershipQuestionRoutes.js").OwnershipQuestionType,
 *   image?: string,
 *   shortAnswer?: string,
 *   siteOrigin?: string,
 * }} params
 */
export function buildOwnershipQuestionMeta({
  vehicleName,
  vehicleSlug,
  questionType,
  image,
  shortAnswer = "",
  siteOrigin = SITE_ORIGIN,
}) {
  const config = OWNERSHIP_QUESTION_CONFIG[questionType];
  const displayName = String(vehicleName || "Electric vehicle").trim();
  const title = formatOwnershipQuestionTitle(
    config?.titleTemplate || "EV ownership question",
    displayName
  );
  const description =
    shortAnswer ||
    `${displayName}: ${config?.breadcrumbLabel || "ownership estimate"} on EVSavari.`;

  return buildPageMeta({
    title,
    description,
    canonical: `${String(siteOrigin).replace(/\/$/, "")}${ownershipQuestionPagePath(vehicleSlug, questionType)}`,
    image,
    ogType: "article",
    keywords: [
      displayName,
      config?.breadcrumbLabel || "ownership",
      "EV running cost",
      "EV ownership cost India",
      "electric car EMI",
    ].join(", "),
    h1: title,
  });
}
