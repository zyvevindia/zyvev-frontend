/**
 * Memoization for link graph resolution — avoids repeated relationship work.
 */

/** @type {Map<string, import('./types.js').LinkGraphGroup[]>} */
const cache = new Map();

const DEFAULT_MAX = 200;

function stableKey(context, options = {}) {
  return JSON.stringify({
    pageFamily: context.pageFamily,
    slug: context.slug,
    path: context.path,
    brand: context.brand,
    familySlug: context.familySlug,
    priceInr: context.priceInr,
    compareSlugs: context.compareSlugs,
    compareRivals: context.compareRivals,
    maxGroups: options.maxGroups,
    maxPerGroup: options.maxPerGroup,
  });
}

/**
 * @param {import('./types.js').LinkGraphPageContext} context
 * @param {object} options
 * @param {() => import('./types.js').LinkGraphGroup[]} compute
 */
export function getCachedLinkGroups(context, options, compute) {
  const key = stableKey(context, options);
  if (cache.has(key)) {
    return cache.get(key);
  }

  const result = compute();
  if (cache.size >= DEFAULT_MAX) {
    const first = cache.keys().next().value;
    cache.delete(first);
  }
  cache.set(key, result);
  return result;
}

export function __clearLinkGraphCacheForTests() {
  cache.clear();
}
