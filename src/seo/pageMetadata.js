/**
 * Centralized dynamic SEO metadata for all public page types.
 * Returns props compatible with <SEO /> (Helmet).
 */

import { SITE_ORIGIN } from "../config";

import {
  absoluteUrl,
  canonicalCompareGuideUrl,
  canonicalCompareHubUrl,
  canonicalListingUrl,
} from "./canonical";

import { canonicalVehicleUrl } from "../utils/vehicleRoutes";

import {
  buildPageMeta,
  buildGuidePageMeta,
  formatPageTitle,
  stripBrandSuffix,
} from "./meta";

import { normalizePathname } from "./slugs";
import { SEO_CONTENT_YEAR } from "./seoConstants.js";

const DEFAULT_KEYWORDS =
  "electric vehicles India, EV comparison, EV price, EVSavari";

/**
 * Homepage
 */
export function buildHomePageMeta(siteOrigin = SITE_ORIGIN) {
  return buildPageMeta({
    title: `Compare Electric Cars in India (${SEO_CONTENT_YEAR})`,
    description:
      "Research and compare electric cars in India. Side-by-side specs, real-world range estimates, charging times, ownership costs, and buyer guides — updated from the live catalog.",
    canonical: absoluteUrl("/", siteOrigin),
    keywords:
      "EV India, electric cars India, EV comparison, Tata EV, MG EV, Mahindra EV, EV price, EVSavari",
  });
}

/**
 * Vehicle detail — /cars/:familySlug
 */
export function buildVehiclePageMeta({
  name,
  brand,
  overview,
  familySlug,
  image,
  siteOrigin = SITE_ORIGIN,
  metaTitle,
  metaDescription,
}) {
  const displayName = String(name || "Electric vehicle").trim();
  const title =
    metaTitle ||
    `${displayName} — Price, Range, Charging & Variants (${SEO_CONTENT_YEAR})`;

  const description =
    metaDescription ||
    String(overview || "").trim() ||
    `Compare ${displayName} price, certified range, charging time and variants in India. ${brand ? `${brand} ` : ""}EV specs, ownership costs and buyer guides on EVSavari.`;

  const normalizedDescription =
    description.length >= 50
      ? description
      : `${description} Compare price, range, charging and ownership on EVSavari.`.slice(0, 160);

  return buildPageMeta({
    title,
    description: normalizedDescription.slice(0, 160),
    canonical: canonicalVehicleUrl(familySlug, siteOrigin),
    image,
    ogType: "product",
    keywords: [
      displayName,
      brand,
      "electric car price India",
      "EV range",
      "EV charging time",
    ]
      .filter(Boolean)
      .join(", "),
  });
}

/**
 * Interactive compare tool — canonical always /compare (session state not indexed).
 */
export function buildCompareToolMeta({
  cars = [],
  siteOrigin = SITE_ORIGIN,
}) {
  const hub = canonicalCompareHubUrl(siteOrigin);

  if (cars.length >= 2) {
    const names = cars
      .map((c) => String(c?.name || c?.slug || "").trim())
      .filter(Boolean);

    const title =
      names.length >= 2
        ? `${names[0]} vs ${names.slice(1).join(" vs ")} Comparison`
        : "Compare Electric Vehicles";

    const description = `Side-by-side comparison of ${names.join(", ")} — battery range, price, charging and specifications on EVSavari.`;

    return buildPageMeta({
      title,
      description,
      canonical: hub,
      ogType: "website",
    });
  }

  return buildPageMeta({
    title: "Compare Electric Vehicles",
    description:
      "Compare electric cars, scooters and bikes side-by-side including battery range, pricing, charging and specifications.",
    canonical: hub,
    keywords: "EV comparison India, compare electric cars, EV specs",
  });
}

/**
 * Editorial compare guide — /compare/:slug
 */
