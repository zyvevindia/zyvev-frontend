/**
 * Growth Phase 3 — canonical GA4 traffic events.
 * Names align with docs/analytics/event-taxonomy.md
 */
import { ANALYTICS_EVENTS } from "./events";
import { trackAnalytics } from "./track";

function slugList(slugs) {
  if (!Array.isArray(slugs)) return [];
  return slugs.filter(Boolean).slice(0, 8);
}

export function trackVehicleView({
  familySlug,
  variantSlug,
  sourcePage,
  brand,
} = {}) {
  trackAnalytics(
    ANALYTICS_EVENTS.VEHICLE_VIEW,
    {
      family_slug: familySlug,
      variant_slug: variantSlug,
      source_page: sourcePage,
      brand,
    },
    { dedupeKey: `${familySlug}:${variantSlug}` }
  );
}

export function trackCompareView({
  vehicleSlugs = [],
  sourcePage = "/compare",
  compareDepth,
} = {}) {
  const slugs = slugList(vehicleSlugs);
  trackAnalytics(
    ANALYTICS_EVENTS.COMPARE_VIEW,
    {
      vehicle_slugs: slugs.join(","),
      compare_depth: compareDepth || slugs.length,
      source_page: sourcePage,
    },
    { dedupeKey: slugs.join(",") }
  );
}

export function trackSearchUsed({
  query,
  resultCount = 0,
  sourcePage = "/cars",
} = {}) {
  const q = String(query || "").trim();
  if (!q) return;

  trackAnalytics(
    ANALYTICS_EVENTS.SEARCH_USED,
    {
      search_query: q.slice(0, 120),
      result_count: resultCount,
      source_page: sourcePage,
    },
    { dedupeKey: q.toLowerCase() }
  );
}

export function trackFilterUsed({
  filterType,
  filterValue,
  activeCount = 0,
  sourcePage = "/cars",
} = {}) {
  trackAnalytics(
    ANALYTICS_EVENTS.FILTER_USED,
    {
      filter_type: filterType,
      filter_value: String(filterValue || "").slice(0, 80),
      active_filter_count: activeCount,
      source_page: sourcePage,
    },
    { dedupeKey: `${filterType}:${filterValue}` }
  );
}

export function trackScorePanelOpened({
  familySlug,
  sourcePage,
  panelType = "compare_score",
} = {}) {
  trackAnalytics(
    ANALYTICS_EVENTS.SCORE_PANEL_OPENED,
    {
      family_slug: familySlug,
      source_page: sourcePage,
      panel_type: panelType,
    },
    { dedupeKey: `${familySlug}:${panelType}` }
  );
}

export function trackVariantRecommendationClicked({
  targetSlug,
  variantName,
  seoPageSlug,
  sourcePage,
  rank,
} = {}) {
  trackAnalytics(
    ANALYTICS_EVENTS.VARIANT_RECOMMENDATION_CLICKED,
    {
      target_slug: targetSlug,
      variant_name: variantName,
      seo_page_slug: seoPageSlug,
      source_page: sourcePage,
      rank,
    },
    { dedupeKey: `${seoPageSlug}:${targetSlug}` }
  );
}
