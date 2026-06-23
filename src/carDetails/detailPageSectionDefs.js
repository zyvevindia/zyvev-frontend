/**
 * Detail page section registry metadata — Node-safe (no JSX / React imports).
 * Components are attached in detailPageRegistry.js.
 */

/**
 * @typedef {object} DetailPageSectionContext
 * @property {boolean} hasEvIntelligence
 * @property {boolean} hasVariants
 * @property {boolean} hasOwnershipTools
 * @property {boolean} hasCompare
 * @property {boolean} hasPeopleAlsoCompare
 * @property {boolean} hasSimilarEvs
 * @property {boolean} hasPopularAmongSimilarBuyers
 * @property {boolean} hasRange
 * @property {boolean} hasOwnership
 * @property {boolean} hasCharging
 * @property {boolean} hasDedicatedChargingSection
 * @property {boolean} hasSuitability
 * @property {boolean} hasEmi
 * @property {boolean} hasFaqs
 * @property {boolean} hasReviews
 * @property {boolean} hasRelatedEvs
 * @property {boolean} hasAssistance
 */

/** Sticky nav CTA — appended after registry-driven section tabs. */
export const DETAIL_NAV_CTA_TAB = {
  id: "book-test-drive",
  title: "Book Test Drive",
  action: "test-drive",
  cta: true,
};

/**
 * Schema-driven section registry — single source of truth for sections and nav.
 * @type {Array<{
 *   id: string,
 *   title: string,
 *   nav?: boolean,
 *   navOrder?: number,
 *   navTitle?: string,
 *   shellClassName?: string,
 *   placement?: "hero" | "page",
 *   renderOnPage?: boolean,
 *   condition: (ctx: DetailPageSectionContext) => boolean,
 * }>}
 */
export const DETAIL_SECTION_DEFS = [
  {
    id: "ev-intelligence",
    title: "EV Intelligence",
    nav: true,
    navOrder: 10,
    placement: "page",
    shellClassName:
      "cd-section cd-card cd-content-card cd-ev-intelligence-section",
    condition: (ctx) => ctx.hasEvIntelligence,
  },
  {
    id: "variants",
    title: "Variants",
    nav: true,
    navOrder: 20,
    placement: "page",
    shellClassName:
      "cd-section cd-card cd-content-card variant-comparison",
    condition: (ctx) => ctx.hasVariants,
  },
  {
    id: "ownership-tools",
    title: "Ownership Tools",
    nav: false,
    placement: "page",
    shellClassName: "cd-section cd-card cd-content-card",
    condition: (ctx) => ctx.hasOwnershipTools,
  },
  {
    id: "compare",
    title: "Compare",
    renderOnPage: false,
    placement: "page",
    shellClassName: "cd-section cd-card cd-content-card",
    condition: (ctx) => ctx.hasCompare,
  },
  {
    id: "charging",
    title: "Charging",
    nav: true,
    navOrder: 30,
    placement: "page",
    shellClassName: "cd-section cd-card cd-content-card ev-intel-section",
    condition: (ctx) => ctx.hasDedicatedChargingSection,
  },
  {
    id: "people-also-compare",
    title: "People Also Compare",
    nav: true,
    navOrder: 40,
    placement: "page",
    shellClassName: "cd-section cd-card cd-content-card",
    condition: (ctx) => ctx.hasPeopleAlsoCompare,
  },
  {
    id: "similar-evs",
    title: "Similar EVs",
    nav: true,
    navOrder: 50,
    placement: "page",
    shellClassName: "cd-section cd-card cd-content-card",
    condition: (ctx) => ctx.hasSimilarEvs,
  },
  {
    id: "popular-among-similar-buyers",
    title: "Popular Among Similar Buyers",
    nav: true,
    navOrder: 60,
    navTitle: "Popular Buyers",
    placement: "page",
    shellClassName: "cd-section cd-card cd-content-card",
    condition: (ctx) => ctx.hasPopularAmongSimilarBuyers,
  },
  {
    id: "range",
    title: "Range",
    renderOnPage: false,
    placement: "page",
    shellClassName: "cd-section cd-card cd-content-card ev-intel-section",
    condition: (ctx) => ctx.hasRange,
  },
  {
    id: "suitability",
    title: "Suitability",
    renderOnPage: false,
    placement: "page",
    shellClassName: "cd-section cd-card cd-content-card ev-intel-section",
    condition: (ctx) => ctx.hasSuitability,
  },
  {
    id: "emi",
    title: "EMI",
    renderOnPage: false,
    placement: "page",
    shellClassName: "cd-section cd-card cd-content-card detail-emi-section",
    condition: (ctx) => ctx.hasEmi,
  },
  {
    id: "reviews",
    title: "Reviews",
    nav: true,
    navOrder: 70,
    placement: "page",
    shellClassName: "cd-section cd-card cd-content-card",
    condition: (ctx) => ctx.hasReviews,
  },
  {
    id: "faqs",
    title: "FAQs",
    nav: true,
    navOrder: 80,
    placement: "page",
    shellClassName: "cd-section cd-card cd-content-card",
    condition: (ctx) => ctx.hasFaqs,
  },
  {
    id: "related-evs",
    title: "Related EVs",
    renderOnPage: false,
    placement: "page",
    shellClassName: "cd-seo-discovery",
    condition: (ctx) => ctx.hasRelatedEvs,
  },
  {
    id: "assistance",
    title: "Assistance",
    renderOnPage: false,
    placement: "page",
    shellClassName: "cd-section cd-dealer cd-card",
    condition: (ctx) => ctx.hasAssistance,
  },
];
