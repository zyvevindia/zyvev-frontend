import { SITE_ORIGIN } from "./utils.mjs";

const BRAND = "EVSavari";

export function buildTitle(h1, { withBrand = true } = {}) {
  const core = String(h1 || "").trim();
  if (!withBrand) return core;
  if (core.endsWith(BRAND)) return core;
  return `${core} | ${BRAND}`;
}

export function buildMetaDescription(text, maxLen = 158) {
  const raw = String(text || "").trim();
  if (raw.length <= maxLen) return raw;
  return `${raw.slice(0, maxLen - 1).trim()}…`;
}

export function buildCanonicalFields(path) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return {
    canonicalPath: normalized,
    canonicalUrl: `${SITE_ORIGIN}${normalized}`,
  };
}
