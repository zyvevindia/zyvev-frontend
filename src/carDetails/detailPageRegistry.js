import { buildVehicleDiscoveryLinkSections } from "../seo/vehicleInternalLinks.js";
import { buildPeopleAlsoCompare } from "../intelligence/buildPeopleAlsoCompare.js";
import { buildSimilarEvs } from "../intelligence/buildSimilarEvs.js";
import { buildPopularAmongSimilarBuyers } from "../intelligence/buildPopularAmongSimilarBuyers.js";
import { vehicleHasUnifiedEvIntelligence } from "../intelligence/unifiedEvIntelligenceVisibility.js";
import {
  DETAIL_NAV_CTA_TAB,
  DETAIL_SECTION_DEFS as DETAIL_SECTION_DEFS_BASE,
} from "./detailPageSectionDefs.js";
import {
  DetailAssistanceSection,
  DetailChargingSection,
  DetailCompareSection,
  DetailEmiSection,
  DetailEvIntelligenceSection,
  DetailFaqsSection,
  DetailOwnershipToolsSection,
  DetailPeopleAlsoCompareSection,
  DetailPopularAmongSimilarBuyersSection,
  DetailRangeSection,
  DetailRelatedEvsSection,
  DetailReviewsSection,
  DetailSimilarEvsSection,
  DetailSuitabilitySection,
  DetailVariantsSection,
} from "./detailPageSections.jsx";

/** @typedef {import("./detailPageSectionDefs.js").DetailPageSectionContext} DetailPageSectionContext */

const DETAIL_SECTION_COMPONENTS = {
  "ev-intelligence": DetailEvIntelligenceSection,
  variants: DetailVariantsSection,
  "ownership-tools": DetailOwnershipToolsSection,
  compare: DetailCompareSection,
  charging: DetailChargingSection,
  "people-also-compare": DetailPeopleAlsoCompareSection,
  "similar-evs": DetailSimilarEvsSection,
  "popular-among-similar-buyers": DetailPopularAmongSimilarBuyersSection,
  range: DetailRangeSection,
  suitability: DetailSuitabilitySection,
  emi: DetailEmiSection,
  reviews: DetailReviewsSection,
  faqs: DetailFaqsSection,
  "related-evs": DetailRelatedEvsSection,
  assistance: DetailAssistanceSection,
};

export { DETAIL_NAV_CTA_TAB };

export const DETAIL_SECTION_DEFS = DETAIL_SECTION_DEFS_BASE.map((def) => ({
  ...def,
  Component: DETAIL_SECTION_COMPONENTS[def.id],
}));

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
  evSavariScores = null,
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
  const hasEvIntelligence = vehicleHasUnifiedEvIntelligence(
    intelVehicle,
    evSavariScores
  );

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
    hasOwnershipTools: Boolean(familySlug),
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
    (def) =>
      def.Component &&
      def.renderOnPage !== false &&
      def.condition(context)
  ).map(({ id, title, shellClassName, Component }) => ({
    id,
    title,
    shellClassName,
    Component,
  }));
}

/**
 * Nav tabs — strictly registry-driven; only sections with nav: true.
 * Hero EV Intelligence uses id scroll target without a page shell.
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
