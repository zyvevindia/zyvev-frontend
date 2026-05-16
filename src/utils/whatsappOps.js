/**
 * WhatsApp operational templates — buyer inquiry, dealer handoff, ops context.
 */

import { SITE_ORIGIN } from "../config";

export const WHATSAPP_TEMPLATES = {
  buyerInquiry: "buyer_inquiry",
  dealerHandoff: "dealer_handoff",
  dealerContact: "dealer_contact",
  followUp: "follow_up",
};

/**
 * Prefilled message when a dealer contacts an assigned lead.
 */
export function buildDealerLeadHandoffMessage(lead = {}, dealer = {}) {
  const vehicle =
    lead.vehicleName || lead.carId?.name || "the EV you enquired about";
  const lines = [
    `Hello ${lead.name || "there"},`,
    "",
    `Thank you for your interest in ${vehicle} on EVSavari.`,
    `I'm ${dealer.name || "your assigned dealer partner"} — happy to help with on-road price, availability, and test drive.`,
  ];

  if (lead.city) lines.push(`Your city: ${lead.city}`);
  if (lead.variantSlug || lead.familySlug) {
    lines.push(
      `Variant: ${[lead.familySlug, lead.variantSlug].filter(Boolean).join(" / ")}`
    );
  }
  if (lead.sourcePage) {
    const path = lead.sourcePage.startsWith("/")
      ? lead.sourcePage
      : `/${lead.sourcePage}`;
    lines.push(`Enquiry from: ${SITE_ORIGIN}${path}`);
  }
  if (lead.leadSource) {
    lines.push(`Channel: ${lead.leadSource}`);
  }

  lines.push("");
  lines.push("— Sent via EVSavari dealer operations");

  return lines.join("\n");
}

/**
 * Message for buyer → dealer / sales WhatsApp CTA.
 */
export function buildBuyerInquiryTemplate(ctx = {}) {
  const lines = [
    "Hi EVSavari — I'd like help with an electric car enquiry.",
  ];
  if (ctx.vehicleName) lines.push(`Vehicle: ${ctx.vehicleName}`);
  if (ctx.variantSlug) lines.push(`Variant: ${ctx.variantSlug}`);
  if (ctx.familySlug) lines.push(`Family: ${ctx.familySlug}`);
  if (ctx.city) lines.push(`City: ${ctx.city}`);
  if (ctx.sourcePage) {
    const path = ctx.sourcePage.startsWith("/") ? ctx.sourcePage : `/${ctx.sourcePage}`;
    lines.push(`Source: ${SITE_ORIGIN}${path}`);
  }
  if (ctx.intent) lines.push(`Intent: ${ctx.intent}`);
  lines.push("");
  lines.push("(EVSavari — editorial guides, verified dealer handoff.)");
  return lines.join("\n");
}

export function buildDealerContactMessage(dealer = {}, ctx = {}) {
  const lines = [
    `Hi ${dealer.name || "EVSavari team"},`,
    "I'd like to connect regarding a dealer partnership / lead handoff.",
  ];
  if (ctx.city) lines.push(`City: ${ctx.city}`);
  if (ctx.brands?.length) lines.push(`Brands: ${ctx.brands.join(", ")}`);
  return lines.join("\n");
}

export function openWhatsAppChat(phone, message) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 10) return false;
  const normalized = digits.length === 10 ? `91${digits}` : digits;
  const url = `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}

export function openDealerLeadWhatsApp(lead, dealer = {}) {
  return openWhatsAppChat(
    lead.phone,
    buildDealerLeadHandoffMessage(lead, dealer)
  );
}
