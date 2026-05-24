/**
 * Vehicle detail page — sticky nav targets, scroll offsets, section resolution.
 */

/** Sticky site header + detail tab bar (px) */
export const DETAIL_SCROLL_OFFSET_PX = 148;

export const DETAIL_NAV_TABS = [
  { id: "overview", label: "Overview" },
  { id: "variants", label: "Variants" },
  { id: "compare", label: "Compare" },
  { id: "range", label: "Range" },
  { id: "charging", label: "Charging" },
  { id: "features", label: "Features" },
  { id: "suitability", label: "Suitability" },
  { id: "emi", label: "EMI" },
  { id: "faqs", label: "FAQs" },
  { id: "reviews", label: "Reviews" },
  { id: "related-evs", label: "Related EVs" },
  { id: "assistance", label: "Assistance" },
];

/** Primary DOM id per tab, then legacy / alternate anchors */
const SECTION_RESOLVE_ORDER = {
  overview: ["overview", "detail-overview"],
  variants: ["variants", "detail-variants"],
  compare: ["compare", "detail-compare"],
  range: ["range", "detail-range-confidence"],
  charging: [
    "charging",
    "detail-charging-intelligence",
    "detail-charging",
    "charging-practicality",
  ],
  features: ["features", "detail-features-intelligence"],
  suitability: ["suitability", "detail-suitability"],
  emi: ["emi", "detail-emi-calculator"],
  faqs: ["faqs", "detail-faqs"],
  reviews: ["reviews", "detail-reviews"],
  "related-evs": ["related-evs", "cd-seo-discovery"],
  assistance: ["assistance", "detail-dealer-assistance"],
};

/** All element ids observed for scroll-spy (multiple per tab allowed) */
export const DETAIL_OBSERVED_SECTION_IDS = [
  "overview",
  "variants",
  "compare",
  "range",
  "charging",
  "charging-practicality",
  "features",
  "suitability",
  "emi",
  "faqs",
  "reviews",
  "related-evs",
  "assistance",
];

/**
 * @param {string} sectionId
 * @returns {HTMLElement | null}
 */
export function resolveDetailSectionElement(sectionId) {
  const keys = SECTION_RESOLVE_ORDER[sectionId] || [sectionId];
  for (const key of keys) {
    const el = document.getElementById(key);
    if (el) return el;
  }
  return null;
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
 * @returns {string | null}
 */
export function detailTabIdForSectionElement(elementId) {
  if (!elementId) return null;

  if (elementId === "charging-practicality") return "charging";

  if (DETAIL_NAV_TABS.some((t) => t.id === elementId)) {
    return elementId;
  }

  for (const [tabId, aliases] of Object.entries(SECTION_RESOLVE_ORDER)) {
    if (aliases.includes(elementId)) return tabId;
  }

  return null;
}
