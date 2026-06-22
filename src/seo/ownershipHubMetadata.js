/**
 * SEO metadata for ownership hub and vehicle index pages.
 */

import { SITE_ORIGIN } from "../config.js";
import {
  OWNERSHIP_HUB_PATH,
  OWNERSHIP_VEHICLE_INDEX_PATH,
} from "../pages/ownership/ownershipHubConstants.js";
import { buildPageMeta } from "./meta.js";

/**
 * @param {string} [siteOrigin]
 * @returns {ReturnType<typeof buildPageMeta>}
 */
export function buildOwnershipHubMeta(siteOrigin = SITE_ORIGIN) {
  const origin = String(siteOrigin).replace(/\/$/, "");
  const title = "EV Ownership Guides and Calculators";
  const description =
    "Understand running costs, ownership costs, petrol savings, and EMI before buying an electric car in India.";

  return buildPageMeta({
    title,
    description,
    canonical: `${origin}${OWNERSHIP_HUB_PATH}`,
    ogType: "website",
    keywords: [
      "EV ownership cost India",
      "electric car running cost",
      "EV EMI calculator",
      "petrol vs EV savings",
      "EV TCO calculator",
    ].join(", "),
    h1: title,
  });
}

/**
 * @param {string} [siteOrigin]
 * @returns {ReturnType<typeof buildPageMeta>}
 */
export function buildOwnershipVehicleIndexMeta(siteOrigin = SITE_ORIGIN) {
  const origin = String(siteOrigin).replace(/\/$/, "");
  const title = "Electric Vehicle Ownership Cost Guides";
  const description =
    "Browse running cost, ownership cost, petrol savings, and EMI estimates for every major EV model family on EVSavari.";

  return buildPageMeta({
    title,
    description,
    canonical: `${origin}${OWNERSHIP_VEHICLE_INDEX_PATH}`,
    ogType: "website",
    keywords: [
      "EV ownership cost by model",
      "electric car running cost India",
      "EV cost per km",
      "EV ownership guides",
    ].join(", "),
    h1: title,
  });
}
