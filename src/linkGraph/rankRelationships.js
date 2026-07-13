/**
 * Rank, dedupe, and group link graph nodes.
 */

import { LINK_RELATIONSHIP_TYPES } from "./types.js";

const GROUP_TITLES = Object.freeze({
  [LINK_RELATIONSHIP_TYPES.BRAND]: "Related brands",
  [LINK_RELATIONSHIP_TYPES.PRICE_SEGMENT]: "Price segments",
  [LINK_RELATIONSHIP_TYPES.USE_CASE]: "Use cases",
  [LINK_RELATIONSHIP_TYPES.VEHICLE]: "Related vehicles",
  [LINK_RELATIONSHIP_TYPES.COMPARE]: "Popular comparisons",
  [LINK_RELATIONSHIP_TYPES.BUYING_GUIDE]: "Buying guides",
  [LINK_RELATIONSHIP_TYPES.OWNERSHIP_GUIDE]: "Ownership guides",
  [LINK_RELATIONSHIP_TYPES.CHARGING_GUIDE]: "Charging guides",
  [LINK_RELATIONSHIP_TYPES.BROWSE]: "Browse",
  [LINK_RELATIONSHIP_TYPES.GUIDES_HUB]: "Guides",
  [LINK_RELATIONSHIP_TYPES.FINANCE]: "Finance",
  [LINK_RELATIONSHIP_TYPES.DEALER]: "Dealers",
  [LINK_RELATIONSHIP_TYPES.OEM]: "OEM",
  [LINK_RELATIONSHIP_TYPES.CITY]: "Cities",
  [LINK_RELATIONSHIP_TYPES.EDITORIAL]: "Editorial",
  [LINK_RELATIONSHIP_TYPES.NEWS]: "News",
  [LINK_RELATIONSHIP_TYPES.VIDEO]: "Videos",
  [LINK_RELATIONSHIP_TYPES.REVIEW]: "Reviews",
});

/**
 * @param {import('./types.js').LinkGraphNode[]} nodes
 * @param {string} [currentPath]
 */
export function dedupeLinkNodes(nodes, currentPath = "") {
  const normPath = (href) => String(href || "").split("?")[0].replace(/\/$/, "");
  const current = normPath(currentPath);
  const seen = new Set();
  const out = [];

  const sorted = [...nodes].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  for (const node of sorted) {
    const key = normPath(node.href);
    if (!key || key === current || seen.has(key)) continue;
    seen.add(key);
    out.push(node);
  }

  return out;
}

/**
 * @param {Record<string, import('./types.js').LinkGraphNode[]>} byType
 * @param {import('./types.js').LinkGraphPageContext} context
 * @param {object} [options]
 */
export function rankAndGroupRelationships(byType, context, options = {}) {
  const maxPerGroup = options.maxPerGroup ?? 6;
  const maxGroups = options.maxGroups ?? 6;
  const currentPath = context.path || "";

  /** @type {import('./types.js').LinkGraphGroup[]} */
  const groups = [];

  for (const [relationshipType, nodes] of Object.entries(byType)) {
    const deduped = dedupeLinkNodes(nodes, currentPath).slice(0, maxPerGroup);
    if (!deduped.length) continue;

    groups.push({
      id: relationshipType,
      title: GROUP_TITLES[relationshipType] || relationshipType,
      links: deduped,
    });
  }

  return groups.slice(0, maxGroups);
}

/**
 * Remove duplicate hrefs across groups (keep first/highest-scored occurrence).
 * @param {import('./types.js').LinkGraphGroup[]} groups
 * @param {string} [currentPath]
 */
export function dedupeAcrossGroups(groups, currentPath = "") {
  const normPath = (href) => String(href || "").split("?")[0].replace(/\/$/, "");
  const current = normPath(currentPath);
  const seen = new Set();

  return groups
    .map((group) => {
      const links = group.links.filter((link) => {
        const key = normPath(link.href);
        if (!key || key === current || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return links.length ? { ...group, links } : null;
    })
    .filter(Boolean);
}
