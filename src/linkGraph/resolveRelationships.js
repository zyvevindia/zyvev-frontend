/**
 * Relationship resolvers — read-only, registry-driven.
 */

import { resolveCompareDiscoveryHref } from "./compareHref.js";
import {
  buildComparePairSlug,
  normalizeVehicleSlug,
} from "./slugUtils.js";
import { buildDetailAuthorityLinks } from "../content/authority/internalLinks.js";
import { LINK_RELATIONSHIP_TYPES } from "./types.js";
import {
  brandNameToSlug,
  getBuyingGuideTopics,
  getChargingGuideTopics,
  getCitySlugs,
  citySlugToLabel,
  getCompareGuideSlugs,
  getOwnershipGuideTopics,
  getRegisteredBrandLandings,
  getRegisteredPriceLandings,
  getRegisteredUseCaseLandings,
  resolvePriceLandingSlugsForPrice,
} from "./registries.js";

function vehiclePath(slug) {
  return `/cars/${slug}`;
}

function slugToLabel(slug) {
  return String(slug || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function brandLinks(context, { limit = 8 } = {}) {
  const currentSlug = context.slug;
  return getRegisteredBrandLandings()
    .filter((b) => b.slug !== currentSlug)
    .slice(0, limit)
    .map((b, index) => ({
      label: `${b.label} EVs`,
      href: `/brands/${b.slug}`,
      slug: b.slug,
      relationshipType: LINK_RELATIONSHIP_TYPES.BRAND,
      score: 90 - index,
    }));
}

function priceSegmentLinks(context, { limit = 6 } = {}) {
  const currentSlug = context.slug;
  const priceSlugs =
    context.pageFamily === "vehicle" && context.priceInr > 0
      ? resolvePriceLandingSlugsForPrice(context.priceInr)
      : getRegisteredPriceLandings().map((d) => d.slug);

  return getRegisteredPriceLandings()
    .filter((d) => priceSlugs.includes(d.slug) && d.slug !== currentSlug)
    .slice(0, limit)
    .map((d, index) => ({
      label: d.linkLabel || d.h1.replace(/^Best /i, ""),
      href: `/best-evs/${d.slug}`,
      slug: d.slug,
      relationshipType: LINK_RELATIONSHIP_TYPES.PRICE_SEGMENT,
      score: 85 - index,
    }));
}

function useCaseLinks(context, { limit = 6 } = {}) {
  const currentSlug = context.slug;
  const scores = context.catalogMeta?.suitabilityScores || {};
  const sub = context.evIntelligence?.scores || {};

  const preferred = [];
  if ((scores.city ?? sub.cityUsability ?? 0) >= 65) preferred.push("city");
  if ((scores.family ?? 0) >= 65) preferred.push("family");
  if ((scores.highway ?? sub.highwayUsability ?? 0) >= 65) preferred.push("highway");
  if (context.priceInr > 0 && context.priceInr <= 1_500_000) preferred.push("budget");
  if ((sub.chargingConvenience ?? 0) >= 70) preferred.push("fast-charging");
  if ((scores.highway ?? sub.highwayUsability ?? 0) >= 75) preferred.push("long-range", "highway");

  const orderedSlugs = [
    ...preferred,
    ...getRegisteredUseCaseLandings().map((d) => d.slug),
  ];

  const seen = new Set();
  const links = [];
  for (const slug of orderedSlugs) {
    if (slug === currentSlug || seen.has(slug)) continue;
    const def = getRegisteredUseCaseLandings().find((d) => d.slug === slug);
    if (!def) continue;
    seen.add(slug);
    links.push({
      label: def.linkLabel || def.h1.replace(/^Best /i, ""),
      href: `/best-evs/${slug}`,
      slug,
      relationshipType: LINK_RELATIONSHIP_TYPES.USE_CASE,
      score: preferred.includes(slug) ? 88 : 70 - links.length,
    });
    if (links.length >= limit) break;
  }
  return links;
}

function vehicleLinks(context, { limit = 6 } = {}) {
  const current = context.familySlug || context.slug;
  const links = [];

  for (const rival of context.compareRivals || []) {
    if (rival === current) continue;
    links.push({
      label: slugToLabel(rival),
      href: vehiclePath(rival),
      slug: rival,
      relationshipType: LINK_RELATIONSHIP_TYPES.VEHICLE,
      score: 92,
    });
  }

  if (context.peerFamilies?.length) {
    for (const peer of context.peerFamilies) {
      const slug = normalizeVehicleSlug(peer.familySlug);
      if (!slug || slug === current) continue;
      links.push({
        label: peer.name || slugToLabel(slug),
        href: vehiclePath(slug),
        slug,
        relationshipType: LINK_RELATIONSHIP_TYPES.VEHICLE,
        score: 75,
      });
    }
  }

  return links.slice(0, limit);
}

function compareGuideMatchesFamily(guideSlug, familySlug) {
  const family = normalizeVehicleSlug(familySlug);
  if (!family || !guideSlug) return false;
  if (guideSlug.includes(family)) return true;
  const parts = String(guideSlug).split("-vs-");
  return parts.some((part) => part && (family.includes(part) || part.includes(family)));
}

function compareLinks(context, { limit = 8 } = {}) {
  const seen = new Set();
  const links = [];
  const contextSlugs = [
    ...(context.compareSlugs || []),
    context.familySlug,
    ...(context.compareRivals || []),
  ]
    .map(normalizeVehicleSlug)
    .filter(Boolean);

  const pushPair = (slugA, slugB, label, score = 80) => {
    const a = normalizeVehicleSlug(slugA);
    const b = normalizeVehicleSlug(slugB);
    if (!a || !b || a === b) return;
    const built = buildComparePairSlug(a, b);
    const key = built || `${a}|${b}`;
    if (seen.has(key)) return;
    seen.add(key);
    const href = resolveCompareDiscoveryHref(a, b);
    links.push({
      label: label || `${slugToLabel(a)} vs ${slugToLabel(b)}`,
      href,
      slug: built || key,
      relationshipType: LINK_RELATIONSHIP_TYPES.COMPARE,
      score,
    });
  };

  if (contextSlugs.length >= 2) {
    for (let i = 0; i < contextSlugs.length; i += 1) {
      for (let j = i + 1; j < contextSlugs.length; j += 1) {
        pushPair(contextSlugs[i], contextSlugs[j], null, 95);
      }
    }
  }

  if (contextSlugs.length === 1) {
    const current = contextSlugs[0];
    for (const guideSlug of getCompareGuideSlugs()) {
      if (links.length >= limit) break;
      if (compareGuideMatchesFamily(guideSlug, current)) {
        const [left, right] = guideSlug.split("-vs-");
        pushPair(left, right, slugToLabel(guideSlug.replace(/-vs-/g, " vs ")), 90);
      }
    }
  }

  for (const guideSlug of getCompareGuideSlugs()) {
    if (links.length >= limit) break;
    const [left, right] = guideSlug.split("-vs-");
    if (!left || !right) continue;
    pushPair(left, right, slugToLabel(guideSlug.replace(/-vs-/g, " vs ")), 70);
  }

  return links.slice(0, limit);
}

function guideTopicLinks(topics, relationshipType, { limit = 4 } = {}) {
  return topics.slice(0, limit).map((topic, index) => ({
    label: topic.title,
    href: topic.canonicalPath,
    slug: topic.id,
    relationshipType,
    score: 78 - index,
  }));
}

function buyingGuideLinks(_context, options = {}) {
  return guideTopicLinks(getBuyingGuideTopics(), LINK_RELATIONSHIP_TYPES.BUYING_GUIDE, options);
}

function ownershipGuideLinks(_context, options = {}) {
  return guideTopicLinks(
    getOwnershipGuideTopics(),
    LINK_RELATIONSHIP_TYPES.OWNERSHIP_GUIDE,
    options
  );
}

function chargingGuideLinks(_context, options = {}) {
  return guideTopicLinks(
    getChargingGuideTopics(),
    LINK_RELATIONSHIP_TYPES.CHARGING_GUIDE,
    options
  );
}

function browseLinks() {
  return [
    {
      label: "Browse all EVs",
      href: "/cars",
      relationshipType: LINK_RELATIONSHIP_TYPES.BROWSE,
      score: 80,
    },
    {
      label: "Compare EVs",
      href: "/compare",
      relationshipType: LINK_RELATIONSHIP_TYPES.BROWSE,
      score: 78,
    },
  ];
}

function guidesHubLinks() {
  return [
    {
      label: "EV buying & ownership guides",
      href: "/guides",
      relationshipType: LINK_RELATIONSHIP_TYPES.GUIDES_HUB,
      score: 82,
    },
  ];
}

function cityLinks(context, { limit = 6 } = {}) {
  const currentCity = context.slug?.match(/^city-(.+?)-(evs|charging)$/)?.[1];
  return getCitySlugs()
    .filter((city) => city !== currentCity)
    .slice(0, limit)
    .map((city, index) => ({
      label: `EVs in ${citySlugToLabel(city)}`,
      href: `/cities/${city}/evs`,
      slug: city,
      relationshipType: LINK_RELATIONSHIP_TYPES.CITY,
      score: 72 - index,
    }));
}

function vehicleBrandLink(context) {
  const brand = context.brand;
  if (!brand) return [];
  const slug = brandNameToSlug(brand);
  const registered = getRegisteredBrandLandings().find((b) => b.slug === slug);
  if (!registered) return [];
  return [
    {
      label: `${registered.label} EVs`,
      href: `/brands/${slug}`,
      slug,
      relationshipType: LINK_RELATIONSHIP_TYPES.BRAND,
      score: 96,
    },
  ];
}

function vehicleAuthorityGuideLinks(context, { limit = 5 } = {}) {
  const rows = buildDetailAuthorityLinks({
    evIntelligence: context.evIntelligence,
    catalogMeta: context.catalogMeta,
    familySlug: context.familySlug,
  });
  return rows.slice(0, limit).map((row, index) => ({
    label: row.label,
    href: row.href,
    slug: row.href,
    relationshipType:
      row.cluster === "charging_guides"
        ? LINK_RELATIONSHIP_TYPES.CHARGING_GUIDE
        : LINK_RELATIONSHIP_TYPES.OWNERSHIP_GUIDE,
    score: 86 - index,
  }));
}

/** @type {Record<string, (ctx: import('./types.js').LinkGraphPageContext, opts?: object) => import('./types.js').LinkGraphNode[]>} */
export const RELATIONSHIP_RESOLVERS = {
  [LINK_RELATIONSHIP_TYPES.BRAND]: (ctx, opts) => {
    if (ctx.pageFamily === "vehicle") return vehicleBrandLink(ctx);
    return brandLinks(ctx, opts);
  },
  [LINK_RELATIONSHIP_TYPES.PRICE_SEGMENT]: priceSegmentLinks,
  [LINK_RELATIONSHIP_TYPES.USE_CASE]: useCaseLinks,
  [LINK_RELATIONSHIP_TYPES.VEHICLE]: vehicleLinks,
  [LINK_RELATIONSHIP_TYPES.COMPARE]: compareLinks,
  [LINK_RELATIONSHIP_TYPES.BUYING_GUIDE]: buyingGuideLinks,
  [LINK_RELATIONSHIP_TYPES.OWNERSHIP_GUIDE]: (ctx, opts) => {
    if (ctx.pageFamily === "vehicle") {
      return vehicleAuthorityGuideLinks(ctx, opts);
    }
    return ownershipGuideLinks(ctx, opts);
  },
  [LINK_RELATIONSHIP_TYPES.CHARGING_GUIDE]: chargingGuideLinks,
  [LINK_RELATIONSHIP_TYPES.BROWSE]: browseLinks,
  [LINK_RELATIONSHIP_TYPES.GUIDES_HUB]: guidesHubLinks,
  /** Future relationship types — empty until configured */
  [LINK_RELATIONSHIP_TYPES.FINANCE]: () => [],
  [LINK_RELATIONSHIP_TYPES.DEALER]: () => [],
  [LINK_RELATIONSHIP_TYPES.OEM]: () => [],
  [LINK_RELATIONSHIP_TYPES.CITY]: cityLinks,
  [LINK_RELATIONSHIP_TYPES.EDITORIAL]: () => [],
  [LINK_RELATIONSHIP_TYPES.NEWS]: () => [],
  [LINK_RELATIONSHIP_TYPES.VIDEO]: () => [],
  [LINK_RELATIONSHIP_TYPES.REVIEW]: () => [],
};

/**
 * @param {import('./types.js').LinkGraphPageContext} context
 * @param {string} relationshipType
 * @param {object} [options]
 */
export function resolveRelationship(context, relationshipType, options = {}) {
  const resolver = RELATIONSHIP_RESOLVERS[relationshipType];
  if (!resolver) return [];
  return resolver(context, options) || [];
}
