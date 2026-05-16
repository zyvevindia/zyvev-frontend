import { uniqueStrings } from "./utils.mjs";

/**
 * @typedef {object} RegistryEntry
 * @property {string} id
 * @property {string} pageType
 * @property {string} contentSlug
 * @property {string} path
 * @property {string} canonicalUrl
 * @property {string} title
 * @property {string} h1
 * @property {string} [filePath]
 */

export function validateRegistry(entries) {
  const issues = [];
  const warnings = [];
  const paths = new Map();
  const slugs = new Map();
  const titles = new Map();
  const h1s = new Map();

  for (const entry of entries) {
    if (!entry.path?.startsWith("/")) {
      issues.push({ code: "invalid_path", id: entry.id, message: entry.path });
    }
    if (!entry.canonicalUrl?.startsWith("http")) {
      issues.push({
        code: "invalid_canonical",
        id: entry.id,
        message: entry.canonicalUrl,
      });
    }
    if (entry.path && entry.canonicalUrl && !entry.canonicalUrl.endsWith(entry.path)) {
      issues.push({
        code: "canonical_path_mismatch",
        id: entry.id,
        message: `${entry.canonicalUrl} vs ${entry.path}`,
      });
    }

    for (const [map, key, label] of [
      [paths, entry.path, "duplicate_path"],
      [slugs, entry.contentSlug, "duplicate_content_slug"],
      [titles, entry.title?.toLowerCase(), "duplicate_title"],
      [h1s, entry.h1?.toLowerCase(), "duplicate_h1"],
    ]) {
      if (!key) continue;
      if (map.has(key)) {
        issues.push({
          code: label,
          id: entry.id,
          message: `Conflicts with ${map.get(key)}`,
        });
      } else {
        map.set(key, entry.id);
      }
    }
  }

  return {
    ok: issues.length === 0,
    issues,
    warnings,
    count: entries.length,
  };
}

export function entryFromSeoPage(seoPage, meta) {
  return {
    id: meta.id,
    pageType: meta.pageType,
    contentSlug: seoPage.slug,
    path: meta.path,
    canonicalUrl: seoPage.canonicalUrl,
    title: seoPage.title,
    h1: meta.h1,
    filePath: meta.filePath,
  };
}

export function mergeRegistryEntries(...groups) {
  return groups.flat();
}

export function listUniqueCompareSlugs(pairs) {
  return uniqueStrings(
    pairs.map(([a, b]) => `${a}-vs-${b}`)
  );
}
