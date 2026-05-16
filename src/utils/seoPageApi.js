import { API_URL } from "../config";

import { normalizeSeoSlug } from "./seoRoutes";

/**
 * @param {string} slug
 * @returns {Promise<{ seoPage: object } | null>}
 */
async function fetchSeoPageStatic(normalized) {
  try {
    const res = await fetch(
      `/seo-data/${encodeURIComponent(normalized)}.json`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.seoPage ? data : null;
  } catch {
    return null;
  }
}

export async function fetchSeoPage(slug) {
  const normalized = normalizeSeoSlug(slug);
  if (!normalized) return null;

  try {
    const res = await fetch(
      `${API_URL}/api/seo/pages/${encodeURIComponent(normalized)}`
    );

    if (res.ok) {
      const data = await res.json();
      if (data?.seoPage) return data;
    }
  } catch {
    /* try static fallback */
  }

  const staticData = await fetchSeoPageStatic(normalized);
  return staticData;
}

export async function fetchSeoPagesList() {
  try {
    const res = await fetch(`${API_URL}/api/seo/pages`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.pages || [];
  } catch {
    return [];
  }
}
