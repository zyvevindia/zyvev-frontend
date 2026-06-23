import normalizeCar from "./normalizeCar.js";
import { getListingImage, getHeroImage } from "./vehicleMedia.js";
import { normalizeVehicleSlug } from "./vehicleRoutes.js";
import { TIER1_MODEL_FAMILY_SLUGS } from "../data/tier1ModelFamilies.js";
import { filterCatalogFamilies } from "../intelligence/catalogFilters.js";

export { TIER1_MODEL_FAMILY_SLUGS };

/**
 * Resolve canonical model-family slug from a variant or family slug.
 */
export function extractFamilySlug(rawSlug) {
  const slug = normalizeVehicleSlug(rawSlug);
  if (!slug) return "";

  if (TIER1_MODEL_FAMILY_SLUGS.includes(slug)) {
    return slug;
  }

  for (const family of TIER1_MODEL_FAMILY_SLUGS) {
    if (slug.startsWith(`${family}-`)) {
      return family;
    }
  }

  return slug;
}

export function isVariantSlug(rawSlug) {
  const slug = normalizeVehicleSlug(rawSlug);
  const family = extractFamilySlug(slug);
  return Boolean(slug && family && slug !== family);
}

/**
 * Keep only trim-level variants for compare/table flows.
 * Drops the parent family slug when real trims exist (e.g. tata-curvv-ev vs tata-curvv-ev-empowered).
 */
export function filterComparableVariants(
  variants = [],
  familySlug = ""
) {
  const list = (variants || []).filter(Boolean);
  if (!list.length) return [];

  const family = normalizeVehicleSlug(
    familySlug || extractFamilySlug(list[0]?.slug || list[0]?.familySlug)
  );

  const trims = list.filter((v) =>
    isVariantSlug(v.slug || v.variantSlug)
  );

  if (trims.length > 0) return trims;

  if (list.length <= 1) return list;

  if (family) {
    return list.filter(
      (v) =>
        normalizeVehicleSlug(v.slug || v.variantSlug) !==
        family
    );
  }

  return list;
}

export function formatFamilyName(familySlug, brandLabel = "") {
  const slug = normalizeVehicleSlug(familySlug);
  if (!slug) return "Electric Vehicle";

  const family = TIER1_MODEL_FAMILY_SLUGS.find(
    (f) => f === slug || slug.startsWith(`${f}-`)
  );
  const modelPart = family
    ? family.replace(/^[a-z]+-/, "")
    : slug.replace(/^[a-z]+-/, "");

  const modelTitle = modelPart
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const brand = brandLabel &&
    !/^ev brand$/i.test(String(brandLabel).trim())
    ? String(brandLabel).trim()
    : slug.split("-")[0].charAt(0).toUpperCase() +
      slug.split("-")[0].slice(1);

  return `${brand} ${modelTitle}`.trim();
}

function variantLabel(car) {
  const full = car.name || "";
  const family = formatFamilyName(
    extractFamilySlug(car.slug),
    car.brand
  );
  if (full.toLowerCase().startsWith(family.toLowerCase())) {
    return full.slice(family.length).trim() || full;
  }
  return full;
}

function numericPrice(car) {
  return Number(car.price ?? car.startingPrice ?? 0) || 0;
}

function numericRange(car) {
  return (
    Number(car.range ?? car.specifications?.range ?? 0) || 0
  );
}

function pickRepresentativeVariant(variants) {
  if (!variants.length) return null;
  return [...variants].sort(
    (a, b) => numericPrice(a) - numericPrice(b)
  )[0];
}

function pickHeroVariant(variants) {
  const withImage = variants.find(
    (v) => v.heroImage || v.image || v.listingThumbnail
  );
  return withImage || pickRepresentativeVariant(variants);
}

/**
 * @param {object[]} cars — normalized variant-level vehicles
 * @returns {object[]} model family DTOs
 */
