/**
 * Discovery / SEO page analytics hooks.
 */

import { trackBuyerEvent } from "../../event-tracking/trackBuyerEvent";
import { BUYER_EVENTS } from "../../event-tracking/eventTypes";
import { PAGE_TYPES } from "../../seo/registry";
import { trackAnalytics } from "../../analytics/track.js";
import { ANALYTICS_EVENTS } from "../../analytics/events.js";
import { EVENT_CATEGORIES } from "../../analytics/categories.js";

function basePayload(routeContext, seoPage) {
  return {
    sourcePage: routeContext?.path || seoPage?.canonicalPath || "",
    discoveryPath: routeContext?.path || "",
    seoPageSlug: seoPage?.slug || routeContext?.contentSlug || "",
    pageType: routeContext?.pageType || "",
    metadata: {
      category: seoPage?.category,
    },
  };
}

export function trackGuideViewed(routeContext, seoPage) {
  trackBuyerEvent(BUYER_EVENTS.GUIDE_VIEWED, basePayload(routeContext, seoPage));
  trackAnalytics(
    ANALYTICS_EVENTS.GUIDE_VIEWED,
    {
      source_page: routeContext?.path || seoPage?.canonicalPath || "",
      seo_page_slug: seoPage?.slug || routeContext?.contentSlug || "",
      page_type: routeContext?.pageType || "",
      event_category: EVENT_CATEGORIES.GUIDE,
    },
    { dedupeKey: routeContext?.path || seoPage?.slug || "" }
  );
}

export function trackCityPageViewed(routeContext, seoPage) {
  const city = routeContext?.params?.city;
  trackBuyerEvent(BUYER_EVENTS.CITY_PAGE_VIEWED, {
    ...basePayload(routeContext, seoPage),
    citySlug: city,
    metadata: {
      category: seoPage?.category,
      citySlug: city,
      variant:
        routeContext?.pageType === PAGE_TYPES.CITY_CHARGING
          ? "charging"
          : "evs",
    },
  });
}

export function trackSeoCtaClicked(routeContext, seoPage, cta = {}) {
  trackBuyerEvent(BUYER_EVENTS.SEO_CTA_CLICKED, {
    ...basePayload(routeContext, seoPage),
    ctaType: cta.type || "unknown",
    metadata: {
      category: seoPage?.category,
      ctaLabel: cta.label,
      ctaHref: cta.href,
    },
  });
}

export function trackCompareGuideClicked(routeContext, seoPage, extra = {}) {
  trackBuyerEvent(BUYER_EVENTS.COMPARE_GUIDE_CLICKED, {
    ...basePayload(routeContext, seoPage),
    compareSlug: routeContext?.params?.compareSlug,
    vehicleSlugs: extra.vehicleSlugs || [],
    metadata: {
      category: "compare",
      action: extra.action || "open_compare_tool",
    },
  });
}

export function trackDiscoveryPageView(routeContext, seoPage) {
  if (!routeContext || !seoPage) return;

  if (
    routeContext.pageType === PAGE_TYPES.CITY_EVS ||
    routeContext.pageType === PAGE_TYPES.CITY_CHARGING
  ) {
    trackCityPageViewed(routeContext, seoPage);
    return;
  }

  trackGuideViewed(routeContext, seoPage);
}
