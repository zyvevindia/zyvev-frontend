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
 * @param {Array<{ id: string }>} [visibleSections]
 * @returns {string | null}
 */
export function detailTabIdForSectionElement(elementId, visibleSections = []) {
  if (!elementId || !visibleSections.length) return null;
  return visibleSections.some((section) => section.id === elementId)
    ? elementId
    : null;
}
