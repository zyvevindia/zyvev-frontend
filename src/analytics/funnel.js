import { ANALYTICS_EVENTS } from "./events";
import { trackAnalytics } from "./track";
import {
  appendUsageLearningEvent,
  listUsageLearningEvents,
} from "../ops/usageLearningBuffer.js";
import { acquisitionMetaForBuffer } from "../utils/acquisitionContext.js";
import { getClientDeviceClass } from "../ops/analyticsMaturityOps.js";

function slugList(slugs) {
  if (!Array.isArray(slugs)) {
    return [];
  }

  return slugs.filter(Boolean).slice(0, 8);
}

export function trackEvViewed({
  familySlug,
  variantSlug,
  sourcePage,
  brand,
}) {
  trackAnalytics(ANALYTICS_EVENTS.EV_VIEWED, {
    family_slug: familySlug,
    variant_slug: variantSlug,
    source_page: sourcePage,
    brand,
  });
  bufferFunnelEvent("ev_viewed", {
    familySlug,
    sourcePage,
  });
}

function pairSlugFromPage(sourcePage = "") {
  const m = String(sourcePage).match(/\/compare\/([^?#/]+)/i);
  return m ? m[1].toLowerCase() : "";
}

function bufferFunnelEvent(type, meta = {}) {
  const pairSlug = meta.pairSlug || pairSlugFromPage(meta.sourcePage);
  appendUsageLearningEvent({
    type,
    meta: {
      device: getClientDeviceClass(),
      ...acquisitionMetaForBuffer(),
      ...meta,
      ...(pairSlug ? { pairSlug } : {}),
    },
  });
}

export function trackCompareStarted({
  vehicleSlugs = [],
  sourcePage,
  compareDepth,
}) {
  trackAnalytics(ANALYTICS_EVENTS.COMPARE_STARTED, {
    vehicle_slugs: slugList(vehicleSlugs).join(","),
    compare_depth: compareDepth || vehicleSlugs.length,
    source_page: sourcePage,
  });
  bufferFunnelEvent("compare_started", {
    sourcePage,
    depth: vehicleSlugs.length,
  });

  const recent = listUsageLearningEvents().slice(-12);
  const hadRecentDoubt = recent.some((e) => e.type === "recommendation_doubted");
  if (hadRecentDoubt) {
    trackAnalytics(ANALYTICS_EVENTS.COMPARE_SWITCH_AFTER_DOUBT, {
      source_page: sourcePage,
    });
    bufferFunnelEvent("compare_switch_after_doubt", { sourcePage });
  }
}

export function trackCompareCompleted({
  vehicleSlugs = [],
  sourcePage,
}) {
  trackAnalytics(ANALYTICS_EVENTS.COMPARE_COMPLETED, {
    vehicle_slugs: slugList(vehicleSlugs).join(","),
    compare_depth: vehicleSlugs.length,
    source_page: sourcePage,
  });
  bufferFunnelEvent("compare_completed", {
    sourcePage,
    depth: vehicleSlugs.length,
  });
}

export function trackCompareCtaClicked(payload = {}) {
  trackAnalytics(ANALYTICS_EVENTS.COMPARE_CTA_CLICKED, {
    source_page: payload.sourcePage || "compare",
    headline: payload.headline,
    vehicle_slugs: slugList(payload.vehicleSlugs).join(","),
  });
}

export function trackLeadFormOpened(payload = {}) {
  trackAnalytics(ANALYTICS_EVENTS.LEAD_FORM_OPENED, {
    source_page: payload.sourcePage,
    form_type: payload.formType || "inquiry",
    family_slug: payload.familySlug,
  });
}

/** GA4-ready alias — fired when user opens lead form (intent start). */
export function trackLeadStarted(payload = {}) {
  trackAnalytics(ANALYTICS_EVENTS.LEAD_STARTED, {
    source_page: payload.sourcePage,
    form_type: payload.formType || "inquiry",
    family_slug: payload.familySlug,
  });
  bufferFunnelEvent("lead_started", {
    sourcePage: payload.sourcePage,
    formType: payload.formType,
    familySlug: payload.familySlug,
  });
}

export function trackLeadSubmitted(payload = {}) {
  const formType = payload.formType || "inquiry";

  trackAnalytics(ANALYTICS_EVENTS.LEAD_SUBMITTED, {
    source_page: payload.sourcePage,
    form_type: formType,
    family_slug: payload.familySlug,
    variant_slug: payload.variantSlug,
  });

  if (formType === "test_drive") {
    trackAnalytics(ANALYTICS_EVENTS.TEST_DRIVE_REQUESTED, {
      source_page: payload.sourcePage,
      family_slug: payload.familySlug,
    });
  }

  if (formType === "callback") {
    trackAnalytics(ANALYTICS_EVENTS.CALLBACK_REQUESTED, {
      source_page: payload.sourcePage,
      family_slug: payload.familySlug,
    });
  }

  if (formType === "finance_help") {
    trackAnalytics(
      ANALYTICS_EVENTS.FINANCE_INTEREST_SUBMITTED,
      {
        source_page: payload.sourcePage,
        family_slug: payload.familySlug,
      }
    );
  }
}

export function trackNewsletterSubscribed({ source = "footer" } = {}) {
  trackAnalytics(ANALYTICS_EVENTS.NEWSLETTER_SUBSCRIBED, {
    source,
  });
}

export function trackFeedbackSubmitted({ route, category, severity } = {}) {
  trackAnalytics(ANALYTICS_EVENTS.FEEDBACK_SUBMITTED, {
    route,
    category,
    severity: severity || "",
  });
}

export function trackContactSubmitted() {
  trackAnalytics(ANALYTICS_EVENTS.CONTACT_SUBMITTED, {
    source_page: "/contact",
  });
}

export function trackCtaClicked(payload = {}) {
  trackAnalytics(ANALYTICS_EVENTS.CTA_CLICKED, {
    cta_type: payload.ctaType,
    source_page: payload.sourcePage,
    label: payload.label,
  });
}

export function trackChargingSectionViewed({
  familySlug,
  sourcePage = "car_detail",
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.CHARGING_SECTION_VIEWED, {
    family_slug: familySlug,
    source_page: sourcePage,
  });
}

/** GA4 + buffer — charging guide engagement (Phase 5C). */
export function trackChargingGuideOpened({
  familySlug,
  sourcePage = "car_detail",
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.CHARGING_GUIDE_OPENED, {
    family_slug: familySlug,
    source_page: sourcePage,
  });
  trackChargingSectionViewed({ familySlug, sourcePage });
  bufferFunnelEvent("charging_guide_opened", {
    familySlug,
    sourcePage,
  });
}

export function trackOwnershipInsightViewed({
  familySlug,
  sourcePage = "car_detail",
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.OWNERSHIP_INSIGHT_VIEWED, {
    family_slug: familySlug,
    source_page: sourcePage,
  });
}

/** GA4 + buffer — ownership guide engagement (Phase 5C). */
export function trackOwnershipGuideOpened({
  familySlug,
  sourcePage = "car_detail",
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.OWNERSHIP_GUIDE_OPENED, {
    family_slug: familySlug,
    source_page: sourcePage,
  });
  trackOwnershipInsightViewed({ familySlug, sourcePage });
  bufferFunnelEvent("ownership_guide_opened", {
    familySlug,
    sourcePage,
  });
}

export function trackFeatureComparisonViewed({
  familySlug,
  sourcePage = "car_detail",
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.FEATURE_COMPARISON_VIEWED, {
    family_slug: familySlug,
    source_page: sourcePage,
  });
}

export function trackIntelligenceCompareEngaged({
  vehicleSlugs = [],
  sourcePage = "compare",
  rowCount = 0,
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.INTELLIGENCE_COMPARE_ENGAGED, {
    vehicle_slugs: slugList(vehicleSlugs).join(","),
    source_page: sourcePage,
    compare_row_count: rowCount,
  });
}

export function trackIntelligenceFilterApplied({
  filterId,
  active,
  sourcePage = "listing",
  activeCount = 0,
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.INTELLIGENCE_FILTER_APPLIED, {
    filter_id: filterId,
    active: active ? "1" : "0",
    source_page: sourcePage,
    active_filter_count: activeCount,
  });
}

export function trackDiscoveryPageEngaged({
  presetSlug,
  resultCount = 0,
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.DISCOVERY_PAGE_ENGAGED, {
    preset_slug: presetSlug,
    result_count: resultCount,
    source_page: "intelligence_discovery",
  });
}

export function trackRecommendationGenerated({
  sourcePage = "listing",
  priorityKeys = "",
  resultCount = 0,
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.RECOMMENDATION_GENERATED, {
    source_page: sourcePage,
    priority_keys: priorityKeys,
    result_count: resultCount,
  });
}

export function trackCompareAdvantageViewed({
  vehicleSlugs = [],
  highlightCount = 0,
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.COMPARE_ADVANTAGE_VIEWED, {
    vehicle_slugs: slugList(vehicleSlugs).join(","),
    highlight_count: highlightCount,
    source_page: "compare",
  });
}

export function trackTrustTooltipOpened({
  field = "",
  familySlug = "",
  sourcePage = "car_detail",
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.TRUST_TOOLTIP_OPENED, {
    field,
    family_slug: familySlug,
    source_page: sourcePage,
  });
  bufferFunnelEvent("trust_tooltip_opened", {
    field,
    familySlug,
    sourcePage,
  });
}

export function trackTrustFaqEngaged({
  faqId = "",
  familySlug = "",
  sourcePage = "car_detail",
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.TRUST_FAQ_ENGAGED, {
    faq_id: faqId,
    family_slug: familySlug,
    source_page: sourcePage,
  });
}

export function trackCompareTrustViewed({
  vehicleSlugs = [],
  sourcePage = "compare",
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.COMPARE_TRUST_VIEWED, {
    vehicle_slugs: slugList(vehicleSlugs).join(","),
    source_page: sourcePage,
  });
}

export function trackChargingPracticalityViewed({
  familySlug = "",
  sourcePage = "car_detail",
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.CHARGING_PRACTICALITY_VIEWED, {
    family_slug: familySlug,
    source_page: sourcePage,
  });
}

export function trackFreshnessBadgeOpened({
  state = "",
  familySlug = "",
  sourcePage = "car_detail",
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.FRESHNESS_BADGE_OPENED, {
    freshness_state: state,
    family_slug: familySlug,
    source_page: sourcePage,
  });
}

export function trackTransparencySectionViewed({
  familySlug = "",
  sourcePage = "car_detail",
  hasBadges = false,
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.TRANSPARENCY_SECTION_VIEWED, {
    family_slug: familySlug,
    source_page: sourcePage,
    has_badges: hasBadges ? "1" : "0",
  });
}

export function trackUpdatedSpecInteraction({
  specField = "",
  familySlug = "",
  sourcePage = "car_detail",
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.UPDATED_SPEC_INTERACTION, {
    spec_field: specField,
    family_slug: familySlug,
    source_page: sourcePage,
  });
}

export function trackReviewStatusViewed({
  status = "",
  familySlug = "",
  sourcePage = "car_detail",
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.REVIEW_STATUS_VIEWED, {
    review_status: status,
    family_slug: familySlug,
    source_page: sourcePage,
  });
}

export function trackUsefulnessFeedback({
  useful = false,
  context = "",
  sourcePage = "",
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.USEFULNESS_FEEDBACK, {
    useful: useful ? "1" : "0",
    context,
    source_page: sourcePage,
  });
}

export function trackIncorrectDataReport({
  context = "",
  sourcePage = "",
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.INCORRECT_DATA_REPORT, {
    context,
    source_page: sourcePage,
  });
}

export function trackCompareAbandoned({
  vehicleSlugs = [],
  compareDepth = 0,
  sourcePage = "compare",
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.COMPARE_ABANDONED, {
    vehicle_slugs: slugList(vehicleSlugs).join(","),
    compare_depth: compareDepth,
    source_page: sourcePage,
  });
  appendUsageLearningEvent({
    type: "compare_abandoned",
    meta: {
      compareDepth,
      sourcePage,
      depth: vehicleSlugs.length,
    },
  });
}

export function trackRecommendationAbandoned({
  sourcePage = "listing",
  hadResults = false,
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.RECOMMENDATION_ABANDONED, {
    source_page: sourcePage,
    had_results: hadResults ? "1" : "0",
  });
  appendUsageLearningEvent({
    type: "recommendation_abandoned",
    meta: { sourcePage, hadResults },
  });
}

export function trackFilterDropoff({
  filterId = "",
  activeCount = 0,
  sourcePage = "listing",
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.FILTER_DROPOFF, {
    filter_id: filterId,
    active_filter_count: activeCount,
    source_page: sourcePage,
  });
  appendUsageLearningEvent({
    type: "filter_dropoff",
    meta: { filterId, activeCount, sourcePage },
  });
}

/**
 * Listing search returned zero families — funnel + local ops buffer (dedupe in caller).
 */
export function trackSearchZeroResults({
  query = "",
  sourcePage = "/cars",
} = {}) {
  const q = String(query || "").trim().slice(0, 120);
  if (!q) return;
  trackAnalytics(ANALYTICS_EVENTS.SEARCH_ZERO_RESULTS, {
    query_len: q.length,
    source_page: sourcePage,
  });
  appendUsageLearningEvent({
    type: "search_zero_results",
    meta: { sourcePage },
  });
}

/**
 * Discovery preset rendered fewer EVs than editorial minimum — thin page signal.
 */
export function trackDiscoveryThinResults({
  presetSlug = "",
  resultCount = 0,
  minResults = 1,
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.DISCOVERY_THIN_RESULTS, {
    preset_slug: presetSlug,
    result_count: resultCount,
    min_results: minResults,
  });
  appendUsageLearningEvent({
    type: "discovery_thin_results",
    meta: { presetSlug, resultCount, minResults },
  });
}

export function trackLeadFormAbandoned({
  sourcePage = "",
  formType = "inquiry",
  familySlug = "",
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.LEAD_FORM_ABANDONED, {
    source_page: sourcePage,
    form_type: formType,
    family_slug: familySlug,
  });
  bufferFunnelEvent("lead_form_abandoned", {
    sourcePage,
    formType,
    familySlug,
  });
}

export function trackCtaFunnelStep({
  step = "",
  ctaType = "",
  sourcePage = "",
  label = "",
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.CTA_FUNNEL_STEP, {
    step,
    cta_type: ctaType,
    source_page: sourcePage,
    label,
  });
}

export function trackLeadAbandoned(payload = {}) {
  trackAnalytics(ANALYTICS_EVENTS.LEAD_ABANDONED, {
    source_page: payload.sourcePage,
    form_type: payload.formType || "inquiry",
    family_slug: payload.familySlug,
  });
  bufferFunnelEvent("lead_abandoned", {
    sourcePage: payload.sourcePage,
    formType: payload.formType,
    familySlug: payload.familySlug,
  });
}

export function trackRepeatedEvInterest({ familySlug, sourcePage } = {}) {
  trackAnalytics(ANALYTICS_EVENTS.REPEATED_EV_INTEREST, {
    family_slug: familySlug,
    source_page: sourcePage,
  });
  bufferFunnelEvent("repeated_ev_interest", { familySlug, sourcePage });
}

export function trackMultiSessionCompare({ pairSlug, sourcePage } = {}) {
  trackAnalytics(ANALYTICS_EVENTS.MULTI_SESSION_COMPARE, {
    pair_slug: pairSlug,
    source_page: sourcePage,
  });
  bufferFunnelEvent("multi_session_compare", { pairSlug, sourcePage });
}

export function trackHighBounceCompare({ pairSlug, sourcePage, depth = 0 } = {}) {
  trackAnalytics(ANALYTICS_EVENTS.HIGH_BOUNCE_COMPARE, {
    pair_slug: pairSlug,
    source_page: sourcePage,
    compare_depth: depth,
  });
  bufferFunnelEvent("high_bounce_compare", { pairSlug, sourcePage, depth });
}

export function trackWeakConversionCompare({ pairSlug, sourcePage } = {}) {
  trackAnalytics(ANALYTICS_EVENTS.WEAK_CONVERSION_COMPARE, {
    pair_slug: pairSlug,
    source_page: sourcePage,
  });
  bufferFunnelEvent("weak_conversion_compare", { pairSlug, sourcePage });
}

export function trackCompareSlow({ sourcePage, durationMs } = {}) {
  trackAnalytics(ANALYTICS_EVENTS.COMPARE_SLOW, {
    source_page: sourcePage,
    duration_ms: durationMs,
  });
  bufferFunnelEvent("compare_slow", { sourcePage, durationMs });
}

export function trackImageFallbackUsed({ role, familySlug, sourcePage } = {}) {
  bufferFunnelEvent("image_fallback_used", { role, familySlug, sourcePage });
}

export function trackRoutePaintSlow({ route, durationMs } = {}) {
  bufferFunnelEvent("route_paint_slow", { route, durationMs });
}

export function trackOwnershipTooltipOpened({
  vehicleSlugs = [],
  sourcePage = "",
  panel = "ownership_guidance",
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.OWNERSHIP_TOOLTIP_OPENED, {
    vehicle_slugs: slugList(vehicleSlugs).join(","),
    source_page: sourcePage,
    panel,
  });
  bufferFunnelEvent("ownership_tooltip_opened", {
    sourcePage,
    panel,
    slugs: vehicleSlugs,
  });
}

export function trackChargingPracticalityOpened({
  vehicleSlugs = [],
  sourcePage = "",
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.CHARGING_PRACTICALITY_OPENED, {
    vehicle_slugs: slugList(vehicleSlugs).join(","),
    source_page: sourcePage,
  });
  bufferFunnelEvent("charging_practicality_opened", {
    sourcePage,
    slugs: vehicleSlugs,
  });
}

export function trackCompareConfidenceExpanded({
  vehicleSlugs = [],
  sourcePage = "compare",
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.COMPARE_CONFIDENCE_EXPANDED, {
    vehicle_slugs: slugList(vehicleSlugs).join(","),
    source_page: sourcePage,
  });
  bufferFunnelEvent("compare_confidence_expanded", {
    sourcePage,
    slugs: vehicleSlugs,
  });
}

export function trackSuitabilityGuidanceOpened({
  vehicleSlugs = [],
  sourcePage = "",
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.SUITABILITY_GUIDANCE_OPENED, {
    vehicle_slugs: slugList(vehicleSlugs).join(","),
    source_page: sourcePage,
  });
  bufferFunnelEvent("suitability_guidance_opened", {
    sourcePage,
    slugs: vehicleSlugs,
  });
}

export function trackRecommendationDoubted({
  sourcePage = "compare",
  reason = "",
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.RECOMMENDATION_DOUBTED, {
    source_page: sourcePage,
    reason,
  });
  bufferFunnelEvent("recommendation_doubted", { sourcePage, reason });
}

export function trackCompareAbandonAfterGuidance({
  vehicleSlugs = [],
  sourcePage = "compare",
} = {}) {
  trackAnalytics(ANALYTICS_EVENTS.COMPARE_ABANDON_AFTER_GUIDANCE, {
    vehicle_slugs: slugList(vehicleSlugs).join(","),
    source_page: sourcePage,
  });
  bufferFunnelEvent("compare_abandon_after_guidance", {
    sourcePage,
    slugs: vehicleSlugs,
  });
}
