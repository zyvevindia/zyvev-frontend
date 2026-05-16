/**
 * Vehicle image resolution with catalog-aware fallbacks.
 */

import {
  CATALOG_CDN_HOST,
  LOCAL_FALLBACK_EV,
  fallbackEVImage,
  isCatalogCdnUrl,
} from "./imageUtils";

const CDN = `https://${CATALOG_CDN_HOST}/catalog`;

export const IMAGE_ASPECT = {
  listing: "16 / 10",
  compare: "16 / 10",
  hero: "16 / 10",
  gallery: "16 / 10",
  og: "1.91 / 1",
};

export function brandFallbackUrl(brandSlug, bodyType = "suv") {
  const brand = String(brandSlug || "generic")
    .toLowerCase()
    .replace(/\s+/g, "-");
  const body = ["hatchback", "sedan", "suv", "micro-suv", "coupe-suv"].includes(
    bodyType
  )
    ? bodyType
    : "suv";
  return LOCAL_FALLBACK_EV;
}

function slugFromCar(car) {
  return (
    car?.slug ||
    car?.catalogMeta?.slug ||
    ""
  ).toLowerCase();
}

function brandSlugFromCar(car) {
  const raw =
    car?.brandSlug ||
    car?.catalogMeta?.brandSlug ||
    String(car?.brand || "")
      .toLowerCase()
      .replace(/\s+/g, "-");
  return raw === "mg" ? "mg" : raw;
}

function uniqueUrls(urls) {
  const seen = new Set();
  return urls.filter((u) => {
    if (!u || typeof u !== "string" || seen.has(u)) return false;
    seen.add(u);
    return true;
  });
}

function finalizeFallbackChain(urls) {
  const resolved = uniqueUrls(urls);
  const hosted = resolved.filter((u) => !isCatalogCdnUrl(u));
  const catalogCdn = resolved.filter(isCatalogCdnUrl);

  if (hosted.length > 0) {
    return uniqueUrls([...hosted, ...catalogCdn, LOCAL_FALLBACK_EV]);
  }

  if (catalogCdn.length > 0) {
    return uniqueUrls([...catalogCdn, LOCAL_FALLBACK_EV]);
  }

  return [LOCAL_FALLBACK_EV];
}

export function getSlugCdnHero(slug) {
  if (!slug) return null;
  return `${CDN}/${slug}/hero.jpg`;
}

export function getSlugCdnListing(slug) {
  if (!slug) return null;
  return `${CDN}/${slug}/listing-thumb.jpg`;
}

/**
 * Ordered fallback chain for broken-image recovery (no layout shift).
 */
export function buildImageFallbackChain(car, role = "listing") {
  const slug = slugFromCar(car);
  const meta = car?.catalogMeta?.media || {};
  const brandFb = brandFallbackUrl(
    brandSlugFromCar(car),
    car?.bodyType || car?.category?.toLowerCase()
  );

  if (role === "compare") {
    return finalizeFallbackChain([
      car?.compareThumbnail,
      meta.compareThumbnail,
      car?.listingThumbnail,
      meta.listingThumbnail,
      car?.heroImage,
      meta.heroImage,
      car?.image,
      getSlugCdnListing(slug),
      getSlugCdnHero(slug),
      brandFb,
      fallbackEVImage,
    ]);
  }

  if (role === "og") {
    return finalizeFallbackChain([
      car?.ogImage,
      meta.ogImage,
      car?.heroImage,
      meta.heroImage,
      getSlugCdnHero(slug),
      `${CDN}/${slug}/og.jpg`,
      brandFb,
      fallbackEVImage,
    ]);
  }

  if (role === "hero") {
    return finalizeFallbackChain([
      car?.heroImage,
      meta.heroImage,
      car?.image,
      getSlugCdnHero(slug),
      car?.listingThumbnail,
      meta.listingThumbnail,
      brandFb,
      fallbackEVImage,
    ]);
  }

  return finalizeFallbackChain([
    car?.listingThumbnail,
    meta.listingThumbnail,
    car?.heroImage,
    meta.heroImage,
    car?.image,
    getSlugCdnListing(slug),
    getSlugCdnHero(slug),
    brandFb,
    fallbackEVImage,
  ]);
}

export function getListingImage(car) {
  const chain = buildImageFallbackChain(car, "listing");
  return chain[0] || fallbackEVImage;
}

export function getCompareThumbnail(car) {
  const chain = buildImageFallbackChain(car, "compare");
  return chain[0] || fallbackEVImage;
}

export function getHeroImage(car) {
  const chain = buildImageFallbackChain(car, "hero");
  return chain[0] || fallbackEVImage;
}

export function getOgImage(car) {
  const chain = buildImageFallbackChain(car, "og");
  return chain[0] || fallbackEVImage;
}

export function resolveVehicleImage(car, role = "listing") {
  return buildImageFallbackChain(car, role)[0] || fallbackEVImage;
}
