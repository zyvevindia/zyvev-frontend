/**
 * JSON-LD generators — extends structuredData with article & discovery types.
 */

import { SITE_ORIGIN } from "../config";

export {
  buildVehicleSchema,
  buildBreadcrumbSchema,
  buildFaqPageSchema,
  buildCompareItemListSchema,
  buildSeoGuideBreadcrumbs,
} from "../utils/structuredData";

import { buildBreadcrumbSchema, buildFaqPageSchema } from "../utils/structuredData";

/**
 * Article-style guide (editorial SEO pages).
 */
export function buildArticleSchema({
  headline,
  description,
  url,
  datePublished,
  dateModified,
  siteOrigin = SITE_ORIGIN,
}) {
  if (!headline || !url) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description: description || headline,
    url: url.startsWith("http") ? url : `${siteOrigin}${url}`,
    author: {
      "@type": "Organization",
      name: "EVSavari",
    },
    publisher: {
      "@type": "Organization",
      name: "EVSavari",
      logo: {
        "@type": "ImageObject",
        url: `${siteOrigin}/og-banner.jpg`,
      },
    },
    datePublished: datePublished || "2025-01-01",
    dateModified: dateModified || datePublished || "2025-01-01",
  };
}

/**
 * Ranked vehicle picks on a guide page.
 */
export function buildGuideItemListSchema(
  rankedVehicles = [],
  pageUrl,
  listName = "Recommended electric vehicles"
) {
  if (!rankedVehicles?.length || !pageUrl) return null;

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    url: pageUrl,
    numberOfItems: rankedVehicles.length,
    itemListElement: rankedVehicles.map((vehicle, index) => ({
      "@type": "ListItem",
      position: vehicle.rank || index + 1,
      item: {
        "@type": "Vehicle",
        name: vehicle.displayName || vehicle.slug,
        url: vehicle.detailPath?.startsWith("http")
          ? vehicle.detailPath
          : `${SITE_ORIGIN}${vehicle.detailPath || "/cars"}`,
      },
    })),
  };
}

/**
 * WebPage wrapper for hub / brand / city templates.
 */
export function buildWebPageSchema({
  name,
  description,
  url,
  siteOrigin = SITE_ORIGIN,
}) {
  if (!name || !url) return null;

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url: url.startsWith("http") ? url : `${siteOrigin}${url}`,
    isPartOf: {
      "@type": "WebSite",
      name: "EVSavari",
      url: siteOrigin,
    },
  };
}

export function buildDiscoveryPageSchemas({
  seoPage,
  canonicalUrl,
  breadcrumbs,
}) {
  const schemas = [];

  if (breadcrumbs?.length) {
    schemas.push(buildBreadcrumbSchema(breadcrumbs));
  }

  if (seoPage?.faq?.length) {
    const faq = buildFaqPageSchema(seoPage.faq, canonicalUrl);
    if (faq) schemas.push(faq);
  }

  const article = buildArticleSchema({
    headline: seoPage.title?.replace(/ \| EVSavari$/, ""),
    description: seoPage.metaDescription,
    url: canonicalUrl,
  });
  if (article) schemas.push(article);

  if (seoPage.rankedVehicles?.length) {
    const list = buildGuideItemListSchema(
      seoPage.rankedVehicles,
      canonicalUrl,
      seoPage.title?.replace(/ \| EVSavari$/, "")
    );
    if (list) schemas.push(list);
  }

  return schemas.filter(Boolean);
}
