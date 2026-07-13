/**
 * Landing Page Framework — configuration types (architecture only).
 * All landing pages are described by registry entries; no page-type JSX branches.
 */

/** @typedef {'brand'|'price'|'use_case'|'city'|'charging'|'finance'|'dealer'|'oem'|'news'|'editorial'|'buying_guide'|'ownership'|'comparison_hub'|'marketplace'|'generic'} LandingPageType */

/**
 * @typedef {object} LandingFilterConfig
 * @property {string} [brand]
 * @property {string} [search]
 * @property {string} [priceRange]
 * @property {string[]} [intelligenceFilterIds]
 * @property {string} [sortBy]
 * @property {number} [limit]
 * @property {boolean} [enableEmptyFallback]
 */

/**
 * @typedef {object} LandingSeoConfig
 * @property {string} [title]
 * @property {string} [description]
 * @property {string} [keywords]
 * @property {string} [robots]
 * @property {string} [ogType]
 * @property {string} [image]
 */

/**
 * @typedef {object} LandingHeroConfig
 * @property {string} [badge]
 * @property {string} [title]
 * @property {string} [subtitle]
 * @property {string} [logoUrl]
 * @property {boolean} [showStats]
 * @property {string} [ctaLabel]
 * @property {string} [ctaHref]
 */

/**
 * @typedef {object} LandingSchemaConfig
 * @property {boolean} [includeWebPage]
 * @property {boolean} [includeItemList]
 * @property {boolean} [includeFaq]
 * @property {boolean} [includeCollectionPage]
 * @property {{ name: string, url: string }[]} [breadcrumbs]
 */

/**
 * @typedef {object} LandingSectionConfig
 * @property {string} id
 * @property {boolean} [enabled]
 * @property {Record<string, unknown>} [props]
 */

/**
 * @typedef {object} LandingInternalLinkGroup
 * @property {string} title
 * @property {{ label: string, href: string }[]} links
 */

/**
 * @typedef {object} LandingFaqItem
 * @property {string} question
 * @property {string} answer
 */

/**
 * @typedef {object} LandingBuyingAdviceSection
 * @property {string} heading
 * @property {string[]} paragraphs
 * @property {string[]} [bullets]
 */

/**
 * @typedef {object} LandingBuyingAdvice
 * @property {string} [title]
 * @property {LandingBuyingAdviceSection[]} sections
 */

/**
 * @typedef {object} LandingPageConfig
 * @property {string} id — stable registry id
 * @property {LandingPageType} type
 * @property {string} slug — URL segment slug
 * @property {string} routeFamily — brands | best-evs | discover | …
 * @property {string} path — canonical path e.g. /brands/tata
 * @property {string} title
 * @property {string} description
 * @property {LandingFilterConfig} [filters]
 * @property {LandingSeoConfig} [seo]
 * @property {LandingSchemaConfig} [schema]
 * @property {LandingHeroConfig} [hero]
 * @property {string} [introTitle]
 * @property {string|string[]} [intro]
 * @property {LandingBuyingAdvice} [buyingAdvice]
 * @property {LandingFaqItem[]} [faq]
 * @property {LandingInternalLinkGroup[]} [internalLinks]
 * @property {LandingSectionConfig[]} [sections]
 * @property {string} [ctaLabel]
 * @property {string} [ctaHref]
 */

export const LANDING_SECTION_IDS = Object.freeze({
  HERO: "hero",
  INTRO: "intro",
  VEHICLE_GRID: "vehicleGrid",
  BUYING_GUIDE: "buyingGuide",
  FAQ: "faq",
  INTERNAL_LINKS: "internalLinks",
  CTA: "cta",
  /** Future extension slots — pluggable via sectionRegistry */
  NEWS: "news",
  VIDEOS: "videos",
  CHARGING: "charging",
  OWNERSHIP: "ownership",
  DEALER_CTA: "dealerCta",
  AI_SUMMARY: "aiSummary",
  EDITORIAL: "editorial",
});

export const DEFAULT_LANDING_SECTIONS = Object.freeze([
  { id: LANDING_SECTION_IDS.HERO, enabled: true },
  { id: LANDING_SECTION_IDS.INTRO, enabled: true },
  { id: LANDING_SECTION_IDS.VEHICLE_GRID, enabled: true },
  { id: LANDING_SECTION_IDS.BUYING_GUIDE, enabled: false },
  { id: LANDING_SECTION_IDS.FAQ, enabled: false },
  { id: LANDING_SECTION_IDS.INTERNAL_LINKS, enabled: false },
  { id: LANDING_SECTION_IDS.CTA, enabled: true },
]);
