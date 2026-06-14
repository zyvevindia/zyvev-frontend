import { buildVehicleDiscoveryLinkSections } from "../seo/vehicleInternalLinks.js";
import { buildPeopleAlsoCompare } from "../intelligence/buildPeopleAlsoCompare.js";
import { buildSimilarEvs } from "../intelligence/buildSimilarEvs.js";
import { buildPopularAmongSimilarBuyers } from "../intelligence/buildPopularAmongSimilarBuyers.js";
import { vehicleHasUnifiedEvIntelligence } from "../intelligence/unifiedEvIntelligenceVisibility.js";
import {
  DetailAssistanceSection,
  DetailChargingSection,
  DetailCompareSection,
  DetailEmiSection,
  DetailFaqsSection,
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
 * @property {boolean} hasEvIntelligence
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
 *   condition: (ctx: DetailPageSectionContext) => boolean,
 *   Component?: Function,
 * }>}
 */
export const DETAIL_SECTION_DEFS = [
  {
    id: "ev-intelligence",
    title: "EV Intelligence",
    nav: true,
    navOrder: 10,
    placement: "hero",
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
    Component: DetailVariantsSection,
  },
  {
    id: "compare",
    title: "Compare",
    placement: "page",
    shellClassName: "cd-section cd-card cd-content-card",
    condition: (ctx) => ctx.hasCompare,
    Component: DetailCompareSection,
  },
  {
    id: "charging",
    title: "Charging",
    nav: true,
    navOrder: 30,
    placement: "page",
    shellClassName: "cd-section cd-card cd-content-card ev-intel-section",
    condition: (ctx) => ctx.hasDedicatedChargingSection,
    Component: DetailChargingSection,
  },
  {
    id: "people-also-compare",
    title: "People Also Compare",
    nav: true,
    navOrder: 40,
    placement: "page",
    shellClassName: "cd-section cd-card cd-content-card",
    condition: (ctx) => ctx.hasPeopleAlsoCompare,
    Component: DetailPeopleAlsoCompareSection,
  },
  {
    id: "similar-evs",
    title: "Similar EVs",
    nav: true,
    navOrder: 50,
    placement: "page",
    shellClassName: "cd-section cd-card cd-content-card",
    condition: (ctx) => ctx.hasSimilarEvs,
    Component: DetailSimilarEvsSection,
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
    Component: DetailPopularAmongSimilarBuyersSection,
  },
  {
    id: "range",
    title: "Range",
    placement: "page",
    shellClassName: "cd-section cd-card cd-content-card ev-intel-section",
    condition: (ctx) => ctx.hasRange,
    Component: DetailRangeSection,
  },
  {
    id: "suitability",
    title: "Suitability",
    placement: "page",
    shellClassName: "cd-section cd-card cd-content-card ev-intel-section",
    condition: (ctx) => ctx.hasSuitability,
    Component: DetailSuitabilitySection,
  },
  {
    id: "emi",
    title: "EMI",
    placement: "page",
    shellClassName: "cd-section cd-card cd-content-card detail-emi-section",
    condition: (ctx) => ctx.hasEmi,
    Component: DetailEmiSection,
  },
  {
    id: "reviews",
    title: "Reviews",
    nav: true,
    navOrder: 70,
    placement: "page",
    shellClassName: "cd-section cd-card cd-content-card",
    condition: (ctx) => ctx.hasReviews,
    Component: DetailReviewsSection,
  },
  {
    id: "faqs",
    title: "FAQs",
    nav: true,
    navOrder: 80,
    placement: "page",
    shellClassName: "cd-section cd-card cd-content-card",
    condition: (ctx) => ctx.hasFaqs,
    Component: DetailFaqsSection,
  },
  {
    id: "related-evs",
    title: "Related EVs",
    placement: "page",
    shellClassName: "cd-seo-discovery",
    condition: (ctx) => ctx.hasRelatedEvs,
    Component: DetailRelatedEvsSection,
  },
  {
    id: "assistance",
    title: "Assistance",
    placement: "page",
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

  const intelVehicle = comparisonVehicle || vehicle;
  const hasEvIntelligence =
    !isFamilyOverviewMode &&
    vehicleHasUnifiedEvIntelligence(intelVehicle);

  const hasDedicatedChargingSection =
    !isFamilyOverviewMode &&
    !hasEvIntelligence &&
    Boolean(
      intelligence?.charging?.hasData ||
        intelligence?.chargingPracticality?.hasData ||
        intelligence?.ownership?.hasData
    );

  return {
    hasEvIntelligence,
    hasDedicatedChargingSection,
    hasVariants: enrichedVariantsCount >= 1,
    hasCompare:
      hasGoldExperience &&
      Array.isArray(meta.compareRivals) &&
      meta.compareRivals.length > 0,
    hasPeopleAlsoCompare: peopleAlsoCompare.comparisons.length > 0,
    hasSimilarEvs: similarEvs.similarVehicles.length > 0,
    hasPopularAmongSimilarBuyers:
      popularAmongSimilarBuyers.vehicles.length > 0,
    hasRange:
      !isFamilyOverviewMode &&
      Boolean(intelligence?.range?.hasData) &&
      !hasEvIntelligence,
    hasOwnership: hasEvIntelligence,
    hasCharging: hasDedicatedChargingSection,
    hasSuitability:
      Boolean(intelligence?.suitability?.hasData) && !hasEvIntelligence,
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
  return DETAIL_SECTION_DEFS.filter(
    (def) => def.Component && def.condition(context)
  ).map(({ id, title, shellClassName, Component }) => ({
    id,
    title,
    shellClassName,
    Component,
  }));
}

/**
 * Sticky nav tabs derived from the section registry.
 * @param {DetailPageSectionContext} context
 * @returns {Array<{ id: string, title: string, scrollTarget?: string, action?: string, cta?: boolean }>}
 */
export function buildVisibleDetailNavTabs(context) {
  const sectionTabs = DETAIL_SECTION_DEFS.filter(
    (def) => def.nav && def.condition(context)
  )
    .sort((a, b) => (a.navOrder ?? 999) - (b.navOrder ?? 999))
    .map(({ id, title, navTitle }) => ({
      id,
      title: navTitle ?? title,
      scrollTarget: id,
    }));

  return [...sectionTabs, { ...DETAIL_NAV_CTA_TAB }];
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
