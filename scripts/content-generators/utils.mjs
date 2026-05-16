/**
 * Shared helpers for SEO content generation.
 */

export const SITE_ORIGIN = "https://evsavari.com";

export const TIER1_FAMILIES = [
  "tata-nexon-ev",
  "tata-curvv-ev",
  "tata-punch-ev",
  "tata-tiago-ev",
  "mg-comet-ev",
  "mg-zs-ev",
  "mahindra-xuv400",
  "mahindra-be-6",
  "mahindra-xev-9e",
  "hyundai-kona-electric",
  "kia-ev6",
  "byd-atto-3",
  "citroen-ec3",
  "bmw-ix1",
  "mercedes-eqb",
  "mercedes-eqa",
  "volvo-ex40",
];

export function slugToDisplay(slug) {
  return String(slug || "")
    .split("-")
    .map((w) => {
      if (w === "ev") return "EV";
      if (w === "mg") return "MG";
      if (w === "bmw") return "BMW";
      if (w === "byd") return "BYD";
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

export function hashPick(list, seed, count = 3) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const picked = [];
  const copy = [...list];
  while (picked.length < count && copy.length) {
    const idx = h % copy.length;
    picked.push(copy[idx]);
    copy.splice(idx, 1);
    h = (h * 17 + 3) >>> 0;
  }
  return picked;
}

export function buildRankedVehicle(familySlug, rank, explanation) {
  const name = slugToDisplay(familySlug);
  return {
    rank,
    slug: familySlug,
    displayName: name,
    explanation,
    detailPath: `/cars/${familySlug}`,
  };
}

export function wrapSeoPage(seoPage) {
  return { seoPage };
}

export function uniqueStrings(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = String(item).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
