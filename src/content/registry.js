/**
 * Central content registry — runtime access to generated manifest.
 */

import {
  CONTENT_REGISTRY_ENTRIES,
  GENERATED_CITY_SLUGS,
  GENERATED_COMPARE_SLUGS,
  GENERATED_OWNERSHIP_GUIDE_TO_SLUG,
  GENERATED_BEST_EVS_USE_CASE_TO_SLUG,
  CONTENT_REGISTRY_GENERATED_AT,
} from "./generated/manifest.js";

export {
  CONTENT_REGISTRY_ENTRIES,
  GENERATED_CITY_SLUGS,
  GENERATED_COMPARE_SLUGS,
  GENERATED_OWNERSHIP_GUIDE_TO_SLUG,
  GENERATED_BEST_EVS_USE_CASE_TO_SLUG,
  CONTENT_REGISTRY_GENERATED_AT,
};

const pathIndex = new Map(
  CONTENT_REGISTRY_ENTRIES.map((e) => [e.path, e])
);

const slugIndex = new Map(
  CONTENT_REGISTRY_ENTRIES.map((e) => [e.contentSlug, e])
);

export function getRegistryEntryByPath(path) {
  return pathIndex.get(path) || null;
}

export function getRegistryEntryByContentSlug(slug) {
  return slugIndex.get(slug) || null;
}

export function listRegistryEntriesByType(pageType) {
  return CONTENT_REGISTRY_ENTRIES.filter((e) => e.pageType === pageType);
}

export function enforceCanonicalPath(entry) {
  if (!entry?.path || !entry?.canonicalUrl) return null;
  const origin = entry.canonicalUrl.replace(entry.path, "");
  return `${origin}${entry.path}`;
}

export function validateRegistryClient() {
  const issues = [];
  const paths = new Set();
  const titles = new Set();

  for (const entry of CONTENT_REGISTRY_ENTRIES) {
    if (paths.has(entry.path)) {
      issues.push({ code: "duplicate_path", id: entry.id });
    }
    paths.add(entry.path);

    const titleKey = entry.title?.toLowerCase();
    if (titleKey && titles.has(titleKey)) {
      issues.push({ code: "duplicate_title", id: entry.id });
    }
    if (titleKey) titles.add(titleKey);
  }

  return { ok: issues.length === 0, issues, count: CONTENT_REGISTRY_ENTRIES.length };
}
