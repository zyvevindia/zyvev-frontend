/**
 * WhatsApp-first lead deep links with vehicle + city + source context.
 */

import { SITE_ORIGIN, WHATSAPP_SALES_NUMBER } from "../config";
import { trackBuyerEvent } from "../event-tracking/trackBuyerEvent";
import { BUYER_EVENTS } from "../event-tracking/eventTypes";

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
  const lines = [
    "Hi EVSavari — I'd like help with an electric car enquiry.",
  ];

  if (ctx.vehicleName) {
    lines.push(`Vehicle: ${ctx.vehicleName}`);
  }
  if (ctx.vehicleSlug) {
    lines.push(`Model link: ${SITE_ORIGIN}/cars/${ctx.vehicleSlug}`);
  }
  if (ctx.compareSlugs?.length >= 2) {
    lines.push(`Comparing: ${ctx.compareSlugs.join(" vs ")}`);
  }
  if (ctx.city) {
    lines.push(`City: ${ctx.city}`);
  }
  if (ctx.sourcePage) {
    const path = ctx.sourcePage.startsWith("/")
      ? ctx.sourcePage
      : `/${ctx.sourcePage}`;
    lines.push(`Source: ${SITE_ORIGIN}${path}`);
  }

  lines.push("");
  lines.push("(Sent via EVSavari — please confirm on-road price & availability.)");

  return lines.join("\n");
}

export function buildWhatsAppLeadUrl(ctx = {}) {
  const phone = String(WHATSAPP_SALES_NUMBER || "").replace(/\D/g, "");
  if (!phone || phone.length < 10) return null;

  const text = encodeURIComponent(buildWhatsAppLeadMessage(ctx));
  return `https://wa.me/${phone}?text=${text}`;
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
    },
  });

  trackBuyerEvent(BUYER_EVENTS.WHATSAPP_LEAD_CLICKED, {
    sourcePage: ctx.sourcePage || "",
    vehicleSlugs: ctx.vehicleSlug ? [ctx.vehicleSlug] : [],
    metadata: { intent: ctx.intent, city: ctx.city },
  });

  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}

export function isWhatsAppLeadEnabled() {
  const phone = String(WHATSAPP_SALES_NUMBER || "").replace(/\D/g, "");
  return phone.length >= 10;
}
