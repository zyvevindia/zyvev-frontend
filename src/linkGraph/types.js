/**
 * EVSavari Internal Link Graph — relationship and page-family types.
 * One model for all page families (current and future).
 */

/** @typedef {'home'|'browse'|'brand'|'price'|'use_case'|'vehicle'|'compare'|'guide'|'charging'|'ownership'|'city'|'dealer'|'oem'|'finance'|'editorial'|'news'|'marketplace'|'ai'} LinkPageFamily */

/** @typedef {'brand'|'price_segment'|'use_case'|'vehicle'|'compare'|'buying_guide'|'ownership_guide'|'charging_guide'|'browse'|'guides_hub'|'finance'|'dealer'|'oem'|'city'|'editorial'|'news'|'video'|'review'} LinkRelationshipType */

/**
 * @typedef {object} LinkGraphNode
 * @property {string} label
 * @property {string} href
 * @property {LinkRelationshipType} [relationshipType]
 * @property {number} [score]
 * @property {string} [slug]
 */

/**
 * @typedef {object} LinkGraphGroup
 * @property {string} id
 * @property {string} title
 * @property {LinkGraphNode[]} links
 */

/**
 * @typedef {object} LinkGraphPageContext
 * @property {LinkPageFamily} pageFamily
 * @property {string} [slug]
 * @property {string} [path]
 * @property {string} [brand]
 * @property {string} [familySlug]
 * @property {number} [priceInr]
 * @property {string} [bodyType]
 * @property {string[]} [compareSlugs]
 * @property {string[]} [compareRivals]
 * @property {object} [seoPage]
 * @property {object} [landingConfig]
 * @property {object} [evIntelligence]
 * @property {object} [catalogMeta]
 * @property {Array<{ familySlug: string, name?: string, brand?: string, price?: number, bodyType?: string }>} [peerFamilies]
 */

export const LINK_RELATIONSHIP_TYPES = Object.freeze({
  BRAND: "brand",
  PRICE_SEGMENT: "price_segment",
  USE_CASE: "use_case",
  VEHICLE: "vehicle",
  COMPARE: "compare",
  BUYING_GUIDE: "buying_guide",
  OWNERSHIP_GUIDE: "ownership_guide",
  CHARGING_GUIDE: "charging_guide",
  BROWSE: "browse",
  GUIDES_HUB: "guides_hub",
  FINANCE: "finance",
  DEALER: "dealer",
  OEM: "oem",
  CITY: "city",
  EDITORIAL: "editorial",
  NEWS: "news",
  VIDEO: "video",
  REVIEW: "review",
});

export const LINK_PAGE_FAMILIES = Object.freeze({
  HOME: "home",
  BROWSE: "browse",
  BRAND: "brand",
  PRICE: "price",
  USE_CASE: "use_case",
  VEHICLE: "vehicle",
  COMPARE: "compare",
  GUIDE: "guide",
  CHARGING: "charging",
  OWNERSHIP: "ownership",
  CITY: "city",
  DEALER: "dealer",
  OEM: "oem",
  FINANCE: "finance",
  EDITORIAL: "editorial",
  NEWS: "news",
  MARKETPLACE: "marketplace",
  AI: "ai",
});
