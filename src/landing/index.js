/**
 * Landing Page Framework — public API (Sprint 2.2).
 */

export { default as LandingPage } from "./LandingPage.jsx";
export { default as LandingRouter } from "./LandingRouter.jsx";
export { default as LandingNotFound } from "./LandingNotFound.jsx";
export { default as LandingPageLayout } from "./layout/LandingPageLayout.jsx";

export {
  registerLandingPage,
  resolveLandingConfig,
  listLandingPages,
  getLandingRegistrySize,
} from "./landingRegistry.js";

export {
  LANDING_ROUTE_FAMILIES,
  LANDING_ROUTE_CONFIG,
  buildLandingPath,
} from "./landingRouteConfig.js";

export { applyLandingCatalogFilter } from "./filters/landingFilter.js";
export { default as useLandingCatalog } from "./hooks/useLandingCatalog.js";

export { buildLandingPageMeta } from "./seo/landingMetadata.js";
export { resolveLandingCanonical } from "./seo/landingCanonical.js";
export {
  buildLandingPageSchemas,
  buildExtendedLandingSchemas,
  registerLandingSchemaExtension,
} from "./seo/landingSchema.js";

export {
  resolveLandingInternalLinks,
  registerLandingLinkResolver,
  LANDING_LINK_DOMAINS,
} from "./links/landingLinkGraph.js";

export {
  LANDING_SECTION_IDS,
  DEFAULT_LANDING_SECTIONS,
} from "./types.js";

export {
  registerLandingSectionComponent,
  LANDING_SECTION_COMPONENTS,
  LANDING_SECTION_EXTENSION_SLOTS,
} from "./sections/sectionRegistry.js";

export {
  registerBrandLandingPages,
  buildBrandLandingConfig,
  getBrandLandingDefinitions,
} from "./config/buildBrandLandingConfig.js";

export {
  registerPriceLandingPages,
  registerUseCaseLandingPages,
  buildBestEvsLandingConfig,
  getPriceLandingDefinitions,
  getUseCaseLandingDefinitions,
} from "./config/buildBestEvsLandingConfig.js";

export { BRAND_LANDING_DEFINITIONS } from "./config/brandLandingDefinitions.js";
export { PRICE_LANDING_DEFINITIONS } from "./config/priceLandingDefinitions.js";
export { USE_CASE_LANDING_DEFINITIONS } from "./config/useCaseLandingDefinitions.js";
