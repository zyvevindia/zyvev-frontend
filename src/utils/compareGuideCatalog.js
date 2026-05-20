import { API_URL } from "../config";
import normalizeCar from "./normalizeCar";
import { normalizeVehicleSlug } from "./vehicleRoutes";
import { fetchVehicleBySlug } from "./vehicleDetailResolver";
import {
  aggregateModelFamilies,
  extractFamilySlug,
} from "./modelFamily";
import { pickDefaultVariantForDetail } from "./variantInsights";
import { sanitizeImageUrl } from "./imageUrl";
import { resolveCatalogImageUrl } from "./vehicleMedia";
import { resolveFullDisplayName } from "./vehicleDisplayName";

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
  const byFamily = new Map();
  for (const car of cars) {
    const family = extractFamilySlug(car.slug);
    if (!family) continue;
    const existing = byFamily.get(family);
    if (!existing) {
      byFamily.set(family, car);
      continue;
    }
    const existingName = resolveFullDisplayName(existing);
    const nextName = resolveFullDisplayName(car);
    if (nextName.length > existingName.length) {
      byFamily.set(family, car);
    }
  }
  return slugOrder
    .map((s) => byFamily.get(normalizeVehicleSlug(s)))
    .filter(Boolean);
}

function pickCompareCarForFamily(pool, familySlug) {
  const slug = normalizeVehicleSlug(familySlug);
  if (!slug || !pool?.length) return null;

  const direct = pool.find(
    (c) => normalizeVehicleSlug(c.slug) === slug
  );
  const families = aggregateModelFamilies(pool);
  const family = families.find((f) => f.familySlug === slug);
  if (!family) return direct || null;

  const rep =
    pickDefaultVariantForDetail(family.variants) ||
    family.defaultVariant ||
    family.variants?.[0];
  if (!rep) return direct || null;

  return normalizeCar({
    ...rep,
    familySlug: slug,
  });
}

function applyCompareDisplayName(car, seoPage, familySlug) {
  const ranked = seoPage?.rankedVehicles?.find(
    (v) => normalizeVehicleSlug(v.slug) === normalizeVehicleSlug(familySlug)
  );
  const name = resolveFullDisplayName(car, {
    seoDisplayName: ranked?.displayName,
  });
  const family = normalizeVehicleSlug(familySlug);
  const compareImage = resolveCatalogImageUrl(car, "compare");

  return {
    ...car,
    name,
    fullDisplayName: name,
    familySlug: car.familySlug || family,
    compareThumbnail:
      sanitizeImageUrl(car.compareThumbnail) || compareImage,
    heroImage: sanitizeImageUrl(car.heroImage),
    image: sanitizeImageUrl(car.image) || compareImage,
  };
}

/**
 * Minimal catalog row when API misses a slug (intelligence still builds).
 */
export function rankedVehicleToCompareCar(ranked, seoPage = null) {
  const slug = normalizeVehicleSlug(ranked.slug);
  const stub = normalizeCar({
    _id: slug || ranked.slug,
    slug,
    name: ranked.displayName || slug,
    startingPrice: ranked.exShowroom ?? ranked.startingPrice,
    specifications: {
      range: ranked.claimedRangeKm ?? ranked.range,
    },
  });
  return applyCompareDisplayName(stub, seoPage, slug);
}

async function fetchCatalogPool(slugs) {
  const fetched = [];

  const results = await Promise.all(
    slugs.map((slug) => fetchVehicleBySlug(slug))
  );
  for (const row of results) {
    if (row?.vehicle) fetched.push(normalizeCar(row.vehicle));
  }

  try {
    const res = await fetch(`${API_URL}/cars?limit=120`);
    if (res.ok) {
      const data = await res.json();
      const list = (data?.cars || []).map(normalizeCar);
      for (const c of list) {
        const key = normalizeVehicleSlug(c.slug);
        if (
          !fetched.some(
            (m) => normalizeVehicleSlug(m.slug) === key
          )
        ) {
          fetched.push(c);
        }
      }
    }
  } catch {
    /* use slug fetches only */
  }

  return fetched;
}

/**
 * Fetch normalized compare cars for guide slugs (best variant per family).
 * @param {string[]} slugOrder
 */
export async function fetchCatalogCarsForCompareSlugs(slugOrder) {
  const slugs = [
    ...new Set(
      slugOrder.map((s) => normalizeVehicleSlug(s)).filter(Boolean)
    ),
  ];
  if (slugs.length < 2) return [];

  const pool = await fetchCatalogPool(slugs);
  return slugs
    .map((familySlug) => {
      const car = pickCompareCarForFamily(pool, familySlug);
      return car ? normalizeCar(car) : null;
    })
    .filter(Boolean);
}

/**
 * Merge API catalog rows with ranked SEO stubs (preserve order).
 * @param {object} seoPage
 * @param {object[]} catalogCars
 */
export function mergeRankedWithCatalogCars(seoPage, catalogCars) {
  const order = extractCompareSlugsFromSeoPage(seoPage);
  const ranked = seoPage?.rankedVehicles || [];
  const pool = catalogCars || [];

  return order
    .map((slug) => {
      const rankedRow = ranked.find(
        (v) => normalizeVehicleSlug(v.slug) === slug
      );
      const fromCatalog =
        pickCompareCarForFamily(pool, slug) ||
        pool.find(
          (c) =>
            normalizeVehicleSlug(c.slug) === slug ||
            extractFamilySlug(c.slug) === slug
        );

      if (fromCatalog) {
        return applyCompareDisplayName(fromCatalog, seoPage, slug);
      }
      if (rankedRow) {
        return rankedVehicleToCompareCar(rankedRow, seoPage);
      }
      return null;
    })
    .filter(Boolean);
}

