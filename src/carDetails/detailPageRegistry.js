import { buildVehicleDiscoveryLinkSections } from "../seo/vehicleInternalLinks.js";
import {
  DetailAssistanceSection,
  DetailChargingSection,
  DetailCompareSection,
  DetailEmiSection,
  DetailFaqsSection,
  DetailOverviewSection,
  DetailRangeSection,
  DetailRelatedEvsSection,
  DetailReviewsSection,
  DetailSuitabilitySection,
  DetailVariantsSection,
} from "./detailPageSections.jsx";

/**
 * @typedef {object} DetailPageSectionContext
 * @property {boolean} hasOverview
 * @property {boolean} hasVariants
 * @property {boolean} hasCompare
 * @property {boolean} hasRange
 * @property {boolean} hasCharging
 * @property {boolean} hasSuitability
 * @property {boolean} hasEmi
 * @property {boolean} hasFaqs
 * @property {boolean} hasReviews
 * @property {boolean} hasRelatedEvs
 * @property {boolean} hasAssistance
 */

/** Schema-driven section registry — single source of truth. */
export const DETAIL_SECTION_DEFS = [
  {
    id: "overview",
    title: "Overview",
    shellClassName:
      "cd-section cd-card cd-content-card cd-overview-section",
    condition: (ctx) => ctx.hasOverview,
    Component: DetailOverviewSection,
  },
  {
    id: "variants",
    title: "Variants",
    shellClassName:
      "cd-section cd-card cd-content-card variant-comparison",
    condition: (ctx) => ctx.hasVariants,
    Component: DetailVariantsSection,
  },
  {
    id: "compare",
    title: "Compare",
    shellClassName: "cd-section cd-card cd-content-card",
    condition: (ctx) => ctx.hasCompare,
    Component: DetailCompareSection,
  },
  {
    id: "range",
    title: "Range",
    shellClassName: "cd-section cd-card cd-content-card ev-intel-section",
    condition: (ctx) => ctx.hasRange,
    Component: DetailRangeSection,
  },
  {
    id: "charging",
    title: "Charging",
    shellClassName: "cd-section cd-card cd-content-card ev-intel-section",
    condition: (ctx) => ctx.hasCharging,
    Component: DetailChargingSection,
  },
  {
    id: "suitability",
    title: "Suitability",
    shellClassName: "cd-section cd-card cd-content-card ev-intel-section",
    condition: (ctx) => ctx.hasSuitability,
    Component: DetailSuitabilitySection,
  },
  {
    id: "emi",
    title: "EMI",
    shellClassName: "cd-section cd-card cd-content-card detail-emi-section",
    condition: (ctx) => ctx.hasEmi,
    Component: DetailEmiSection,
  },
  {
    id: "faqs",
    title: "FAQs",
    shellClassName: "cd-section cd-card cd-content-card",
    condition: (ctx) => ctx.hasFaqs,
    Component: DetailFaqsSection,
  },
  {
    id: "reviews",
    title: "Reviews",
    shellClassName: "cd-section cd-card cd-content-card",
    condition: (ctx) => ctx.hasReviews,
    Component: DetailReviewsSection,
  },
  {
    id: "related-evs",
    title: "Related EVs",
    shellClassName: "cd-seo-discovery",
    condition: (ctx) => ctx.hasRelatedEvs,
    Component: DetailRelatedEvsSection,
  },
  {
    id: "assistance",
    title: "Assistance",
    shellClassName: "cd-section cd-dealer cd-card",
    condition: (ctx) => ctx.hasAssistance,
    Component: DetailAssistanceSection,
  },
];

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
    hasOverview: true,
    hasVariants: enrichedVariantsCount >= 1,
    hasCompare:
      hasGoldExperience &&
      Array.isArray(meta.compareRivals) &&
      meta.compareRivals.length > 0,
    hasRange: !isFamilyOverviewMode && Boolean(intelligence?.range?.hasData),
    hasCharging: Boolean(
      intelligence?.charging?.hasData ||
        intelligence?.chargingPracticality?.hasData ||
        intelligence?.ownership?.hasData
    ),
    hasSuitability: Boolean(intelligence?.suitability?.hasData),
    hasEmi: true,
    hasFaqs: hasGoldExperience && allFaq.length > 0,
    hasReviews: true,
    hasRelatedEvs: discoverySections.length > 0,
    hasAssistance: true,
  };
}

/**
 * @param {DetailPageSectionContext} context
 * @returns {Array<{ id: string, title: string, shellClassName: string, Component: Function }>}
 */
export function buildVisibleDetailSections(context) {
  return DETAIL_SECTION_DEFS.filter((def) => def.condition(context)).map(
    ({ id, title, shellClassName, Component }) => ({
      id,
      title,
      shellClassName,
      Component,
    })
  );
}

/** @deprecated Use buildVisibleDetailSections */
export function buildDetailPageSections(context) {
  return buildVisibleDetailSections(context).map(
    ({ id, title, shellClassName, Component }) => ({
      id,
      label: title,
      title,
      shellClassName,
      Component,
    })
  );
}