export function buildCompareGuidePageMeta(seoPage, canonicalUrl) {
  const baseTitle = stripBrandSuffix(seoPage?.title || "EV comparison");
  const title = baseTitle.toLowerCase().includes("comparison")
    ? baseTitle
    : `${baseTitle} Comparison`;

  return buildGuidePageMeta(
    {
      ...seoPage,
      title,
    },
    canonicalUrl
  );
}

/**
 * Listing hubs — /cars, /popular, /bikes, etc.
 */
export function buildListingPageMeta({
  pathname = "/cars",
  category,
  siteOrigin = SITE_ORIGIN,
}) {
  const normalizedPath = normalizePathname(pathname);
  const canonical = canonicalListingUrl(normalizedPath, siteOrigin);

  const baseDesc =
    "Browse, filter, and compare electric cars, scooters, and bikes in India on EVSavari.";

  const byPath = {
    "/popular": {
      title: "Popular Electric Vehicles",
      description: `Discover trending and best-selling EVs in India. ${baseDesc}`,
    },
    "/latest": {
      title: "Latest Electric Vehicles",
      description: `New arrivals and recently listed electric vehicles. ${baseDesc}`,
    },
    "/upcoming": {
      title: "Upcoming Electric Vehicles",
      description: `Future EV launches and models to watch. ${baseDesc}`,
    },
    "/cars": {
      title: `Browse Electric Cars in India (${SEO_CONTENT_YEAR}) – Filter by Price, Range & Brand`,
      description: `Explore and filter electric cars and SUVs in India by price, range, brand, and charging. ${baseDesc}`,
    },
    "/bikes": {
      title: "Electric Bikes in India",
      description: `Compare electric two-wheelers and e-bikes. ${baseDesc}`,
    },
    "/scooters": {
      title: "Electric Scooters in India",
      description: `Find e-scooters by range, price, and brand. ${baseDesc}`,
    },
  };

  const match = byPath[normalizedPath];

  if (match) {
    return buildPageMeta({
      ...match,
      canonical,
      keywords: DEFAULT_KEYWORDS,
    });
  }

  if (category) {
    const label = String(category)
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    return buildPageMeta({
      title: `${label} — Electric Vehicles`,
      description: `${label} listings on EVSavari. ${baseDesc}`,
      canonical,
    });
  }

  return buildPageMeta({
    title: "Electric Vehicles",
    description: baseDesc,
    canonical,
  });
}

/**
 * Static informational pages
 */
export function buildStaticPageMeta({
  pageTitle,
  title,
  subtitle,
  path,
  siteOrigin = SITE_ORIGIN,
}) {
  const pageLabel = stripBrandSuffix(pageTitle || title || "EVSavari");

  return buildPageMeta({
    title: pageLabel,
    description:
      String(subtitle || "").trim() ||
      `${pageLabel} — EVSavari, India's electric vehicle marketplace.`,
    canonical: absoluteUrl(path, siteOrigin),
    ogType: "website",
  });
}

/**
 * Brand discovery hub
 */
export function buildBrandPageMeta({
  brandName,
  description,
  brandSlug,
  siteOrigin = SITE_ORIGIN,
}) {
  const label = String(brandName || brandSlug || "Brand").trim();

  return buildPageMeta({
    title: `${label} Electric Cars in India (${SEO_CONTENT_YEAR}) – Prices, Range & Charging`,
    description:
      description ||
      `Explore ${label} electric cars and SUVs in India — prices, range, charging, variants, and comparisons on EVSavari.`,
    canonical: absoluteUrl(`/brands/${brandSlug}`, siteOrigin),
    ogType: "website",
  });
}

/**
 * Map buildPageMeta output → <SEO /> props
 */
export function metaToSeoProps(meta) {
  if (!meta) {
    return {};
  }

  return {
    title: meta.title,
    description: meta.description,
    canonical: meta.canonical,
    keywords: meta.keywords,
    robots: meta.robots,
    image: meta.image,
    type: meta.ogType || "website",
  };
}

export { formatPageTitle, buildGuidePageMeta, canonicalCompareGuideUrl };
