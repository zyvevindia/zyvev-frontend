/**
 * Resolve vehicle display fields for assistant cards (browser-safe).
 */

import { loadGeneratedVerifiedDossier } from "../data/catalog/generated/index.js";
import { formatIndianPriceCompact } from "../utils/formatIndianPrice.js";
import { LOCAL_FALLBACK_EV } from "../config/media.js";

/**
 * @param {string} vehicleSlug
 * @returns {{
 *   vehicleSlug: string,
 *   displayName: string,
 *   imageUrl: string,
 *   priceInr: number|null,
 *   priceLabel: string,
 * }}
 */
export function resolveAssistantVehicleDisplay(vehicleSlug) {
  const slug = String(vehicleSlug || "").trim().toLowerCase();
  const dossier = loadGeneratedVerifiedDossier(slug);
  const variants = dossier?.variants || [];
  const prices = variants
    .map((variant) => Number(variant.priceInr || 0))
    .filter((price) => price > 0);
  const priceInr = prices.length ? Math.min(...prices) : null;

  const imageUrl =
    dossier?.media?.listingImage ||
    dossier?.media?.heroImage ||
    LOCAL_FALLBACK_EV;

  const displayName =
    dossier?.displayName || dossier?.familyName || slug.replace(/-/g, " ");

  return {
    vehicleSlug: slug,
    displayName,
    imageUrl,
    priceInr,
    priceLabel: priceInr ? `From ${formatIndianPriceCompact(priceInr)}` : "Price on request",
  };
}
