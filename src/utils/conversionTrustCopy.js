/**
 * Trust-oriented CTA and conversion framing — no aggressive sales tone.
 */

/** Compare hub primary callback label */
export const COMPARE_CALLBACK_LABEL = "Request a dealer callback";

/** WhatsApp — practical, not salesy */
export const WHATSAPP_CTA_LABEL = "Chat on WhatsApp";

export const WHATSAPP_CTA_HINT =
  "Opens WhatsApp with your comparison context when it suits you — no obligation or sales pressure.";

/** Detail page dealer section */
export const DETAIL_CALLBACK_LABEL = "Request dealer callback";
export const DETAIL_PRICING_CTA_LABEL = "Compare on-road quotes";

export function buildCompareToLeadConfidenceNote(compareDepth = 2) {
  if (compareDepth >= 3) {
    return "You have compared several EVs — a callback helps confirm trim, charging access, and on-road price for your city. Read ownership and charging guidance first; there is no obligation on this step.";
  }
  return "A dealer callback can confirm on-road price and charging fit for your situation. Compare calmly first — specs here are directional, not a final quote.";
}

export function buildLeadModalTrustLine() {
  return "Dealers respond with availability and indicative quotes when it suits you — read ownership and charging notes first if helpful. No payment or commitment on this step.";
}

/** Short compare-rail reassurance — calm, readable */
export function buildCompareTrustReassuranceLine() {
  return "Scores are directional to help you compare calmly. Ownership and charging notes below stay practical and up to date for real-world use — read them before any callback; no urgency or obligation.";
}
