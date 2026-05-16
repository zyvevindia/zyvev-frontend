/**
 * Lightweight SEO QA — duplicate titles, missing meta, canonical, H1 checks.
 */

import { resolveGuideCanonicalPath } from "./legacyCanonicalMap.js";

function stripBrandSuffix(title) {
  return String(title || "").replace(/ \| EVSavari$/, "").trim();
}

const TITLE_WARN_THRESHOLD = 0.85;

function normalizeTitle(title) {
  return stripBrandSuffix(title).toLowerCase().trim();
}

/**
 * @param {Array<{ id: string, title?: string, description?: string, canonical?: string, h1?: string, path?: string }>} pages
 */
export function auditSeoPages(pages = []) {
  const issues = [];
  const warnings = [];
  const titleMap = new Map();

  for (const page of pages) {
    const id = page.id || page.path || "unknown";

    if (!page.title?.trim()) {
      issues.push({
        severity: "error",
        code: "missing_title",
        page: id,
        message: "Missing page title",
      });
    }

    if (!page.description?.trim()) {
      issues.push({
        severity: "error",
        code: "missing_description",
        page: id,
        message: "Missing meta description",
      });
    } else if (page.description.trim().length < 50) {
      warnings.push({
        severity: "warn",
        code: "thin_description",
        page: id,
        message: `Description under 50 chars (${page.description.length})`,
      });
    }

    if (!page.canonical?.trim()) {
      issues.push({
        severity: "error",
        code: "missing_canonical",
        page: id,
        message: "Missing canonical URL",
      });
    } else if (
      page.path &&
      !page.canonical.includes(
        page.path.replace(/^\//, "").split("?")[0]
      ) &&
      !page.canonical.endsWith(page.path)
    ) {
      warnings.push({
        severity: "warn",
        code: "canonical_path_mismatch",
        page: id,
        message: `Canonical may not match path: ${page.canonical}`,
      });
    }

    const h1 = page.h1 || stripBrandSuffix(page.title);
    if (!h1?.trim()) {
      issues.push({
        severity: "error",
        code: "missing_h1",
        page: id,
        message: "Missing H1 (or derivable from title)",
      });
    }

    const norm = normalizeTitle(page.title || "");
    if (norm) {
      const existing = titleMap.get(norm);
      if (existing) {
        warnings.push({
          severity: "warn",
          code: "duplicate_title",
          page: id,
          message: `Duplicate title with ${existing}`,
          duplicateOf: existing,
        });
      } else {
        titleMap.set(norm, id);
      }
    }
  }

  return {
    ok: issues.length === 0,
    issueCount: issues.length,
    warningCount: warnings.length,
    issues,
    warnings,
    pagesAudited: pages.length,
  };
}

/**
 * Dev-only: log audit to console.
 */
/**
 * Discovery manifest + sitemap hardening.
 * @param {object} opts
 * @param {Array<object>} opts.pages
 * @param {string[]} opts.sitemapPaths - expected discovery paths
 * @param {Set<string>} [opts.sitemapLocPaths] - paths from generated manifest
 * @param {string[]} [opts.legacyGuidePaths]
 * @param {string} [opts.siteOrigin]
 */
export function auditDiscoveryManifest({
  pages = [],
  sitemapPaths = [],
  sitemapLocPaths = new Set(),
  legacyGuidePaths = [],
  siteOrigin = "https://evsavari.com",
} = {}) {
  const issues = [];
  const warnings = [];
  const canonicals = new Map();
  const h1s = new Map();
  const pagePaths = new Set(pages.map((p) => p.path));

  for (const page of pages) {
    const id = page.id || page.path || "unknown";

    if (page.canonical) {
      const key = page.canonical.toLowerCase().replace(/\/$/, "");
      const existing = canonicals.get(key);
      if (existing) {
        issues.push({
          severity: "error",
          code: "duplicate_canonical",
          page: id,
          message: `Duplicate canonical URL with ${existing}`,
          duplicateOf: existing,
        });
      } else {
        canonicals.set(key, id);
      }

      if (
        page.path &&
        legacyGuidePaths.includes(page.path) === false &&
        page.path.startsWith("/cars/") &&
        page.path !== page.canonical.replace(siteOrigin, "")
      ) {
        /* legacy path in page.path with discovery canonical is OK */
      }

      const expectedPath = page.contentSlug
        ? resolveGuideCanonicalPath(page.contentSlug)
        : page.path;
      if (
        page.path &&
        expectedPath &&
        page.path !== expectedPath &&
        !page.path.startsWith("/brands/") &&
        !page.path.startsWith("/cities/")
      ) {
        const canonPath = page.canonical.replace(siteOrigin, "");
        if (canonPath !== expectedPath && canonPath !== page.path) {
          warnings.push({
            severity: "warn",
            code: "canonical_path_mismatch",
            page: id,
            message: `Expected canonical path ${expectedPath}, got ${canonPath}`,
          });
        }
      }

      if (page.canonical.includes("/cars/") && page.sitemapEligible) {
        const legacySlugs = [
          "best-evs-",
          "lowest-",
          "easiest-",
          "nexon-ev-vs",
          "comet-ev-vs",
          "best-family",
          "best-city",
        ];
        if (legacySlugs.some((p) => page.canonical.includes(`/cars/${p}`))) {
          issues.push({
            severity: "error",
            code: "legacy_canonical_in_sitemap",
            page: id,
            message: `Sitemap-eligible page still uses legacy /cars/ canonical: ${page.canonical}`,
          });
        }
      }
    }

    const h1 = (page.h1 || stripBrandSuffix(page.title) || "").trim().toLowerCase();
    if (h1) {
      const existingH1 = h1s.get(h1);
      if (existingH1) {
        warnings.push({
          severity: "warn",
          code: "duplicate_h1",
          page: id,
          message: `Duplicate H1 with ${existingH1}`,
          duplicateOf: existingH1,
        });
      } else {
        h1s.set(h1, id);
      }
    }

    if (page.sitemapEligible && page.hasSchemaCandidates === false) {
      issues.push({
        severity: "error",
        code: "missing_schema",
        page: id,
        message: "Missing fields required for JSON-LD (title/canonical)",
      });
    }

    if (
      page.sitemapEligible &&
      page.category !== "compare" &&
      page.internalLinkCount === 0 &&
      page.rankedCount > 0
    ) {
      warnings.push({
        severity: "warn",
        code: "missing_internal_links",
        page: id,
        message: "No internal link signals recorded for ranked guide",
      });
    }

    if (
      page.sitemapEligible &&
      page.category !== "compare" &&
      page.category !== "hub" &&
      page.faqCount === 0
    ) {
      warnings.push({
        severity: "warn",
        code: "empty_faq",
        page: id,
        message: "FAQ section is empty",
      });
    }
  }

  const hubPaths = new Set(["/guides", "/compare"]);
  for (const path of sitemapPaths) {
    if (hubPaths.has(path)) continue;
    if (!pagePaths.has(path)) {
      warnings.push({
        severity: "warn",
        code: "orphan_sitemap_path",
        page: path,
        message: "Expected in sitemap but no content page loaded for QA",
      });
    }
  }

  for (const page of pages) {
    if (page.sitemapEligible && page.path && !sitemapPaths.includes(page.path)) {
      issues.push({
        severity: "error",
        code: "missing_from_sitemap",
        page: page.id || page.path,
        message: `Canonical discovery path missing from sitemap: ${page.path}`,
      });
    }
    if (
      page.sitemapEligible &&
      sitemapLocPaths.size > 0 &&
      !sitemapLocPaths.has(page.path)
    ) {
      issues.push({
        severity: "error",
        code: "missing_from_sitemap_manifest",
        page: page.id || page.path,
        message: `Path not in generated discovery manifest: ${page.path}`,
      });
    }
  }

  for (const legacyPath of legacyGuidePaths) {
    if (sitemapPaths.includes(legacyPath)) {
      issues.push({
        severity: "error",
        code: "legacy_url_in_sitemap",
        page: legacyPath,
        message: "Legacy /cars/ guide URL must not appear in discovery sitemap",
      });
    }
  }

  return {
    ok: issues.length === 0,
    issueCount: issues.length,
    warningCount: warnings.length,
    issues,
    warnings,
  };
}

export function logSeoAudit(result, label = "SEO QA") {
  if (typeof console === "undefined") return;

  const prefix = `[${label}]`;
  console.group(prefix);
  console.log(
    `Pages: ${result.pagesAudited} | Errors: ${result.issueCount} | Warnings: ${result.warningCount}`
  );
  for (const issue of result.issues) {
    console.error(`✗ [${issue.code}] ${issue.page}: ${issue.message}`);
  }
  for (const warn of result.warnings) {
    console.warn(`⚠ [${warn.code}] ${warn.page}: ${warn.message}`);
  }
  console.groupEnd();
}
