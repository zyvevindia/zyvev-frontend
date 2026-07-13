/**
 * Landing structured data — extends Sprint 2.1 schema architecture.
 * Supports CollectionPage, Breadcrumb, ItemList today; FAQ/Video/Review hooks for later.
 */

import { SITE_ORIGIN } from "../../config.js";
import {
  buildBreadcrumbSchema,
  buildFaqPageSchema,
} from "../../utils/structuredData.js";
import {
  buildGuideItemListSchema,
  buildWebPageSchema,
} from "../../seo/schema.js";
import { resolveLandingCanonical } from "./landingCanonical.js";

/**
 * schema.org CollectionPage wrapper (no custom invented types).
 */
function buildCollectionPageSchema({ name, description, url, items = [] }) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url,
    mainEntity: items.length
      ? {
          "@type": "ItemList",
          numberOfItems: items.length,
          itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Vehicle",
              name: item.displayName || item.name || item.slug,
              url: item.detailPath?.startsWith("http")
                ? item.detailPath
                : `${SITE_ORIGIN}${item.detailPath || "/cars"}`,
            },
          })),
        }
      : undefined,
  };
}

/**
 * @param {import('../types.js').LandingPageConfig} config
 * @param {object[]} rankedFamilies — catalog filter output
 */
export function buildLandingPageSchemas(config, rankedFamilies = []) {
  const canonicalUrl = resolveLandingCanonical(config);
  const schemaCfg = config.schema || {};
  const schemas = [];

  if (schemaCfg.includeWebPage !== false) {
    const webPage = buildWebPageSchema({
      name: config.title,
      description: config.description,
      url: canonicalUrl,
    });
    if (webPage) schemas.push(webPage);
  }

  if (schemaCfg.includeCollectionPage !== false) {
    const items = rankedFamilies.map((family) => ({
      displayName: family.familyName,
      slug: family.familySlug,
      detailPath: `/cars/${family.familySlug}`,
    }));

    const collection = buildCollectionPageSchema({
      name: config.title,
      description: config.description,
      url: canonicalUrl,
      items,
    });
    if (collection) schemas.push(collection);
  }

  if (schemaCfg.includeItemList !== false && rankedFamilies.length > 0) {
    const itemList = buildGuideItemListSchema(
      rankedFamilies.map((family, index) => ({
        rank: index + 1,
        displayName: family.familyName,
        slug: family.familySlug,
        detailPath: `/cars/${family.familySlug}`,
      })),
      canonicalUrl,
      config.title
    );
    if (itemList) schemas.push(itemList);
  }

  if (schemaCfg.breadcrumbs?.length) {
    schemas.push(buildBreadcrumbSchema(schemaCfg.breadcrumbs));
  }

  if (schemaCfg.includeFaq && config.faq?.length) {
    const faq = buildFaqPageSchema(config.faq, canonicalUrl);
    if (faq) schemas.push(faq);
  }

  return schemas.filter(Boolean);
}

/**
 * Extension hook — future schema types register here without LandingPage changes.
 * @type {Map<string, (config: import('../types.js').LandingPageConfig, context: object) => object|null>}
 */
export const landingSchemaExtensions = new Map();

export function registerLandingSchemaExtension(type, builder) {
  landingSchemaExtensions.set(type, builder);
}

export function buildExtendedLandingSchemas(config, context = {}) {
  const base = buildLandingPageSchemas(config, context.rankedFamilies || []);
  const extra = [];

  for (const builder of landingSchemaExtensions.values()) {
    const schema = builder(config, context);
    if (schema) extra.push(schema);
  }

  return [...base, ...extra];
}
