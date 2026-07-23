/**
 * Central analytics track — single dispatcher for all providers.
 */
import { analyticsConfig } from "./config.js";
import { EVENT_CATEGORIES } from "./categories.js";
import { hasAnalyticsConsent } from "./consent.js";
import { shouldEmitEvent } from "./dedupe.js";
import { buildEventEnvelope } from "./envelope.js";
import { resolvePageContext } from "./pageContext.js";
import { ANALYTICS_EVENTS } from "./events.js";
import {
  dispatchAnalyticsEvent,
  dispatchPageView,
} from "./providers/index.js";

function sanitizeProps(props = {}) {
  const clean = {};

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null) {
      continue;
    }

    const lower = key.toLowerCase();

    if (
      lower.includes("email") ||
      lower.includes("phone") ||
      lower.includes("address") ||
      lower === "name" ||
      lower === "full_name" ||
      lower === "first_name" ||
      lower === "last_name"
    ) {
      continue;
    }

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      clean[key] = value;
    } else if (Array.isArray(value)) {
      clean[key] = value.slice(0, 12).map((v) => String(v).slice(0, 80));
    } else if (typeof value === "object" && value !== null) {
      /* Allow campaign_context / metadata objects — already sanitized upstream */
      if (key === "campaign_context" || key === "metadata") {
        clean[key] = value;
      }
    }
  }

  return clean;
}

/**
 * Central analytics track — fans out through provider dispatcher.
 */
export function trackAnalytics(
  eventName,
  properties = {},
  options = {}
) {
  if (
    typeof window === "undefined" ||
    !analyticsConfig.analyticsEnabled ||
    !hasAnalyticsConsent()
  ) {
    return;
  }

  const dedupeKey =
    options.dedupeKey ||
    `${properties.source_page || ""}:${properties.family_slug || ""}:${properties.landing_slug || ""}`;

  if (
    options.dedupe !== false &&
    !shouldEmitEvent(eventName, dedupeKey)
  ) {
    return;
  }

  const category =
    properties.event_category ||
    options.category ||
    EVENT_CATEGORIES.ENGAGEMENT;

  const envelope = buildEventEnvelope({
    eventName,
    category,
    properties: sanitizeProps(properties),
    pagePath: properties.page_path || properties.source_page,
  });

  if (analyticsConfig.debug) {
    console.info("[analytics]", eventName, envelope);
  }

  dispatchAnalyticsEvent(eventName, envelope);
}

function emitTypedPageView(pagePath, title) {
  const ctx = resolvePageContext(pagePath);
  const base = {
    page_path: pagePath,
    page_title: title,
    source_page: pagePath,
  };

  if (ctx.pageType === "homepage") {
    trackAnalytics(
      ANALYTICS_EVENTS.HOMEPAGE_VIEWED,
      { ...base, event_category: EVENT_CATEGORIES.NAVIGATION },
      { dedupeKey: pagePath }
    );
    return;
  }

  if (ctx.pageType === "browse") {
    trackAnalytics(
      ANALYTICS_EVENTS.BROWSE_VIEWED,
      { ...base, event_category: EVENT_CATEGORIES.CATALOG },
      { dedupeKey: pagePath }
    );
    return;
  }

  if (ctx.pageType === "landing") {
    trackAnalytics(
      ANALYTICS_EVENTS.LANDING_VIEWED,
      {
        ...base,
        landing_type: ctx.landingType,
        landing_slug: ctx.landingSlug,
        event_category: EVENT_CATEGORIES.LANDING,
      },
      { dedupeKey: `${ctx.landingType}:${ctx.landingSlug}` }
    );
    return;
  }

  if (ctx.pageType === "guide") {
    trackAnalytics(
      ANALYTICS_EVENTS.GUIDE_VIEWED,
      {
        ...base,
        guide_type: ctx.guideType,
        guide_slug: ctx.guideSlug,
        event_category: EVENT_CATEGORIES.GUIDE,
      },
      { dedupeKey: `guide:${pagePath}` }
    );
  }
}

export function trackPageView(path, title = "") {
  if (
    typeof window === "undefined" ||
    !analyticsConfig.analyticsEnabled ||
    !hasAnalyticsConsent()
  ) {
    return;
  }

  const pagePath = path || window.location.pathname;
  const pageTitle = title || document.title;

  if (!shouldEmitEvent("page_view", pagePath)) {
    return;
  }

  const envelope = buildEventEnvelope({
    eventName: ANALYTICS_EVENTS.PAGE_VIEW,
    category: EVENT_CATEGORIES.NAVIGATION,
    properties: {
      page_path: pagePath,
      page_title: pageTitle,
    },
    pagePath,
  });

  if (analyticsConfig.debug) {
    console.info("[analytics]", ANALYTICS_EVENTS.PAGE_VIEW, envelope);
  }

  dispatchPageView(pagePath, pageTitle, envelope);
  emitTypedPageView(pagePath, pageTitle);
}
