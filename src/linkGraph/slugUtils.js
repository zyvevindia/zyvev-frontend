/**
 * Slug helpers for link graph — no frontend config imports (Node + browser safe).
 */

export function normalizeVehicleSlug(slug) {
  if (slug == null || slug === "") return "";
  return String(slug)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function normalizeCompareGuideSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildComparePairSlug(slugA, slugB) {
  const a = normalizeCompareGuideSlug(slugA);
  const b = normalizeCompareGuideSlug(slugB);
  if (!a || !b || a === b) return null;
  const [left, right] = [a, b].sort();
  return `${left}-vs-${right}`;
}

export function compareGuidePath(compareSlug) {
  const slug = normalizeCompareGuideSlug(compareSlug);
  return slug ? `/compare/${slug}` : "/compare";
}
