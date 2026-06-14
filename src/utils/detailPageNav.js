/**
 * Vehicle detail page — scroll offsets and navigation helpers.
 * Section registry lives in carDetails/detailPageRegistry.js.
 */

export {
  DETAIL_SECTION_DEFS,
  buildDetailPageSectionContext,
  buildDetailPageSections,
  buildVisibleDetailSections,
} from "../carDetails/detailPageRegistry.js";

import { DETAIL_SECTION_DEFS } from "../carDetails/detailPageRegistry.js";

/** Sticky site header + detail tab bar (px) */
export const DETAIL_SCROLL_OFFSET_PX = 148;

/** Decision-centric sticky nav — order and scroll targets. */
export const DETAIL_NAV_TAB_DEFS = [
  {
    id: "overview",
    title: "Overview",
    scrollTarget: "overview",
    visible: (ctx) => ctx.hasOverview,
  },
  {
    id: "variants",
    title: "Variants",
    scrollTarget: "variants",
    visible: (ctx) => ctx.hasVariants,
  },
  {
    id: "ownership",
    title: "Ownership",
    scrollTarget: "ev-intelligence",
    visible: (ctx) => ctx.hasOwnership,
  },
  {
    id: "charging",
    title: "Charging",
    scrollTarget: "charging",
    visible: (ctx) => ctx.hasCharging,
  },
  {
    id: "compare",
    title: "Compare",
    scrollTarget: "compare",
    visible: (ctx) => ctx.hasCompare,
  },
  {
    id: "reviews",
    title: "Reviews",
    scrollTarget: "reviews",
    visible: (ctx) => ctx.hasReviews,
  },
];

export const DETAIL_NAV_CTA_TAB = {
  id: "book-test-drive",
  title: "Book Test Drive",
  action: "test-drive",
  cta: true,
};

/**
 * @param {import("../carDetails/detailPageRegistry.js").DetailPageSectionContext} context
 * @returns {Array<{ id: string, title: string, scrollTarget?: string, action?: string, cta?: boolean }>}
 */
export function buildVisibleDetailNavTabs(context) {
  const sectionTabs = DETAIL_NAV_TAB_DEFS.filter((def) =>
    def.visible(context)
  ).map(({ id, title, scrollTarget }) => ({
    id,
    title,
    scrollTarget,
  }));

  return [...sectionTabs, { ...DETAIL_NAV_CTA_TAB }];
}

/**
 * @param {Array<{ scrollTarget?: string }>} navTabs
 * @returns {string[]}
 */
export function getDetailNavObserveIds(navTabs = []) {
  return navTabs
    .map((tab) => tab.scrollTarget)
    .filter((id) => typeof id === "string" && id.length > 0);
}

/** @deprecated Use buildVisibleDetailSections() for runtime tabs. */
export const DETAIL_NAV_TABS = DETAIL_SECTION_DEFS.map(({ id, title }) => ({
  id,
  label: title,
  title,
}));

/** @deprecated Use getDetailObservedSectionIds(visibleSections). */
export const DETAIL_OBSERVED_SECTION_IDS = DETAIL_SECTION_DEFS.map(
  (def) => def.id
);

/**
 * @param {Array<{ id: string }>} visibleSections
 * @returns {string[]}
 */
export function getDetailObservedSectionIds(visibleSections = []) {
  return visibleSections.map((section) => section.id);
}

/**
 * @param {string} sectionId
 * @returns {HTMLElement | null}
 */
export function resolveDetailSectionElement(sectionId) {
  return document.getElementById(sectionId);
}

/**
 * Smooth scroll with sticky header offset.
 * @param {string} sectionId
 * @returns {boolean} whether a target was found
 */
export function scrollToDetailSection(sectionId) {
  const el = resolveDetailSectionElement(sectionId);
  if (!el) return false;

  const top =
    el.getBoundingClientRect().top +
    window.scrollY -
    DETAIL_SCROLL_OFFSET_PX;

  window.scrollTo({
    top: Math.max(0, top),
    behavior: "smooth",
  });

  return true;
}

/**
 * Map a DOM section id to the sticky tab id that should highlight.
 * @param {string} elementId
 * @param {Array<{ id: string, scrollTarget?: string }>} [navTabs]
 * @returns {string | null}
 */
export function detailTabIdForSectionElement(elementId, navTabs = []) {
  if (!elementId || !navTabs.length) return null;

  const direct = navTabs.find((tab) => tab.scrollTarget === elementId);
  if (direct) return direct.id;

  return navTabs.some((tab) => tab.id === elementId) ? elementId : null;
}
