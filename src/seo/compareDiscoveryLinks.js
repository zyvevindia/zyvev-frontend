/**
 * Compare discovery adapter — delegates pair links to the Link Graph Engine.
 */

import { normalizeVehicleSlug } from "./slugs.js";
import { getRelatedPages, buildComparePageContext } from "../linkGraph/index.js";

/** Editorial priority pairs — used by link graph ranking context. */
export const CURATED_COMPARE_PAIRS = Object.freeze([
  { slugA: "tata-nexon-ev", slugB: "mg-zs-ev", label: "Nexon EV vs MG ZS EV" },
  { slugA: "tata-punch-ev", slugB: "tata-nexon-ev", label: "Punch EV vs Nexon EV" },
  { slugA: "kia-ev6", slugB: "byd-atto-3", label: "EV6 vs Atto 3" },
]);

export { resolveCompareDiscoveryHref } from "../linkGraph/compareHref.js";

/**
 * Build compare discovery links for a page context.
 * @param {object} [options]
 */
export function buildCompareDiscoveryLinks(options = {}) {
  const groups = getRelatedPages(
    buildComparePageContext({ contextSlugs: options.contextSlugs }),
    { maxGroups: 2, maxPerGroup: options.limit ?? 8 }
  );

  const compareGroup = groups.find((g) => g.id === "compare") || groups[0];
  const links = compareGroup?.links || [];

  return links.slice(0, options.limit ?? 8).map((link) => {
    const slugParts = String(link.slug || "").split("-vs-");
    return {
      slugA: normalizeVehicleSlug(slugParts[0] || ""),
      slugB: normalizeVehicleSlug(slugParts[1] || ""),
      label: link.label,
      href: link.href,
    };
  });
}
