import { TIER1_MODEL_FAMILY_SLUGS } from "../../data/tier1ModelFamilies.js";
import { normalizeVehicleSlug } from "../../utils/vehicleRoutes.js";
import { OWNERSHIP_PAGE_TYPES } from "./ownershipRoutes.js";

/** @typedef {"how-much-does-it-cost-to-run"|"ownership-cost"|"how-much-can-you-save"|"emi-calculator"} OwnershipQuestionType */

export const OWNERSHIP_QUESTION_TYPES = Object.freeze({
  HOW_MUCH_TO_RUN: "how-much-does-it-cost-to-run",
  OWNERSHIP_COST: "ownership-cost",
  HOW_MUCH_SAVE: "how-much-can-you-save",
  EMI_CALCULATOR: "emi-calculator",
});

/** @type {OwnershipQuestionType[]} */
export const OWNERSHIP_QUESTION_TYPE_LIST = Object.freeze([
  OWNERSHIP_QUESTION_TYPES.HOW_MUCH_TO_RUN,
  OWNERSHIP_QUESTION_TYPES.OWNERSHIP_COST,
  OWNERSHIP_QUESTION_TYPES.HOW_MUCH_SAVE,
  OWNERSHIP_QUESTION_TYPES.EMI_CALCULATOR,
]);

/** @type {Record<OwnershipQuestionType, { pathSegment: string, pageType: import("./ownershipRoutes.js").OwnershipPageType, titleTemplate: string, breadcrumbLabel: string, quickAnswerLabel: string, navLabel: string }>} */
export const OWNERSHIP_QUESTION_CONFIG = Object.freeze({
  [OWNERSHIP_QUESTION_TYPES.HOW_MUCH_TO_RUN]: {
    pathSegment: "how-much-does-it-cost-to-run",
    pageType: OWNERSHIP_PAGE_TYPES.RUNNING_COST,
    titleTemplate: "How much does {vehicle} cost to run?",
    breadcrumbLabel: "Running cost",
    quickAnswerLabel: "Running cost",
    navLabel: "Running cost",
  },
  [OWNERSHIP_QUESTION_TYPES.OWNERSHIP_COST]: {
    pathSegment: "ownership-cost",
    pageType: OWNERSHIP_PAGE_TYPES.TCO,
    titleTemplate: "What is {vehicle} ownership cost?",
    breadcrumbLabel: "Ownership cost",
    quickAnswerLabel: "Ownership cost",
    navLabel: "Ownership cost",
  },
  [OWNERSHIP_QUESTION_TYPES.HOW_MUCH_SAVE]: {
    pathSegment: "how-much-can-you-save",
    pageType: OWNERSHIP_PAGE_TYPES.PETROL_SAVINGS,
    titleTemplate: "How much can {vehicle} save compared with petrol?",
    breadcrumbLabel: "Petrol savings",
    quickAnswerLabel: "Savings",
    navLabel: "Petrol savings",
  },
  [OWNERSHIP_QUESTION_TYPES.EMI_CALCULATOR]: {
    pathSegment: "emi-calculator",
    pageType: OWNERSHIP_PAGE_TYPES.EMI,
    titleTemplate: "What is the {vehicle} EMI?",
    breadcrumbLabel: "EMI calculator",
    quickAnswerLabel: "EMI",
    navLabel: "EMI",
  },
});

/**
 * @param {string} template
 * @param {string} vehicleName
 * @returns {string}
 */
export function formatOwnershipQuestionTitle(template, vehicleName) {
  const name = vehicleName || "this EV";
  return String(template).replace(/\{vehicle\}/g, name);
}

/**
 * @param {string} vehicleSlug
 * @param {OwnershipQuestionType} questionType
 * @returns {string}
 */
export function ownershipQuestionPagePath(vehicleSlug, questionType) {
  const slug = normalizeVehicleSlug(vehicleSlug);
  const config = OWNERSHIP_QUESTION_CONFIG[questionType];
  if (!slug || !config) return "/ownership";
  return `/ownership/${slug}/${config.pathSegment}`;
}

/**
 * @param {OwnershipQuestionType} questionType
 * @returns {import("./ownershipRoutes.js").OwnershipPageType}
 */
export function resolveOwnershipPageTypeFromQuestion(questionType) {
  return OWNERSHIP_QUESTION_CONFIG[questionType]?.pageType || null;
}

/**
 * @param {string} vehicleSlug
 * @returns {boolean}
 */
export function isOwnershipQuestionPageSlug(vehicleSlug) {
  const slug = normalizeVehicleSlug(vehicleSlug);
  return Boolean(slug && TIER1_MODEL_FAMILY_SLUGS.includes(slug));
}

/**
 * @param {string} vehicleSlug
 * @param {OwnershipQuestionType|null} [excludeType]
 * @returns {Array<{ type: OwnershipQuestionType, href: string, label: string }>}
 */
export function buildOwnershipQuestionNavLinks(
  vehicleSlug,
  excludeType = null
) {
  const slug = normalizeVehicleSlug(vehicleSlug);
  if (!slug) return [];

  return OWNERSHIP_QUESTION_TYPE_LIST.filter((type) => type !== excludeType).map(
    (type) => ({
      type,
      href: ownershipQuestionPagePath(slug, type),
      label: `${OWNERSHIP_QUESTION_CONFIG[type].navLabel} →`,
    })
  );
}
