/**
 * Launch telemetry — buyer intent API + product analytics (GA4/PostHog).
 */

import { trackBuyerEvent } from "../event-tracking/trackBuyerEvent";
import { BUYER_EVENTS } from "../event-tracking/eventTypes";
import {
  trackCompareCtaClicked,
  trackCompareCompleted,
  trackCompareStarted,
  trackCtaClicked,
  trackEvViewed,
  trackLeadFormOpened,
  trackLeadStarted,
  trackLeadSubmitted,
} from "../analytics/funnel";
import { devLog } from "./devDiagnostics";

const LAUNCH_HOOK = "day2_launch";

function launchMeta(extra = {}) {
  return {
    metadata: {
      launchHook: LAUNCH_HOOK,
      ...extra,
    },
  };
}

export function trackLaunchDealerAssistance(payload = {}) {
  trackBuyerEvent(BUYER_EVENTS.LEAD_CTA_INITIATED, {
    ctaType: "dealer_assistance",
    sourcePage: payload.sourcePage || "",
    ...launchMeta({ surface: payload.surface || "dealer" }),
    ...payload,
  });
  trackCtaClicked({
    ctaType: "dealer_assistance",
    sourcePage: payload.sourcePage,
    label: payload.surface,
  });
  devLog("launch:dealer_assistance", payload);
}

export function trackLaunchEmiInteraction(payload = {}) {
  trackBuyerEvent(BUYER_EVENTS.PRICING_INTERACTION, {
    sourcePage: payload.sourcePage || "",
    ...launchMeta({
      interaction: payload.action || "emi_slider",
      ...payload,
    }),
    ...payload,
  });
  trackCtaClicked({
    ctaType: "emi_interaction",
    sourcePage: payload.sourcePage,
    label: payload.action,
  });
  devLog("launch:emi", payload);
}

export function trackLaunchCompareCta(payload = {}) {
  const slugs = payload.vehicleSlugs || [];

  trackBuyerEvent(BUYER_EVENTS.LEAD_CTA_INITIATED, {
    ctaType: "compare_cta",
    sourcePage: payload.sourcePage || "compare",
    vehicleSlugs: slugs,
    ...launchMeta({ headline: payload.headline }),
    ...payload,
  });
  trackCompareCtaClicked({
    sourcePage: payload.sourcePage || "compare",
    headline: payload.headline,
    vehicleSlugs: slugs,
  });
  devLog("launch:compare_cta", payload);
}

export function trackLaunchWhatsAppCta(payload = {}) {
  trackBuyerEvent(BUYER_EVENTS.WHATSAPP_LEAD_CLICKED, {
    sourcePage: payload.sourcePage || "",
    vehicleSlugs: payload.vehicleSlugs || [],
    ...launchMeta({ intent: payload.intent }),
    ...payload,
  });
  trackCtaClicked({
    ctaType: "whatsapp",
    sourcePage: payload.sourcePage,
  });
  devLog("launch:whatsapp", payload);
}

export function trackLaunchLeadFormSubmit(payload = {}) {
  const formType = payload.formType || "inquiry";

  trackBuyerEvent(BUYER_EVENTS.LEAD_SUBMITTED, {
    sourcePage: payload.sourcePage || "",
    vehicleSlugs: payload.vehicleSlugs || [],
    ...launchMeta({ formType }),
    ...payload,
  });
  trackLeadSubmitted({
    sourcePage: payload.sourcePage,
    formType,
    familySlug: payload.familySlug,
    variantSlug: payload.variantSlug,
  });
  devLog("launch:lead_submit", payload);
}

export function trackFinanceHelpCta(payload = {}) {
  const variantSlug = String(payload.variantSlug || "").trim();
  const carSlug = String(payload.carSlug || payload.familySlug || "").trim();

  trackBuyerEvent("finance_help_cta_clicked", {
    sourcePage: payload.sourcePage || "car_details",
    intent: "finance_help",
    vehicleSlugs: variantSlug ? [variantSlug] : carSlug ? [carSlug] : [],
    metadata: {
      launchHook: LAUNCH_HOOK,
      source: payload.source || "",
      familySlug: payload.familySlug || "",
      variantSlug,
      carSlug,
    },
  });
  trackCtaClicked({
    ctaType: "finance_help",
    sourcePage: payload.sourcePage || "car_details",
  });
  devLog("launch:finance_help_cta", payload);
}

export function trackLaunchCompareStarted(payload = {}) {
  trackBuyerEvent(BUYER_EVENTS.COMPARE_STARTED, payload);
  trackCompareStarted({
    vehicleSlugs: payload.vehicleSlugs,
    sourcePage: payload.sourcePage,
    compareDepth: payload.compareDepth,
  });
}

export function trackLaunchCompareCompleted(payload = {}) {
  trackBuyerEvent(BUYER_EVENTS.COMPARE_COMPLETED, payload);
  trackCompareCompleted({
    vehicleSlugs: payload.vehicleSlugs,
    sourcePage: payload.sourcePage,
  });
}

export function trackLaunchEvViewed(payload = {}) {
  trackBuyerEvent(BUYER_EVENTS.DETAIL_PAGE_VIEWED, payload);
  trackEvViewed({
    familySlug: payload.familySlug,
    variantSlug: payload.variantSlug,
    sourcePage: payload.sourcePage,
    brand: payload.brand,
  });
}

export function trackLaunchLeadFormOpen(payload = {}) {
  trackLeadFormOpened({
    sourcePage: payload.sourcePage,
    formType: payload.formType,
    familySlug: payload.familySlug,
  });
  trackLeadStarted({
    sourcePage: payload.sourcePage,
    formType: payload.formType,
    familySlug: payload.familySlug,
  });
}

