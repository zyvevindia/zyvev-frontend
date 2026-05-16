/**
 * Deterministic schema.org builders — no fake ratings or reviews.
 */

import { SITE_ORIGIN } from "../config";

import { canonicalVehicleUrl } from "./vehicleRoutes";

import { canonicalSeoPageUrl } from "./seoRoutes";

/**
 * schema.org Vehicle (aligned with canonical URL).
 */
export function buildVehicleSchema({
  name,
  brand,
  description,
  images = [],
  priceInr,
  slug,
  sku,
  siteOrigin = SITE_ORIGIN,
}) {
  const url = canonicalVehicleUrl(slug, siteOrigin);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name,
    description: description || `${name} — electric vehicle on EVSavari`,
    url,
    image: images.filter(Boolean),
    brand: {
      "@type": "Brand",
      name: brand || "EV",
    },
  };

  if (sku) schema.sku = String(sku);

  if (priceInr != null && priceInr > 0) {
    schema.offers = {
      "@type": "Offer",
      priceCurrency: "INR",
      price: priceInr,
      availability: "https://schema.org/InStock",
      url,
      seller: {
        "@type": "Organization",
        name: "EVSavari",
      },
    };
  }

  return schema;
}

export function buildBreadcrumbSchema(items, siteOrigin = SITE_ORIGIN) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url.startsWith("http")
        ? item.url
        : `${siteOrigin}${item.url}`,
    })),
  };
}

export function buildFaqPageSchema(faqItems, pageUrl) {
  if (!faqItems?.length || !pageUrl) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
    url: pageUrl,
  };
}

/**
 * Compare hub — ItemList of compared vehicles (no ranking claims).
 */
export function buildCompareItemListSchema(cars, siteOrigin = SITE_ORIGIN) {
  if (!cars?.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "EV comparison selection",
    url: `${siteOrigin}/compare`,
    numberOfItems: cars.length,
    itemListElement: cars.map((car, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Vehicle",
        name: car.name || car.slug,
        url: car.slug
          ? canonicalVehicleUrl(car.slug, siteOrigin)
          : `${siteOrigin}/cars`,
      },
    })),
  };
}

export function buildSeoGuideBreadcrumbs(seoPage, siteOrigin = SITE_ORIGIN) {
  const canonical =
    seoPage.canonicalUrl ||
    canonicalSeoPageUrl(seoPage.slug, siteOrigin);

  return buildBreadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: "Electric Cars", url: "/cars" },
      { name: seoPage.title?.replace(/ \| EVSavari$/, "") || "Guide", url: canonical },
    ],
    siteOrigin
  );
}
