/**
 * Vehicle image resolution with Cloudinary-first delivery and fallbacks.
 */

import { LOCAL_FALLBACK_EV, ROLE_ASPECT } from "../config/media.js";
import {
  coerceCatalogMediaToUrl,
  familyCatalogAssetUrl,
  familyCatalogUrl,
  isPlaceholderMediaUrl,
} from "../media/cloudinary.js";
import {
  isManifestGuessCatalogUrl,
  isValidImageUrl,
  sanitizeImageUrl,
} from "./imageUrl.js";
import {
  getProductionFamilyMedia,
  isProductionFamilySlug,
  resolveFamilySlugFromCar,
  resolveFamilySlugFromVariantSlug,
} from "../media/familyMediaManifest.js";
import { pickMediaFields } from "../media/vehicleMediaSchema.js";
import {
  filterRequestableMediaUrls,
  isRequestableCatalogMediaUrl,
} from "../media/catalogMediaAvailability.js";
import {
  brandLogoUrl,
  brandSiblingMediaUrls,
  resolveBrandKeyFromFamily,
} from "../media/brandFallback.js";
import {
  DETAIL_GALLERY_IMAGE_TYPES,
  getLocalCarMediaTypesForFamily,
  getLocalCarMediaUrlsForRole,
  isLocalCarMediaFamily,
  localCarMediaPath,
} from "../media/localCarMediaManifest.js";

/** Audit + detail gallery slots (listing/compare are card roles, not thumbs). */
export const GOLDEN_DETAIL_IMAGE_TYPES = Object.freeze([
  "listing",
  "compare",
  ...DETAIL_GALLERY_IMAGE_TYPES,
]);

const GALLERY_CLOUDINARY_CANDIDATES = Object.freeze({
  front: (familySlug) => [
    familyCatalogAssetUrl(familySlug, "hero"),
    familyCatalogUrl(familySlug, "front.webp"),
  ],
  rear: (familySlug) => [familyCatalogUrl(familySlug, "rear.webp")],
  side: (familySlug) => [familyCatalogUrl(familySlug, "side.webp")],
  interior: (familySlug) => [
    familyCatalogUrl(familySlug, "interior.webp"),
    familyCatalogUrl(familySlug, "interior-1.jpg"),
  ],
  dashboard: (familySlug) => [
    familyCatalogUrl(familySlug, "dashboard.webp"),
    familyCatalogUrl(familySlug, "interior-dashboard.jpg"),
  ],
});

function galleryUrlsMatchingType(urls, imageType, guard) {
  const type = String(imageType || "").toLowerCase();
  const filtered = filterRequestableMediaUrls(urls, guard);
  return filtered.filter((url) => {
    const path = url.split("?")[0].toLowerCase();
    if (path.includes(`/${type}.`)) return true;
    if (type === "front" && (path.includes("/hero") || path.includes("exterior-1"))) {
      return true;
    }
    if (type === "rear" && path.includes("exterior-3")) return true;
    if (type === "side" && path.includes("exterior-2")) return true;
    return false;
  });
}

function familyGalleryUrlForType(familySlug, imageType) {
  const block = getProductionFamilyMedia(familySlug);
  const local = block?.local;
  if (!local) return null;
  return local[imageType] || null;
}

/** @deprecated use ROLE_ASPECT from config/media */
export const IMAGE_ASPECT = ROLE_ASPECT;

export const LOCAL_FALLBACK_EV_EXPORT = LOCAL_FALLBACK_EV;

export function brandFallbackUrl() {
  return LOCAL_FALLBACK_EV;
}

function slugFromCar(car) {
  return (
    car?.slug ||
    car?.catalogMeta?.slug ||
    ""
  ).toLowerCase();
}

function mediaGuardOptions(car) {
  return {
    catalogMeta: car?.catalogMeta,
    familySlug: resolveFamilySlugFromCar(car),
  };
}

