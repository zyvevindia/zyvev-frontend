/**
 * WhatsApp-first lead deep links with vehicle + city + source context.
 */

import { API_URL, SITE_ORIGIN, WHATSAPP_SALES_NUMBER } from "../config";
import { trackBuyerEvent } from "../event-tracking/trackBuyerEvent";
import { BUYER_EVENTS } from "../event-tracking/eventTypes";
import { buildBuyerInquiryTemplate } from "./whatsappOps";
import { getAnonymousSessionId } from "../event-tracking/session";

/**
 * @param {object} ctx
 * @param {string} [ctx.vehicleName]
 * @param {string} [ctx.vehicleSlug]
 * @param {string} [ctx.city]
 * @param {string} [ctx.sourcePage]
 * @param {string} [ctx.intent] - inquiry | test_drive | compare | guide
 * @param {string[]} [ctx.compareSlugs]
 */
export function buildWhatsAppLeadMessage(ctx = {}) {
  const base = buildBuyerInquiryTemplate({
    vehicleName: ctx.vehicleName,
    variantSlug: ctx.variantSlug,
    familySlug: ctx.familySlug,
    city: ctx.city,
    sourcePage: ctx.sourcePage,
    intent: ctx.intent,
  });

  const extras = [];
  if (ctx.vehicleSlug) {
    extras.push(`Model link: ${SITE_ORIGIN}/cars/${ctx.vehicleSlug}`);
  }
  if (ctx.compareSlugs?.length >= 2) {
    extras.push(`Comparing: ${ctx.compareSlugs.join(" vs ")}`);
  }

  return extras.length ? `${base}\n${extras.join("\n")}` : base;
}

export function buildWhatsAppLeadUrl(ctx = {}) {
  const phone = String(WHATSAPP_SALES_NUMBER || "").replace(/\D/g, "");
  if (!phone || phone.length < 10) return null;

  const text = encodeURIComponent(buildWhatsAppLeadMessage(ctx));
  return `https://wa.me/${phone}?text=${text}`;
}

/**
 * Record WhatsApp intent as a lightweight lead (non-blocking).
 */
export function recordWhatsAppLeadIntent(ctx = {}) {
  const payload = {
    sourcePage: ctx.sourcePage || "",
    familySlug: ctx.familySlug || ctx.vehicleSlug || "",
    variantSlug: ctx.variantSlug || "",
    city: ctx.city || "",
    vehicleName: ctx.vehicleName || "",
    anonymousSessionId: getAnonymousSessionId() || "",
    intent: ctx.intent || "inquiry",
    brand: ctx.brand || "",
  };

  fetch(`${API_URL}/api/leads/whatsapp-intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    /* non-blocking */
  });
}

/**
 * Open WhatsApp with prefilled message and track CTA.
 */
export function openWhatsAppLead(ctx = {}) {
  const url = buildWhatsAppLeadUrl(ctx);
  if (!url) return false;

  trackBuyerEvent(BUYER_EVENTS.SEO_CTA_CLICKED, {
    ctaType: "whatsapp_lead",
    sourcePage: ctx.sourcePage || "",
    discoveryPath: ctx.sourcePage || "",
    seoPageSlug: ctx.seoPageSlug || "",
    vehicleSlugs: ctx.vehicleSlug
      ? [ctx.vehicleSlug]
      : ctx.compareSlugs || [],
    metadata: {
      intent: ctx.intent || "inquiry",
      city: ctx.city,
      familySlug: ctx.familySlug,
      variantSlug: ctx.variantSlug,
    },
  });

  trackBuyerEvent(BUYER_EVENTS.WHATSAPP_LEAD_CLICKED, {
    sourcePage: ctx.sourcePage || "",
    vehicleSlugs: ctx.vehicleSlug ? [ctx.vehicleSlug] : [],
    metadata: {
      intent: ctx.intent,
      city: ctx.city,
      familySlug: ctx.familySlug,
      variantSlug: ctx.variantSlug,
    },
  });

  recordWhatsAppLeadIntent(ctx);

  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}

export function isWhatsAppLeadEnabled() {
  const phone = String(WHATSAPP_SALES_NUMBER || "").replace(/\D/g, "");
  return phone.length >= 10;
}
