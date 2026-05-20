import { API_URL } from "../config";
import normalizeCar from "./normalizeCar";
import { normalizeVehicleSlug } from "./vehicleRoutes";
import { fetchVehicleBySlug } from "./vehicleDetailResolver";

/**
 * Ordered family slugs for a compare guide SEO payload.
 * @param {object} seoPage
 * @returns {string[]}
 */
export function extractCompareSlugsFromSeoPage(seoPage) {
  const fromLogic = seoPage?.recommendationLogic?.compareSlugs;
  if (Array.isArray(fromLogic) && fromLogic.length >= 2) {
    return fromLogic.map((s) => normalizeVehicleSlug(s)).filter(Boolean);
  }
  const ranked = seoPage?.rankedVehicles || [];
  return ranked
    .map((v) => normalizeVehicleSlug(v.slug))
    .filter(Boolean);
}

function orderCarsBySlugs(cars, slugOrder) {
  const bySlug = new Map(
    cars.map((c) => [normalizeVehicleSlug(c.slug), c])
  );
  return slugOrder
    .map((s) => bySlug.get(s))
    .filter(Boolean);
}

/**
 * Minimal catalog row when API misses a slug (intelligence still builds).
 */
export function rankedVehicleToCompareCar(ranked) {
  const slug = normalizeVehicleSlug(ranked.slug);
  return normalizeCar({
    _id: slug || ranked.slug,
    slug,
    name: ranked.displayName || slug,
    startingPrice: ranked.exShowroom ?? ranked.startingPrice,
    specifications: {
      range: ranked.claimedRangeKm ?? ranked.range,
    },
  });
}

/**
 * Fetch normalized compare cars for guide slugs (parallel slug API, then catalog scan).
 * @param {string[]} slugOrder
 */
export async function fetchCatalogCarsForCompareSlugs(slugOrder) {
  const slugs = [...new Set(slugOrder.map((s) => normalizeVehicleSlug(s)).filter(Boolean))];
  if (slugs.length < 2) return [];

  const fetched = [];

  if (slugs.length <= 3) {
    const results = await Promise.all(
      slugs.map((slug) => fetchVehicleBySlug(slug))
    );
    for (const row of results) {
      if (row?.vehicle) fetched.push(normalizeCar(row.vehicle));
    }
    if (fetched.length >= 2) {
      return orderCarsBySlugs(fetched, slugs);
    }
  }

  try {
    const res = await fetch(`${API_URL}/cars?limit=120`);
    if (!res.ok) return orderCarsBySlugs(fetched, slugs);
    const data = await res.json();
    const list = (data?.cars || []).map(normalizeCar);
    const want = new Set(slugs);
    const matched = list.filter((c) => want.has(normalizeVehicleSlug(c.slug)));
    const merged = [...fetched];
    for (const c of matched) {
      if (!merged.some((m) => normalizeVehicleSlug(m.slug) === normalizeVehicleSlug(c.slug))) {
        merged.push(c);
      }
    }
    return orderCarsBySlugs(merged, slugs);
  } catch {
    return orderCarsBySlugs(fetched, slugs);
  }
}

/**
 * Merge API catalog rows with ranked SEO stubs (preserve order).
 * @param {object} seoPage
 * @param {object[]} catalogCars
 */
export function mergeRankedWithCatalogCars(seoPage, catalogCars) {
  const order = extractCompareSlugsFromSeoPage(seoPage);
  const ranked = seoPage?.rankedVehicles || [];
  const bySlug = new Map(
    (catalogCars || []).map((c) => [normalizeVehicleSlug(c.slug), c])
  );

  return order
    .map((slug) => {
      const full = bySlug.get(slug);
      if (full) return full;
      const row = ranked.find(
        (v) => normalizeVehicleSlug(v.slug) === slug
      );
      return row ? rankedVehicleToCompareCar(row) : null;
    })
    .filter(Boolean);
}
