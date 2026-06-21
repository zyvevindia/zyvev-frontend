/**
 * Editorial review layer constants — limits and format conventions.
 */

/** @type {import("./types.js").ReviewConfidence} */
export const REVIEW_CONFIDENCE_VERIFIED = "verified";

/** @type {import("./types.js").ReviewConfidence} */
export const REVIEW_CONFIDENCE_EDITORIAL = "editorial";

/** @type {import("./types.js").ReviewConfidence} */
export const REVIEW_CONFIDENCE_ESTIMATED = "estimated";

export const REVIEW_CONFIDENCE = Object.freeze({
  VERIFIED: REVIEW_CONFIDENCE_VERIFIED,
  EDITORIAL: REVIEW_CONFIDENCE_EDITORIAL,
  ESTIMATED: REVIEW_CONFIDENCE_ESTIMATED,
});

export const REVIEW_LIMITS = Object.freeze({
  maxPros: 5,
  maxCons: 5,
});

/** Editorial section bodies are markdown strings ({@link import("./types.js").ReviewSection}). */
export const REVIEW_SECTION_FORMAT = "markdown";
