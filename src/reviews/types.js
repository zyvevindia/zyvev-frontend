/**
 * Editorial review layer types — separate from catalog facts/specifications.
 *
 * @typedef {'verified' | 'editorial' | 'estimated'} ReviewConfidence
 */

/**
 * Markdown-supported editorial section body.
 *
 * @typedef {Object} ReviewSection
 * @property {string} body - Markdown-supported editorial copy
 */

/**
 * Structured pros and cons lists (catalog-independent opinion).
 *
 * @typedef {Object} ReviewProsCons
 * @property {string[]} pros
 * @property {string[]} cons
 */

/**
 * Closing editorial verdict for a vehicle review.
 *
 * @typedef {Object} ReviewVerdict
 * @property {string} headline
 * @property {string} summary - Markdown-supported editorial copy
 */

/**
 * Sectional editorial content without document identity metadata.
 *
 * @typedef {Object} ReviewContent
 * @property {ReviewSection} overview
 * @property {string[]} pros
 * @property {string[]} cons
 * @property {ReviewSection} cityDriving
 * @property {ReviewSection} highwayDriving
 * @property {ReviewSection} chargingExperience
 * @property {ReviewSection} ownershipCost
 * @property {ReviewSection} familySuitability
 * @property {ReviewSection} serviceExperience
 * @property {ReviewVerdict} finalVerdict
 */

/**
 * Full vehicle review document — editorial opinion and ownership intelligence.
 *
 * @typedef {Object} VehicleReview
 * @property {string} slug - Review document slug (URL key)
 * @property {string} title
 * @property {string} vehicleSlug - Catalog vehicle slug this review covers
 * @property {ReviewSection} overview
 * @property {string[]} pros
 * @property {string[]} cons
 * @property {ReviewSection} cityDriving
 * @property {ReviewSection} highwayDriving
 * @property {ReviewSection} chargingExperience
 * @property {ReviewSection} ownershipCost
 * @property {ReviewSection} familySuitability
 * @property {ReviewSection} serviceExperience
 * @property {ReviewVerdict} finalVerdict
 * @property {ReviewConfidence} confidence
 */

export {};
