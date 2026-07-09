/**
 * Local catalog car imagery under public/images/cars/.
 * Preferred source before Cloudinary and /fallback-ev.svg.
 */

export const LOCAL_CAR_MEDIA_DAY1_FAMILIES = Object.freeze([
  "kia-ev6",
  "bmw-ix1",
  "mercedes-eqa",
  "mercedes-eqb",
  "citroen-ec3",
]);

export const LOCAL_CAR_MEDIA_DAY2_FAMILIES = Object.freeze([
  "volvo-ex40",
  "mini-cooper-se",
  "mg-zs-ev",
  "byd-seal",
  "hyundai-ioniq-5",
]);

export const LOCAL_CAR_MEDIA_DAY3_FAMILIES = Object.freeze([
  "tata-curvv-ev",
  "tata-nexon-ev",
  "tata-punch-ev",
  "mg-windsor-ev",
  "mahindra-be-6",
  "mg-comet-ev",
  "mahindra-xev-9e",
]);

/** Media Completion Sprint — Priority 1: full local set (7 types). */
export const MEDIA_COMPLETION_P1_FAMILIES = Object.freeze([
  "hyundai-creta-electric",
  "maruti-e-vitara",
  "tata-tigor-ev",
  "tata-harrier-ev",
]);

/**
 * Priority 2 — families that needed selective local slots during media sprint.
 * Only list types that are intentionally partial; families with a full local set
 * must not appear here (resolver uses every on-disk type via LOCAL_CAR_IMAGE_TYPES).
 * @type {Readonly<Record<string, readonly string[]>>}
 */
export const MEDIA_COMPLETION_P2_TYPES = Object.freeze({
  "tata-tiago-ev": [
    "front",
    "listing",
    "compare",
    "interior",
    "dashboard",
  ],
  "hyundai-kona-electric": [
    "front",
    "listing",
    "compare",
    "dashboard",
  ],
  "byd-atto-3": [
    "front",
    "listing",
    "compare",
    "dashboard",
  ],
  "mahindra-xuv400": [
    "front",
    "listing",
    "compare",
    "dashboard",
  ],
});

/** Priority 3 — tier-1 families missing dashboard only (no core exterior gaps). */
export const MEDIA_COMPLETION_P3_DASHBOARD_FAMILIES = Object.freeze([]);

export const MEDIA_COMPLETION_SPRINT_FAMILIES = Object.freeze([
  ...MEDIA_COMPLETION_P1_FAMILIES,
  ...Object.keys(MEDIA_COMPLETION_P2_TYPES),
  ...MEDIA_COMPLETION_P3_DASHBOARD_FAMILIES,
]);

export const LOCAL_CAR_MEDIA_FAMILIES = Object.freeze([
  ...LOCAL_CAR_MEDIA_DAY1_FAMILIES,
  ...LOCAL_CAR_MEDIA_DAY2_FAMILIES,
  ...LOCAL_CAR_MEDIA_DAY3_FAMILIES,
  ...MEDIA_COMPLETION_SPRINT_FAMILIES,
]);

export const LOCAL_CAR_IMAGE_TYPES = Object.freeze([
  "listing",
  "compare",
  "front",
  "rear",
  "side",
  "interior",
  "dashboard",
]);

const LOCAL_CAR_MEDIA_SET = new Set(LOCAL_CAR_MEDIA_FAMILIES);

/** UI / fallback-chain role → on-disk basename (without extension). */
const ROLE_TO_LOCAL_TYPE = Object.freeze({
  listing: "listing",
  compare: "compare",
  hero: "front",
  og: "front",
  interior: "interior",
});

export const DETAIL_GALLERY_IMAGE_TYPES = Object.freeze([
  "front",
  "rear",
  "side",
  "interior",
  "dashboard",
]);

const GALLERY_LOCAL_TYPES = DETAIL_GALLERY_IMAGE_TYPES;

/**
 * Local image types populated on disk for a family (partial or full).
 * @param {string} familySlug
 * @returns {string[]}
 */
export function getLocalCarMediaTypesForFamily(familySlug = "") {
  const slug = String(familySlug || "").trim().toLowerCase();
  if (!slug || !LOCAL_CAR_MEDIA_SET.has(slug)) return [];

  const p2 = MEDIA_COMPLETION_P2_TYPES[slug];
  if (p2) return [...p2];

  if (MEDIA_COMPLETION_P3_DASHBOARD_FAMILIES.includes(slug)) {
    return ["dashboard"];
  }

  return [...LOCAL_CAR_IMAGE_TYPES];
}

export function isLocalCarMediaFamily(familySlug = "") {
  const key = String(familySlug || "").trim().toLowerCase();
  return LOCAL_CAR_MEDIA_SET.has(key);
}

/**
 * Public URL for a local car image slot.
 * @param {string} familySlug
 * @param {string} imageType
 * @returns {string|null}
 */
export function localCarMediaPath(familySlug, imageType) {
  const slug = String(familySlug || "").trim().toLowerCase();
  const type = String(imageType || "").trim().toLowerCase();
  if (!isLocalCarMediaFamily(slug)) return null;
  if (!getLocalCarMediaTypesForFamily(slug).includes(type)) return null;
  if (!LOCAL_CAR_IMAGE_TYPES.includes(type)) return null;
  return `/images/cars/${slug}/${type}.webp`;
}

/**
 * Local media block for manifests / golden JSON (local slots only).
 * @param {string} familySlug
 */
export function buildLocalCarMediaBlock(familySlug) {
  if (!isLocalCarMediaFamily(familySlug)) return null;

  const types = getLocalCarMediaTypesForFamily(familySlug);
  const path = (type) => localCarMediaPath(familySlug, type);
  const block = {
    source: "local-cars",
    listingThumbnail: null,
    compareThumbnail: null,
    heroImage: null,
    front: null,
    rear: null,
    side: null,
    interior: null,
    dashboard: null,
    gallery: [],
  };

  for (const type of types) {
    const url = path(type);
    if (!url) continue;
    if (type === "listing") block.listingThumbnail = url;
    if (type === "compare") block.compareThumbnail = url;
    if (type === "front") {
      block.heroImage = url;
      block.front = url;
    }
    if (type === "rear") block.rear = url;
    if (type === "side") block.side = url;
    if (type === "interior") block.interior = url;
    if (type === "dashboard") block.dashboard = url;
  }

  block.gallery = GALLERY_LOCAL_TYPES.map((t) => path(t)).filter(Boolean);

  return block;
}

/**
 * Ordered local URLs for a vehicleMedia role (prepended to fallback chains).
 * @param {string} familySlug
 * @param {string} role
 * @returns {string[]}
 */
export function getLocalCarMediaUrlsForRole(familySlug, role = "listing") {
  if (!isLocalCarMediaFamily(familySlug)) return [];

  const localTypes = new Set(getLocalCarMediaTypesForFamily(familySlug));

  if (role === "gallery") {
    return GALLERY_LOCAL_TYPES.filter((t) => localTypes.has(t))
      .map((t) => localCarMediaPath(familySlug, t))
      .filter(Boolean);
  }

  const mapped = ROLE_TO_LOCAL_TYPE[role];
  if (!mapped || !localTypes.has(mapped)) return [];

  const url = localCarMediaPath(familySlug, mapped);
  return url ? [url] : [];
}
