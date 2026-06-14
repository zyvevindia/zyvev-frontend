import { buildVehicleDiscoveryLinkSections } from "../seo/vehicleInternalLinks.js";
import { buildPeopleAlsoCompare } from "../intelligence/buildPeopleAlsoCompare.js";
import { buildSimilarEvs } from "../intelligence/buildSimilarEvs.js";
import { buildPopularAmongSimilarBuyers } from "../intelligence/buildPopularAmongSimilarBuyers.js";
import {
  DetailAssistanceSection,
  DetailChargingSection,
  DetailCompareSection,
  DetailEmiSection,
  DetailFaqsSection,
  DetailOverviewSection,
  DetailPeopleAlsoCompareSection,
  DetailPopularAmongSimilarBuyersSection,
  DetailRangeSection,
  DetailRelatedEvsSection,
  DetailReviewsSection,
  DetailSimilarEvsSection,
  DetailSuitabilitySection,
  DetailVariantsSection,
} from "./detailPageSections.jsx";

/**
 * @typedef {object} DetailPageSectionContext
 * @property {boolean} hasOverview
 * @property {boolean} hasVariants
 * @property {boolean} hasCompare
 * @property {boolean} hasPeopleAlsoCompare
 * @property {boolean} hasSimilarEvs
 * @property {boolean} hasPopularAmongSimilarBuyers
 * @property {boolean} hasRange
 * @property {boolean} hasOwnership
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
    id: "people-also-compare",
    title: "People also compare",
    shellClassName: "cd-section cd-card cd-content-card",
    condition: (ctx) => ctx.hasPeopleAlsoCompare,
    Component: DetailPeopleAlsoCompareSection,
  },
  {
    id: "similar-evs",
    title: "Similar EVs",
    shellClassName: "cd-section cd-card cd-content-card",
    condition: (ctx) => ctx.hasSimilarEvs,
    Component: DetailSimilarEvsSection,
  },
  {
    id: "popular-among-similar-buyers",
    title: "Popular Among Similar Buyers",
    shellClassName: "cd-section cd-card cd-content-card",
    condition: (ctx) => ctx.hasPopularAmongSimilarBuyers,
    Component: DetailPopularAmongSimilarBuyersSection,
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
  comparisonVehicle = null,
  hasGoldExperience = false,
  intelligence = null,
  familySlug = "",
}) {
  const meta = vehicle?.catalogMeta ?? {};
  const allFaq = [...(meta.faq ?? []), ...(meta.chargingFaq ?? [])];
  const peopleAlsoCompare = buildPeopleAlsoCompare(
    comparisonVehicle || vehicle
  );
  const similarEvs = buildSimilarEvs(comparisonVehicle || vehicle, {
    excludeSlugs: peopleAlsoCompare.comparisons.map((item) => item.slug),
  });
  const popularAmongSimilarBuyers = buildPopularAmongSimilarBuyers(
    comparisonVehicle || vehicle,
    {
      excludeSlugs: [
        ...peopleAlsoCompare.comparisons.map((item) => item.slug),
        ...similarEvs.similarVehicles.map((item) => item.slug),
      ],
    }
  );

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
    hasPeopleAlsoCompare: peopleAlsoCompare.comparisons.length > 0,
    hasSimilarEvs: similarEvs.similarVehicles.length > 0,
    hasPopularAmongSimilarBuyers:
      popularAmongSimilarBuyers.vehicles.length > 0,
    hasRange: !isFamilyOverviewMode && Boolean(intelligence?.range?.hasData),
    hasOwnership:
      !isFamilyOverviewMode && Boolean(intelligence?.hasAnyData),
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
    peopleAlsoCompare,
    similarEvs,
    popularAmongSimilarBuyers,
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
