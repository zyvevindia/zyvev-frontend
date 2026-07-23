/**
 * Analytics event categories — stable taxonomy for GA4 custom dimensions / GTM.
 */

export const EVENT_CATEGORIES = Object.freeze({
  NAVIGATION: "navigation",
  CATALOG: "catalog",
  LANDING: "landing",
  COMPARE: "compare",
  LEAD: "lead",
  CTA: "cta",
  SEARCH: "search",
  GUIDE: "guide",
  ENGAGEMENT: "engagement",
  PERFORMANCE: "performance",
  AI: "ai",
  ADMIN: "admin",
});

/** Future extension categories — architecture only, no emitters yet. */
export const FUTURE_EVENT_CATEGORIES = Object.freeze({
  DEALER: "dealer",
  OEM: "oem",
  FINANCE: "finance",
  CHARGING: "charging",
  MARKETPLACE: "marketplace",
  EDITORIAL: "editorial",
  AUTHENTICATION: "authentication",
  CRM: "crm",
});

export const CONVERSION_EVENTS = Object.freeze([
  "lead_submitted",
  "callback_requested",
  "dealer_assistance",
  "cta_clicked",
  "compare_completed",
  "emi_interaction",
  "guide_viewed",
  "landing_viewed",
  "landing_engaged",
]);
