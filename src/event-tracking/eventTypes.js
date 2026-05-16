/**
 * Buyer event types — must match backend behavioral-intelligence/eventSchema.js
 */

export const BUYER_EVENTS = Object.freeze({
  DETAIL_PAGE_VIEWED: "detail_page_viewed",
  COMPARE_STARTED: "compare_started",
  COMPARE_COMPLETED: "compare_completed",
  OWNERSHIP_PANEL_VIEWED: "ownership_panel_viewed",
  CHARGING_REALITY_EXPANDED: "charging_reality_expanded",
  SCENARIO_COMPARE_VIEWED: "scenario_compare_viewed",
  SEO_TO_DETAIL: "seo_to_detail",
  LEAD_CTA_INITIATED: "lead_cta_initiated",
  LEAD_SUBMITTED: "lead_submitted",
  BOOKMARK_SAVED: "bookmark_saved",
  VARIANT_SELECTED: "variant_selected",
  VARIANT_COMPARE_CLICKED: "variant_compare_clicked",
  PRICING_INTERACTION: "pricing_interaction",
});
