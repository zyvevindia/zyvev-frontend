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

import { sanitizeImageUrl } from "../utils/imageUrl.js";

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
      if (Array.isArray(car[field])) {
        for (const item of car[field]) {
          const url = sanitizeImageUrl(item);
          if (url) values.push(url);
        }
      } else {
        const url = sanitizeImageUrl(car[field]);
        if (url) values.push(url);
      }
    }
    if (meta[field]) {
      if (Array.isArray(meta[field])) {
        for (const item of meta[field]) {
          const url = sanitizeImageUrl(item);
          if (url) values.push(url);
        }
      } else {
        const url = sanitizeImageUrl(meta[field]);
        if (url) values.push(url);
      }
    }
  }

  if (role === "gallery" && Array.isArray(car?.galleryImages)) {
    for (const item of car.galleryImages) {
      const url = sanitizeImageUrl(item);
      if (url) values.push(url);
    }
  }

  if (role === "interior" && Array.isArray(meta?.interior)) {
    for (const item of meta.interior) {
      const url = sanitizeImageUrl(item);
      if (url) values.push(url);
    }
  }

  return values;
}
