/**
 * SEO discovery infrastructure — public API.
 */

export * from "./canonical";
export * from "./meta";
export * from "./schema";
export * from "./qa";
export * from "./registry";
export * from "./slugMap";
export * from "./internalLinks";
export { loadDiscoveryPage } from "./discoveryLoader";
export {
  resolveGuideCanonicalUrl,
  resolveGuideCanonicalPath,
  GUIDE_CONTENT_SLUG_TO_CANONICAL_PATH,
} from "./legacyCanonicalMap";
export {
  buildDiscoveryGuideSitemapEntries,
  buildFullSitemapManifest,
  listExpectedDiscoveryPaths,
} from "./sitemap";
