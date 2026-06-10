/**
 * Curated compare pair links for SEO discovery (compare + detail pages).
 */

import { GENERATED_COMPARE_SLUGS } from "../content/generated/manifest";
import {
  buildComparePairSlug,
  compareGuidePath,
  normalizeVehicleSlug,
} from "./slugs";

/** Editorial priority pairs — shown when relevant or as defaults. */
export const CURATED_COMPARE_PAIRS = Object.freeze([
  {
    slugA: "tata-curvv-ev",
    slugB: "mahindra-be-6",
    label: "Curvv EV vs BE 6",
  },
  {
    slugA: "tata-punch-ev",
    slugB: "mg-windsor-ev",
    label: "Punch EV vs Windsor EV",
  },
  {
    slugA: "byd-atto-3",
    slugB: "hyundai-creta-electric",
    label: "Atto 3 vs Creta Electric",
  },
  {
    slugA: "hyundai-ioniq-5",
    slugB: "kia-ev6",
    label: "Ioniq 5 vs EV6",
  },
  {
    slugA: "tata-nexon-ev",
    slugB: "mg-zs-ev",
    label: "Nexon EV vs MG ZS EV",
  },
  {
    slugA: "mahindra-xev-9e",
    slugB: "mahindra-be-6",
    label: "XEV 9e vs BE 6",
  },
  {
    slugA: "kia-ev6",
    slugB: "byd-atto-3",
    label: "EV6 vs Atto 3",
  },
  {
    slugA: "tata-punch-ev",
    slugB: "tata-nexon-ev",
    label: "Punch EV vs Nexon EV",
  },
]);

function slugToShortLabel(slug) {
  return String(slug || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function pairKey(slugA, slugB) {
  const built = buildComparePairSlug(slugA, slugB);
  return built || `${slugA}|${slugB}`;
}

/**
 * Resolve crawlable href for a compare pair.
 * Prefers editorial /compare/:slug when a guide exists; otherwise tool prefill.
 */
export function resolveCompareDiscoveryHref(slugA, slugB) {
  const a = normalizeVehicleSlug(slugA);
  const b = normalizeVehicleSlug(slugB);
  if (!a || !b || a === b) return "/compare";

  const built = buildComparePairSlug(a, b);
  if (built && GENERATED_COMPARE_SLUGS.includes(built)) {
    return compareGuidePath(built);
  }

  return `/compare?cars=${encodeURIComponent(a)},${encodeURIComponent(b)}`;
}

/**
 * Build compare discovery links for a page context.
 * @param {object} [options]
 * @param {string[]} [options.contextSlugs] — slugs on current page (detail or compare)
 * @param {number} [options.limit]
 */
export function buildCompareDiscoveryLinks(options = {}) {
  const contextSlugs = (options.contextSlugs || [])
    .map(normalizeVehicleSlug)
    .filter(Boolean);
  const limit = options.limit ?? 8;
  const seen = new Set();
  const links = [];

  const pushPair = (slugA, slugB, label) => {
    const a = normalizeVehicleSlug(slugA);
    const b = normalizeVehicleSlug(slugB);
    if (!a || !b || a === b) return;

    const key = pairKey(a, b);
    if (seen.has(key)) return;
    seen.add(key);

    links.push({
      slugA: a,
      slugB: b,
      label: label || `${slugToShortLabel(a)} vs ${slugToShortLabel(b)}`,
      href: resolveCompareDiscoveryHref(a, b),
    });
  };

  if (contextSlugs.length >= 2) {
    for (let i = 0; i < contextSlugs.length; i += 1) {
      for (let j = i + 1; j < contextSlugs.length; j += 1) {
        pushPair(contextSlugs[i], contextSlugs[j]);
      }
    }
  }

  if (contextSlugs.length === 1) {
    const current = contextSlugs[0];
    for (const pair of CURATED_COMPARE_PAIRS) {
      if (
        normalizeVehicleSlug(pair.slugA) === current ||
        normalizeVehicleSlug(pair.slugB) === current
      ) {
        pushPair(pair.slugA, pair.slugB, pair.label);
      }
    }
  }

  for (const pair of CURATED_COMPARE_PAIRS) {
    if (links.length >= limit) break;
    pushPair(pair.slugA, pair.slugB, pair.label);
  }

  for (const guideSlug of GENERATED_COMPARE_SLUGS) {
    if (links.length >= limit) break;
    const [left, right] = guideSlug.split("-vs-");
    if (!left || !right) continue;
    pushPair(left, right, slugToShortLabel(guideSlug.replace(/-vs-/g, " vs ")));
  }

  return links.slice(0, limit);
}
