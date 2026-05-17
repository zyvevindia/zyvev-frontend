/**
 * Vehicle media roles and field mapping (family / variant catalog).
 */

export const MEDIA_ROLES = {
  HERO: "hero",
  LISTING: "listing",
  COMPARE: "compare",
  GALLERY: "gallery",
  INTERIOR: "interior",
  OG: "og",
};

/** Car / master variant field names per role */
export const ROLE_FIELD_MAP = {
  hero: ["heroImage"],
  listing: ["listingThumbnail", "image"],
  compare: ["compareThumbnail", "listingThumbnail"],
  og: ["ogImage", "heroImage"],
  gallery: ["galleryImages"],
  interior: ["interiorImages"],
};

export function pickMediaFields(car = {}, role = "listing") {
  const meta = car?.catalogMeta?.media || {};
  const fields = ROLE_FIELD_MAP[role] || ROLE_FIELD_MAP.listing;
  const values = [];

  for (const field of fields) {
    if (car?.[field]) {
      if (Array.isArray(car[field])) values.push(...car[field]);
      else values.push(car[field]);
    }
    if (meta[field]) {
      if (Array.isArray(meta[field])) values.push(...meta[field]);
      else values.push(meta[field]);
    }
  }

  if (role === "gallery" && Array.isArray(car?.galleryImages)) {
    values.push(...car.galleryImages);
  }

  if (role === "interior" && Array.isArray(meta?.interior)) {
    values.push(...meta.interior);
  }

  return values.filter(Boolean);
}