function uniqueUrls(urls, options = {}) {
  const { role = "listing", catalogMeta = null, familySlug = null } =
    options;
  const seen = new Set();
  return urls.filter((u) => {
    if (!isRequestableCatalogMediaUrl(u, { catalogMeta, familySlug })) {
      return false;
    }
    const clean = sanitizeImageUrl(u, { role, catalogMeta, familySlug });
    if (!clean || seen.has(clean)) return false;
    if (isPlaceholderMediaUrl(clean)) return false;
    if (isManifestGuessCatalogUrl(clean)) return false;
    if (clean.includes("/catalog/families/")) {
      const familyMatch = clean.match(/\/catalog\/families\/([a-z0-9-]+)\//i);
      const family = familyMatch?.[1]?.toLowerCase();
      if (family && !isProductionFamilySlug(family)) return false;
    }
    if (
      role === "compare" &&
      clean.includes("/catalog/variants/")
    ) {
      return false;
    }
    seen.add(clean);
    return true;
  });
}

export { isValidImageUrl, sanitizeImageUrl };

/**
 * Resolve the best compare/listing/hero image from catalog fields (API first, then tier-1 manifest).
 * @param {object|null|undefined} car
 * @param {"compare"|"listing"|"hero"|"og"|"gallery"|"interior"} [role]
 * @returns {string|null}
 */
export function resolveCatalogImageUrl(car, role = "compare") {
  if (!car || typeof car !== "object") return null;

  const meta = car.catalogMeta?.media || {};

  const fieldLists = {
    compare: [
      car.compareThumbnail,
      meta.compareThumbnail,
      car.image,
      car.listingThumbnail,
      meta.listingThumbnail,
      car.heroImage,
      meta.heroImage,
    ],
    listing: [
      car.listingThumbnail,
      meta.listingThumbnail,
      car.image,
      car.heroImage,
      meta.heroImage,
    ],
    hero: [
      car.heroImage,
      meta.heroImage,
      car.image,
      car.listingThumbnail,
      meta.listingThumbnail,
    ],
    og: [car.ogImage, meta.ogImage, car.heroImage, meta.heroImage],
  };

  const fields = fieldLists[role] || fieldLists.listing;

  const sanitizeOpts = { role };

  for (const raw of fields) {
    const url = sanitizeImageUrl(raw, sanitizeOpts);
    if (url) return url;
  }

  const familySlug = resolveFamilySlugFromCar(car);
  if (!familySlug || !isProductionFamilySlug(familySlug)) {
    return null;
  }

  const block = getProductionFamilyMedia(familySlug);
  if (!block) return null;

  const manifestOrder =
    role === "compare"
      ? [block.compareThumbnail, block.listingThumbnail, block.heroImage]
      : role === "hero"
        ? [block.heroImage, block.listingThumbnail]
        : role === "og"
          ? [block.ogImage, block.heroImage]
          : [block.listingThumbnail, block.heroImage];

  for (const raw of manifestOrder) {
    const url = sanitizeImageUrl(raw, sanitizeOpts);
    if (url) return url;
  }

  return null;
}

function familyMediaForRole(familySlug, role) {
  const block = getProductionFamilyMedia(familySlug);
  if (!block) return [];

  if (role === "compare") {
    return [
      block.compareThumbnail,
      block.listingThumbnail,
      block.heroImage,
    ];
  }
  if (role === "og") {
    return [block.ogImage, block.heroImage];
  }
  if (role === "hero") {
    return [block.heroImage, block.listingThumbnail];
  }
  if (role === "gallery") {
    return [...(block.gallery || []), ...(block.interior || [])];
  }
  if (role === "interior") {
    return block.interior || [];
  }

  return [
    block.listingThumbnail,
    block.heroImage,
    block.compareThumbnail,
  ];
}

function variantCdnFallbacks() {
  return [];
}

function finalizeFallbackChain(urls, options = {}) {
  const {
    role = "listing",
    allowLocalFallback = true,
    catalogMeta = null,
    familySlug = null,
  } = options;
  const resolved = uniqueUrls(urls, { role, catalogMeta, familySlug });
  if (resolved.length > 0) {
    return allowLocalFallback
      ? uniqueUrls([...resolved, LOCAL_FALLBACK_EV], {
          role,
          catalogMeta,
          familySlug,
        })
      : resolved;
  }
  return allowLocalFallback ? [LOCAL_FALLBACK_EV] : [];
}

export function buildImageFallbackChain(car, role = "listing") {
  const slug = slugFromCar(car);
  const familySlug =
    resolveFamilySlugFromCar(car) ||
    resolveFamilySlugFromVariantSlug(slug);
  const guard = mediaGuardOptions(car);
  const meta = car?.catalogMeta?.media || {};
  const fieldValues = pickMediaFields(car, role);
  const localUrls = familySlug
    ? getLocalCarMediaUrlsForRole(familySlug, role)
    : [];

  const familyUrls =
    familySlug && isProductionFamilySlug(familySlug)
      ? familyMediaForRole(familySlug, role)
      : [];

  const variantUrls = variantCdnFallbacks();

  if (role === "compare") {
    const localCompare = familySlug
      ? localCarMediaPath(familySlug, "compare")
      : null;
    const localListing = familySlug
      ? localCarMediaPath(familySlug, "listing")
      : null;
    const brandKey = familySlug ? resolveBrandKeyFromFamily(familySlug) : null;
    return finalizeFallbackChain(
      [
        localCompare,
        localListing,
        resolveCatalogImageUrl(car, "compare"),
        car?.compareThumbnail,
        meta.compareThumbnail,
        resolveCatalogImageUrl(car, "listing"),
        car?.listingThumbnail,
        meta.listingThumbnail,
        car?.image,
        ...fieldValues,
        ...familyUrls,
        ...brandSiblingMediaUrls(familySlug, "compare"),
        brandKey ? brandLogoUrl(brandKey) : null,
        LOCAL_FALLBACK_EV,
      ],
      { role: "compare", ...guard }
    );
  }

  if (role === "og") {
    const brandKey = familySlug ? resolveBrandKeyFromFamily(familySlug) : null;
    return finalizeFallbackChain([
      ...localUrls,
      car?.ogImage,
      meta.ogImage,
      ...fieldValues,
      ...familyUrls,
      car?.heroImage,
      meta.heroImage,
      familySlug ? familyCatalogUrl(familySlug, "og.jpg") : null,
      ...brandSiblingMediaUrls(familySlug, "hero"),
      brandKey ? brandLogoUrl(brandKey) : null,
      ...variantUrls,
      LOCAL_FALLBACK_EV,
    ], guard);
  }

  if (role === "hero") {
    const brandKey = familySlug ? resolveBrandKeyFromFamily(familySlug) : null;
    return finalizeFallbackChain([
      ...localUrls,
      car?.heroImage,
      meta.heroImage,
      ...fieldValues,
      ...familyUrls,
      car?.image,
      car?.listingThumbnail,
      meta.listingThumbnail,
      ...brandSiblingMediaUrls(familySlug, "hero"),
      brandKey ? brandLogoUrl(brandKey) : null,
      ...variantUrls,
      LOCAL_FALLBACK_EV,
    ], guard);
  }

  if (role === "gallery") {
    const galleryCandidates = filterRequestableMediaUrls(
      [
        ...(car?.galleryImages || []),
        ...(meta.gallery || []),
        ...fieldValues,
        ...familyUrls,
        ...variantUrls,
      ],
      guard
    );
    return finalizeFallbackChain(
      [...localUrls, ...galleryCandidates, LOCAL_FALLBACK_EV],
      guard
    );
  }

  if (role === "interior") {
    return finalizeFallbackChain(
      [
        ...localUrls,
        ...filterRequestableMediaUrls(meta.interior || [], guard),
        ...filterRequestableMediaUrls(fieldValues, guard),
        ...filterRequestableMediaUrls(
          getProductionFamilyMedia(familySlug)?.interior || [],
          guard
        ),
        LOCAL_FALLBACK_EV,
      ],
      guard
    );
  }

  return finalizeFallbackChain([
    ...localUrls,
    car?.listingThumbnail,
    meta.listingThumbnail,
    ...fieldValues,
    ...familyUrls,
    car?.heroImage,
    meta.heroImage,
    car?.image,
    ...brandSiblingMediaUrls(familySlug, "listing"),
    ...(familySlug
      ? [brandLogoUrl(resolveBrandKeyFromFamily(familySlug))]
      : []),
    ...variantUrls,
    LOCAL_FALLBACK_EV,
  ], guard);
}

/**
 * Per-type gallery fallback: local slot → Cloudinary → car gallery → fallback SVG.
 * @param {object} car
 * @param {string} imageType
 * @returns {string[]}
 */
export function buildGalleryTypeFallbackChain(car, imageType) {
  const guard = mediaGuardOptions(car);
  const familySlug =
    resolveFamilySlugFromCar(car) ||
    resolveFamilySlugFromVariantSlug(slugFromCar(car));
  const meta = car?.catalogMeta?.media || {};
  const type = String(imageType || "").trim().toLowerCase();
  const cloudinaryFn = GALLERY_CLOUDINARY_CANDIDATES[type];
  const cloudinaryUrls = familySlug && cloudinaryFn
    ? cloudinaryFn(familySlug)
    : [];

  const fromCar = galleryUrlsMatchingType(
    [
      ...(car?.galleryImages || []),
      ...(meta.gallery || []),
    ],
    type,
    guard
  );

  return finalizeFallbackChain(
    [
      familySlug ? localCarMediaPath(familySlug, type) : null,
      ...cloudinaryUrls,
      ...fromCar,
      familySlug ? familyGalleryUrlForType(familySlug, type) : null,
      LOCAL_FALLBACK_EV,
    ],
    guard
  );
}

function isRenderableGalleryUrl(url) {
  if (!url || typeof url !== "string") return false;
  if (url === LOCAL_FALLBACK_EV || url.includes("fallback-ev.svg")) return false;
  if (isPlaceholderMediaUrl(url)) return false;
  return true;
}

/**
 * Gallery slots for families with partial local sets must not render
 * missing angles (rear/side) that would exhaust to placeholder SVG.
 * @param {string|null} familySlug
 * @param {string} imageType
 */
function isProvisionedGalleryType(familySlug, imageType) {
  if (!familySlug || !isLocalCarMediaFamily(familySlug)) return true;
  return getLocalCarMediaTypesForFamily(familySlug).includes(imageType);
}

/**
 * Typed gallery items for detail hero thumbnails (no empty slots).
 * @param {object} car
 * @returns {{ imageType: string, src: string, chain: string[] }[]}
 */
export function resolveDetailGalleryItems(car) {
  if (!car || typeof car !== "object") return [];

  const familySlug =
    resolveFamilySlugFromCar(car) ||
    resolveFamilySlugFromVariantSlug(slugFromCar(car));

  return DETAIL_GALLERY_IMAGE_TYPES.map((imageType) => {
    if (!isProvisionedGalleryType(familySlug, imageType)) return null;

    const chain = buildGalleryTypeFallbackChain(car, imageType);
    const src =
      chain.find((url) => isRenderableGalleryUrl(url)) || null;
    if (!src) return null;

    return {
      imageType,
      src,
      chain: chain.filter((url) => isRenderableGalleryUrl(url)),
    };
  }).filter(Boolean);
}

/**
 * Gallery URLs safe to render (no speculative optional probes).
 * @param {object} car
 * @returns {string[]}
 */
export function resolveRequestableGalleryImages(car) {
  const items = resolveDetailGalleryItems(car);
  const seen = new Set();
  const urls = [];

  for (const item of items) {
    const clean = sanitizeImageUrl(item.src, { role: "gallery" });
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    urls.push(clean);
  }

  if (urls.length > 0) return urls;

  const hero = getHeroImage(car);
  return hero ? [hero] : [];
}

export function getListingImage(car) {
  return buildImageFallbackChain(car, "listing")[0] || LOCAL_FALLBACK_EV;
}

export function getCompareThumbnail(car) {
  return buildImageFallbackChain(car, "compare")[0] || LOCAL_FALLBACK_EV;
}

export function getHeroImage(car) {
  return buildImageFallbackChain(car, "hero")[0] || LOCAL_FALLBACK_EV;
}

export function getOgImage(car) {
  return buildImageFallbackChain(car, "og")[0] || LOCAL_FALLBACK_EV;
}

export function resolveVehicleImage(car, role = "listing") {
  return buildImageFallbackChain(car, role)[0] || LOCAL_FALLBACK_EV;
}
