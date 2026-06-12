/**
 * Vehicle detail page — section registry, sticky nav, scroll offsets.
 * Tabs and scroll-spy targets derive from the same section definitions.
 */

import { buildVehicleDiscoveryLinkSections } from "../seo/vehicleInternalLinks.js";

/** Sticky site header + detail tab bar (px) */
export const DETAIL_SCROLL_OFFSET_PX = 148;

/** Canonical section definitions (single source of truth). */
export const DETAIL_SECTION_DEFS = [
  {
    id: "overview",
    label: "Overview",
    anchorIds: ["overview", "detail-overview"],
  },
  {
    id: "variants",
    label: "Variants",
    anchorIds: ["variants", "detail-variants"],
  },
  {
    id: "compare",
    label: "Compare",
    anchorIds: ["compare", "detail-compare"],
  },
  {
    id: "range",
    label: "Range",
    anchorIds: ["range", "detail-range-confidence"],
  },
  {
    id: "charging",
    label: "Charging",
    anchorIds: [
      "charging",
      "detail-charging-intelligence",
      "detail-charging",
      "charging-practicality",
    ],
  },
  {
    id: "suitability",
    label: "Suitability",
    anchorIds: ["suitability", "detail-suitability"],
  },
  {
    id: "emi",
    label: "EMI",
    anchorIds: ["emi", "detail-emi-calculator"],
  },
  {
    id: "faqs",
    label: "FAQs",
    anchorIds: ["faqs", "detail-faqs"],
  },
  {
    id: "reviews",
    label: "Reviews",
    anchorIds: ["reviews", "detail-reviews"],
  },
  {
    id: "related-evs",
    label: "Related EVs",
    anchorIds: ["related-evs", "cd-seo-discovery"],
  },
  {
    id: "assistance",
    label: "Assistance",
    anchorIds: ["assistance", "detail-dealer-assistance"],
  },
];

const SECTION_BY_ID = Object.fromEntries(
  DETAIL_SECTION_DEFS.map((def) => [def.id, def])
);

/** @deprecated Use buildDetailPageSections() for runtime tabs. */
export const DETAIL_NAV_TABS = DETAIL_SECTION_DEFS.map(({ id, label }) => ({
  id,
  label,
}));

/** @deprecated Use getDetailObservedSectionIds(pageSections). */
export const DETAIL_OBSERVED_SECTION_IDS = DETAIL_SECTION_DEFS.flatMap(
  (def) => def.anchorIds
);

/**
 * @typedef {object} DetailPageSectionContext
 * @property {boolean} hasVariants
 * @property {boolean} hasCompare
 * @property {boolean} hasRange
 * @property {boolean} hasCharging
 * @property {boolean} hasSuitability
 * @property {boolean} hasFaqs
 * @property {boolean} hasRelatedEvs
 */

/**
 * Build visibility context from vehicle + intelligence state.
 * @param {object} params
 * @returns {DetailPageSectionContext}
 */
export function buildDetailPageSectionContext({
  enrichedVariantsCount = 0,
  isFamilyOverviewMode = false,
  vehicle = null,
  hasGoldExperience = false,
  intelligence = null,
  familySlug = "",
}) {
  const meta = vehicle?.catalogMeta ?? {};
  const allFaq = [...(meta.faq ?? []), ...(meta.chargingFaq ?? [])];

  const discoverySections = buildVehicleDiscoveryLinkSections({
    familySlug,
    vehicleName: vehicle?.name || "",
    compareRivals: meta.compareRivals || [],
    brand: vehicle?.brand || "",
    bodyType: vehicle?.bodyType || meta.bodyType || "",
    priceInr: Number(vehicle?.price || vehicle?.exShowroomPrice || 0),
    evIntelligence: vehicle?.evIntelligence,
    catalogMeta: meta,
  });

  return {
    hasVariants: enrichedVariantsCount >= 1,
    hasCompare:
      hasGoldExperience && Array.isArray(meta.compareRivals) && meta.compareRivals.length > 0,
    hasRange: !isFamilyOverviewMode && Boolean(intelligence?.range?.hasData),
    hasCharging: Boolean(
      intelligence?.charging?.hasData || intelligence?.chargingPracticality?.hasData
    ),
    hasSuitability: Boolean(intelligence?.suitability?.hasData),
    hasFaqs: hasGoldExperience && allFaq.length > 0,
    hasRelatedEvs: discoverySections.length > 0,
  };
}

/**
 * @param {DetailPageSectionContext} context
 * @returns {Array<{ id: string, label: string, anchorIds: string[] }>}
 */
export function buildDetailPageSections(context) {
  const isVisible = (id) => {
    switch (id) {
      case "overview":
      case "emi":
      case "reviews":
      case "assistance":
        return true;
      case "variants":
        return context.hasVariants;
      case "compare":
        return context.hasCompare;
      case "range":
        return context.hasRange;
      case "charging":
        return context.hasCharging;
      case "suitability":
        return context.hasSuitability;
      case "faqs":
        return context.hasFaqs;
      case "related-evs":
        return context.hasRelatedEvs;
      default:
        return false;
    }
  };

  return DETAIL_SECTION_DEFS.filter((def) => isVisible(def.id)).map(
    ({ id, label, anchorIds }) => ({ id, label, anchorIds })
  );
}

/**
 * @param {Array<{ id: string, anchorIds: string[] }>} pageSections
 * @returns {string[]}
 */
export function getDetailObservedSectionIds(pageSections = []) {
  const ids = new Set();
  for (const section of pageSections) {
    for (const anchorId of section.anchorIds) {
      ids.add(anchorId);
    }
  }
  return [...ids];
}

/**
 * @param {string} sectionId
 * @returns {HTMLElement | null}
 */
export function resolveDetailSectionElement(sectionId) {
  const keys = SECTION_BY_ID[sectionId]?.anchorIds || [sectionId];
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
 * @param {Array<{ id: string, anchorIds: string[] }>} [pageSections]
 * @returns {string | null}
 */
export function detailTabIdForSectionElement(elementId, pageSections = []) {
  if (!elementId || !pageSections.length) return null;

  if (elementId === "charging-practicality") {
    return pageSections.some((s) => s.id === "charging") ? "charging" : null;
  }

  for (const section of pageSections) {
    if (section.id === elementId || section.anchorIds.includes(elementId)) {
      return section.id;
    }
  }

  return null;
}