export function aggregateModelFamilies(cars) {
  const groups = new Map();

  for (const raw of cars || []) {
    const car = raw.slug ? raw : normalizeCar(raw);
    const familySlug = extractFamilySlug(car.slug);
    if (!familySlug) continue;

    if (!groups.has(familySlug)) {
      groups.set(familySlug, []);
    }
    groups.get(familySlug).push(car);
  }

  const families = [];

  for (const [familySlug, variants] of groups) {
    const sortedVariants = [...variants].sort(
      (a, b) => numericPrice(a) - numericPrice(b)
    );
    const comparableVariants = filterComparableVariants(
      sortedVariants,
      familySlug
    );
    const representative = pickRepresentativeVariant(
      comparableVariants
    );
    const heroSource = pickHeroVariant(comparableVariants);
    const prices = comparableVariants
      .map(numericPrice)
      .filter((p) => p > 0);
    const ranges = comparableVariants
      .map(numericRange)
      .filter((r) => r > 0);

    const startingPrice = prices.length
      ? Math.min(...prices)
      : 0;
    const maxRange = ranges.length ? Math.max(...ranges) : 0;

    const brand =
      representative?.brand ||
      sortedVariants[0]?.brand ||
      "";

    const familyName = formatFamilyName(familySlug, brand);

    const variantDtos = comparableVariants.map((v) => ({
      ...v,
      variantSlug: v.slug,
      variantLabel: variantLabel(v),
      familySlug,
    }));

    const catalogMeta =
      representative?.catalogMeta ||
      comparableVariants.find((v) => v.catalogMeta)?.catalogMeta ||
      null;

    families.push({
      familySlug,
      familyName,
      brand,
      slug: familySlug,
      name: familyName,
      heroImage:
        heroSource?.heroImage ||
        heroSource?.image ||
        getHeroImage(heroSource),
      image:
        getListingImage(heroSource) ||
        getListingImage(representative),
      listingThumbnail:
        heroSource?.listingThumbnail ||
        representative?.listingThumbnail,
      startingPrice,
      price: startingPrice,
      maxRange,
      range: maxRange,
      specifications: {
        range: maxRange,
        batteryPack:
          representative?.specifications?.batteryPack ||
          representative?.battery ||
          "EV Battery",
        chargingTime:
          representative?.specifications?.chargingTime ||
          "N/A",
      },
      battery:
        representative?.specifications?.batteryPack ||
        representative?.battery ||
        "EV Battery",
      variantCount: variantDtos.length,
      variants: variantDtos,
      defaultVariant: representative,
      isFeatured: comparableVariants.some((v) => v.isFeatured),
      category:
        representative?.category ||
        comparableVariants[0]?.category,
      catalogMeta,
      catalogSource: representative?.catalogSource,
      createdAt: comparableVariants.reduce((latest, v) => {
        const t = new Date(v.createdAt || 0).getTime();
        return t > latest ? t : latest;
      }, 0),
    });
  }

  return families.sort((a, b) =>
    a.familyName.localeCompare(b.familyName)
  );
}

/**
 * Card-shaped object for listing/home components.
 */
export function familyToListingCard(family) {
  return {
    _id: family.familySlug,
    slug: family.familySlug,
    familySlug: family.familySlug,
    name: family.familyName,
    brand: family.brand,
    image: family.image,
    heroImage: family.heroImage,
    listingThumbnail: family.listingThumbnail,
    price: family.startingPrice,
    startingPrice: family.startingPrice,
    range: family.maxRange,
    specifications: family.specifications,
    battery: family.battery,
    isFeatured: family.isFeatured,
    category: family.category,
    catalogMeta: family.catalogMeta,
    catalogSource: family.catalogSource,
    variantCount: family.variantCount,
    variants: family.variants,
    defaultVariant: family.defaultVariant,
    evSavariScores: family.evSavariScores,
    evScores: family.evScores,
    evIntelligence: family.evIntelligence,
  };
}

export function sortFamilies(families, sortBy) {
  const list = [...families];
  if (sortBy === "priceLow") {
    list.sort((a, b) => a.startingPrice - b.startingPrice);
  } else if (sortBy === "priceHigh") {
    list.sort((a, b) => b.startingPrice - a.startingPrice);
  } else if (sortBy === "rangeLow") {
    list.sort((a, b) => a.maxRange - b.maxRange);
  } else if (sortBy === "rangeHigh") {
    list.sort((a, b) => b.maxRange - a.maxRange);
  } else {
    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }
  return list;
}

export function filterFamilies(families, options = {}) {
  return filterCatalogFamilies(families, options);
}
