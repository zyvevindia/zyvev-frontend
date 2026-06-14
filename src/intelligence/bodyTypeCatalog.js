/**
 * Body-type taxonomy and classification for catalog filters.
 */

/** @see docs/roadmap/body-type-filter.md */
export const BODY_TYPE_FILTER_ENABLED = false;

export const BODY_TYPE_IDS = Object.freeze([
  "hatchback",
  "sedan",
  "suv",
  "compact_suv",
  "coupe_suv",
  "mpv",
  "luxury_suv",
]);

export const BODY_TYPE_LABELS = Object.freeze({
  hatchback: "Hatchback",
  sedan: "Sedan",
  suv: "SUV",
  compact_suv: "Compact SUV",
  coupe_suv: "Coupe SUV",
  mpv: "MPV",
  luxury_suv: "Luxury SUV",
});

const LUXURY_PRICE_INR = 3500000;
const COMPACT_SUV_MAX_PRICE = 1850000;

function normalizeBodyTypeText(raw) {
  const s = String(raw || "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return null;

  if (/\b(compact suv|subcompact suv|sub compact)\b/.test(s)) {
    return "compact_suv";
  }
  if (/\b(coupe suv|coupe-suv|coupé)\b/.test(s)) {
    return "coupe_suv";
  }
  if (/\b(luxury suv|premium suv)\b/.test(s)) {
    return "luxury_suv";
  }
  if (/\bhatchback\b|\bhatch\b/.test(s)) return "hatchback";
  if (/\bsedan\b|\bsaloon\b/.test(s)) return "sedan";
  if (/\bmpv\b|\bminivan\b/.test(s)) return "mpv";
  if (/\bsuv\b|\bcrossover\b/.test(s)) return "suv";
  return null;
}

function inferFromFamilyName(familyName = "") {
  const name = String(familyName).toLowerCase();
  if (/comet|tiago|ec3|e-c3|punch|comet/.test(name)) return "hatchback";
  if (/tigor|seal|sedan/.test(name)) return "sedan";
  if (/curvv|coupe/.test(name)) return "coupe_suv";
  if (/windsor|be-6|xev|comet|punch/.test(name)) return "compact_suv";
  return null;
}

function refineBodyType(baseType, family) {
  if (!baseType) return null;

  const price = Number(family?.startingPrice) || 0;
  const name = family?.familyName || family?.name || "";

  if (baseType === "suv") {
    if (price >= LUXURY_PRICE_INR) return "luxury_suv";
    if (
      price > 0 &&
      price <= COMPACT_SUV_MAX_PRICE &&
      !/harrier|xuv400|zs|atto|creta|kona|windsor|be-6|xev|nexon|curvv|harrier|ioniq|ev6|seal|harrier/i.test(
        name
      )
    ) {
      return "compact_suv";
    }
    if (/curvv|coupe|coupé/i.test(name)) return "coupe_suv";
  }

  if (baseType === "suv" && price >= LUXURY_PRICE_INR) {
    return "luxury_suv";
  }

  return baseType;
}

/**
 * @param {object} family
 * @returns {string|null}
 */
export function classifyFamilyBodyType(family) {
  if (!family) return null;

  const rep = family.defaultVariant || family.variants?.[0] || family;
  const raw =
    family.catalogMeta?.bodyType ||
    rep?.catalogMeta?.bodyType ||
    rep?.bodyType ||
    rep?.category ||
    family.category;

  let type =
    normalizeBodyTypeText(raw) ||
    inferFromFamilyName(family.familyName || family.name);

  return refineBodyType(type, family);
}

/**
 * @param {object[]} families
 * @param {string} bodyTypeId
 */
export function applyBodyTypeFilter(families, bodyTypeId) {
  if (!bodyTypeId || !BODY_TYPE_IDS.includes(bodyTypeId)) return families;
  return families.filter(
    (f) =>
      f?.taxonomyTags?.bodyType === bodyTypeId ||
      classifyFamilyBodyType(f) === bodyTypeId
  );
}

export function bodyTypeFilterId(bodyTypeId) {
  return `body_${bodyTypeId}`;
}

export function parseBodyTypeFilterId(filterId) {
  if (!filterId?.startsWith("body_")) return null;
  const id = filterId.slice(5);
  return BODY_TYPE_IDS.includes(id) ? id : null;
}

export const BODY_TYPE_FILTER_DEFINITIONS = BODY_TYPE_IDS.map((id) => ({
  id: bodyTypeFilterId(id),
  group: "body_type",
  label: BODY_TYPE_LABELS[id],
  urlDefault: ["hatchback", "sedan", "suv", "compact_suv"].includes(id),
  match: (family) =>
    family?.taxonomyTags?.bodyType === id ||
    classifyFamilyBodyType(family) === id,
}));
