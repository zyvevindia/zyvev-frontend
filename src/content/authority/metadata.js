/**
 * Authority content metadata schema — editorial governance only.
 */

export const AUTHORITY_CLUSTER_ID = Object.freeze({
  BEGINNER_EDUCATION: "beginner_education",
  CHARGING_GUIDES: "charging_guides",
  OWNERSHIP_EXPLAINERS: "ownership_explainers",
  EV_MYTHS: "ev_myths",
});

/** Beginner concern ids for depth / compare-support mapping. */
export const AUTHORITY_CONCERN_ID = Object.freeze({
  APARTMENT_CHARGING: "apartment_charging",
  OFFICE_COMMUTE: "office_commute",
  FAMILY_PRACTICALITY: "family_practicality",
  LONG_DISTANCE: "long_distance",
  FIRST_TIME_HESITATION: "first_time_hesitation",
  CHARGING_ANXIETY: "charging_anxiety",
  RANGE_ANXIETY: "range_anxiety",
  BATTERY_ANXIETY: "battery_anxiety",
  RESALE_ANXIETY: "resale_anxiety",
  SAFETY_ANXIETY: "safety_anxiety",
});

export const CONTENT_INTENT = Object.freeze({
  EDUCATE: "educate",
  DECIDE: "decide",
  COMPARE_SUPPORT: "compare_support",
  OWNERSHIP_REALISM: "ownership_realism",
  SAFETY_MYTH_BUST: "safety_myth_bust",
});

export const DIFFICULTY = Object.freeze({
  BEGINNER: "beginner",
  INTERMEDIATE: "intermediate",
  ADVANCED: "advanced",
});

export const OWNERSHIP_STAGE = Object.freeze({
  RESEARCH: "research",
  SHORTLIST: "shortlist",
  PRE_PURCHASE: "pre_purchase",
  OWNERSHIP: "ownership",
});

export const SEO_PRIORITY = Object.freeze({
  P0: "p0",
  P1: "p1",
  P2: "p2",
});

export const COMPARE_SUPPORT_RELEVANCE = Object.freeze({
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  NONE: "none",
});

export const READINESS_STATUS = Object.freeze({
  STRUCTURED: "structured",
  DRAFT_OUTLINE: "draft_outline",
  PUBLISHED: "published",
  NEEDS_REVIEW: "needs_review",
});

/**
 * @typedef {object} AuthorityTopicMeta
 * @property {string} id
 * @property {string} title
 * @property {string} cluster
 * @property {string} intent
 * @property {string} difficulty
 * @property {string} ownershipStage
 * @property {string} seoPriority
 * @property {string} compareSupportRelevance
 * @property {string} [canonicalPath]
 * @property {string} [contentSlug]
 * @property {string} readiness
 * @property {string[]} reviewSections
 * @property {string[]} linkFrom
 * @property {string[]} compareConcerns
 * @property {boolean} [indiaFocused]
 */

export function baseTopicMeta(partial) {
  return {
    indiaFocused: true,
    readiness: READINESS_STATUS.STRUCTURED,
    reviewSections: [],
    linkFrom: ["/compare", "/guides"],
    compareConcerns: [],
    ...partial,
  };
}
