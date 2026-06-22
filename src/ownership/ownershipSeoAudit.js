/**
 * Static SEO audit for the ownership page ecosystem.
 * Utility only — not imported by runtime app code.
 *
 * Node-safe: avoids imports that chain through browser/config modules.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { TIER1_MODEL_FAMILY_SLUGS } from "../data/tier1ModelFamilies.js";
import {
  buildOwnershipHubBreadcrumbs,
  buildOwnershipVehicleIndexBreadcrumbs,
  buildOwnershipVehicleTopicBreadcrumbs,
  OWNERSHIP_HUB_PATH,
  OWNERSHIP_VEHICLE_INDEX_PATH,
} from "./ownershipBreadcrumbs.js";
import { buildReviewSlug, reviewPagePath } from "../reviews/reviewRoutes.js";
import { buildOwnershipSitemapEntries } from "../seo/sitemap.js";

/** Hub example question URLs used for internal-link coverage (Nexon EV). */
const HUB_QUESTION_EXAMPLE_PATHS = Object.freeze([
  "/ownership/tata-nexon-ev/how-much-does-it-cost-to-run",
  "/ownership/tata-nexon-ev/ownership-cost",
  "/ownership/tata-nexon-ev/how-much-can-you-save",
  "/ownership/tata-nexon-ev/emi-calculator",
]);

/** Hub example standard URLs used for internal-link coverage. */
const HUB_STANDARD_EXAMPLE_PATHS = Object.freeze([
  "/ownership/tata-nexon-ev/running-cost",
  "/ownership/tata-nexon-ev/tco",
  "/ownership/tata-nexon-ev/petrol-savings",
  "/ownership/tata-nexon-ev/emi",
  "/ownership/byd-seal/running-cost",
  "/ownership/mahindra-be-6/tco",
  "/ownership/mg-comet-ev/petrol-savings",
  "/ownership/byd-seal/emi",
]);

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

export const EXPECTED_OWNERSHIP_SITEMAP_URL_COUNT = 202;

/** @typedef {"error"|"warning"} OwnershipAuditSeverity */
/** @typedef {{ code: string, severity: OwnershipAuditSeverity, message: string, path?: string }} OwnershipAuditIssue */

const VALIDATION_SLUGS = Object.freeze([
  "tata-nexon-ev",
  "mg-comet-ev",
  "byd-seal",
  "mahindra-be-6",
]);

/** Keep in sync with ownershipRoutes.js */
const STANDARD_PAGE_SEGMENTS = Object.freeze({
  "running-cost": {
    titleSuffix: "Running Cost",
    breadcrumbLabel: "Running cost",
  },
  tco: {
    titleSuffix: "Ownership Cost",
    breadcrumbLabel: "Ownership cost",
  },
  "petrol-savings": {
    titleSuffix: "Petrol Savings",
    breadcrumbLabel: "Petrol savings",
  },
  emi: {
    titleSuffix: "EMI",
    breadcrumbLabel: "EMI calculator",
  },
});

/** Keep in sync with ownershipQuestionRoutes.js */
const QUESTION_PAGE_SEGMENTS = Object.freeze({
  "how-much-does-it-cost-to-run": {
    standardPageType: "running-cost",
    titleTemplate: "How much does {vehicle} cost to run?",
    breadcrumbLabel: "Running cost",
  },
  "ownership-cost": {
    standardPageType: "tco",
    titleTemplate: "What is {vehicle} ownership cost?",
    breadcrumbLabel: "Ownership cost",
  },
  "how-much-can-you-save": {
    standardPageType: "petrol-savings",
    titleTemplate: "How much can {vehicle} save compared with petrol?",
    breadcrumbLabel: "Petrol savings",
  },
  "emi-calculator": {
    standardPageType: "emi",
    titleTemplate: "What is the {vehicle} EMI?",
    breadcrumbLabel: "EMI calculator",
  },
});

const STANDARD_TITLE_SUFFIXES = Object.freeze([
  "Running Cost",
  "Ownership Cost",
  "Petrol Savings",
  "EMI",
]);

const STANDARD_SCHEMA_TYPES = Object.freeze([
  "BreadcrumbList",
  "Article",
  "Vehicle",
  "FAQPage",
]);

const QUESTION_SCHEMA_TYPES = Object.freeze([
  ...STANDARD_SCHEMA_TYPES,
  "QAPage",
]);

const HUB_SCHEMA_TYPES = Object.freeze([
  "BreadcrumbList",
  "CollectionPage",
  "ItemList",
]);

/**
 * @param {string} slug
 * @returns {string}
 */
function normalizeSlug(slug) {
  return String(slug || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

/**
 * @param {string} slug
 * @returns {string}
 */
function vehicleFamilyPath(slug) {
  const normalized = normalizeSlug(slug);
  return normalized ? `/cars/${normalized}` : "/cars";
}

/**
 * @param {string} slug
 * @param {string} segment
 * @returns {string}
 */
function ownershipTopicPath(slug, segment) {
  const normalized = normalizeSlug(slug);
  return normalized ? `/ownership/${normalized}/${segment}` : "/ownership";
}

/**
 * @param {string} siteOrigin
 * @returns {string[]}
 */
export function listAllOwnershipPaths(siteOrigin) {
  return buildOwnershipSitemapEntries(siteOrigin).map((entry) => entry.path);
}

/**
 * @param {string} template
 * @param {string} vehicleName
 * @returns {string}
 */
function formatQuestionTitle(template, vehicleName) {
  return String(template).replace(/\{vehicle\}/g, vehicleName);
}

/**
 * @param {string} siteOrigin
 * @returns {Map<string, Set<string>>}
 */
function buildOwnershipLinkGraph(siteOrigin) {
  const graph = new Map();

  const addLinks = (fromPath, targets) => {
    if (!graph.has(fromPath)) graph.set(fromPath, new Set());
    for (const target of targets) {
      graph.get(fromPath).add(target);
    }
  };

  addLinks(OWNERSHIP_HUB_PATH, [
    OWNERSHIP_VEHICLE_INDEX_PATH,
    "/tools",
    "/cars",
    ...HUB_STANDARD_EXAMPLE_PATHS,
    ...HUB_QUESTION_EXAMPLE_PATHS,
    "/tools/cost-per-km",
    "/tools/tco",
    "/tools/savings-vs-petrol",
    "/tools/emi",
  ]);

  addLinks(OWNERSHIP_VEHICLE_INDEX_PATH, [
    OWNERSHIP_HUB_PATH,
    "/tools",
    "/cars",
  ]);

  for (const slug of TIER1_MODEL_FAMILY_SLUGS) {
    const standardPaths = Object.keys(STANDARD_PAGE_SEGMENTS).map((segment) =>
      ownershipTopicPath(slug, segment)
    );
    const questionPaths = Object.keys(QUESTION_PAGE_SEGMENTS).map((segment) =>
      ownershipTopicPath(slug, segment)
    );

    addLinks(OWNERSHIP_VEHICLE_INDEX_PATH, standardPaths);

    for (const [segment, config] of Object.entries(STANDARD_PAGE_SEGMENTS)) {
      const path = ownershipTopicPath(slug, segment);
      const questionSegment = Object.entries(QUESTION_PAGE_SEGMENTS).find(
        ([, questionConfig]) => questionConfig.standardPageType === segment
      )?.[0];

      addLinks(path, [
        vehicleFamilyPath(slug),
        reviewPagePath(buildReviewSlug(slug)),
        OWNERSHIP_HUB_PATH,
        OWNERSHIP_VEHICLE_INDEX_PATH,
        "/tools",
        ...standardPaths.filter((href) => href !== path),
        ...(questionSegment
          ? [ownershipTopicPath(slug, questionSegment)]
          : []),
      ]);
    }

    for (const [segment, config] of Object.entries(QUESTION_PAGE_SEGMENTS)) {
      const path = ownershipTopicPath(slug, segment);
      addLinks(path, [
        vehicleFamilyPath(slug),
        reviewPagePath(buildReviewSlug(slug)),
        OWNERSHIP_HUB_PATH,
        OWNERSHIP_VEHICLE_INDEX_PATH,
        "/tools",
        ownershipTopicPath(slug, config.standardPageType),
        ...questionPaths.filter((href) => href !== path),
      ]);
    }
  }

  return graph;
}

/**
 * @param {string} targetPath
 * @param {Map<string, Set<string>>} graph
 * @returns {boolean}
 */
function hasInboundLink(targetPath, graph) {
  for (const targets of graph.values()) {
    if (targets.has(targetPath)) return true;
  }
  return false;
}

/**
 * @param {{ siteOrigin?: string, sampleSlugs?: string[] }} [options]
 * @returns {{
 *   passed: boolean,
 *   issueCount: number,
 *   warningCount: number,
 *   issues: OwnershipAuditIssue[],
 *   warnings: OwnershipAuditIssue[],
 *   stats: Record<string, number>,
 * }}
 */
export function auditOwnershipSeo(options = {}) {
  const siteOrigin = String(
    options.siteOrigin ||
      process.env.VITE_SITE_ORIGIN ||
      "https://evsavari.com"
  ).replace(/\/$/, "");
  const sampleSlugs = options.sampleSlugs || VALIDATION_SLUGS;
  /** @type {OwnershipAuditIssue[]} */
  const issues = [];
  /** @type {OwnershipAuditIssue[]} */
  const warnings = [];

  const pushIssue = (issue) => issues.push(issue);

  const sitemapEntries = buildOwnershipSitemapEntries(siteOrigin);
  const paths = sitemapEntries.map((entry) => entry.path);
  const uniquePaths = new Set(paths);

  if (paths.length !== EXPECTED_OWNERSHIP_SITEMAP_URL_COUNT) {
    pushIssue({
      code: "sitemap_count_mismatch",
      severity: "error",
      message: `Expected ${EXPECTED_OWNERSHIP_SITEMAP_URL_COUNT} ownership sitemap URLs, found ${paths.length}.`,
    });
  }

  if (uniquePaths.size !== paths.length) {
    pushIssue({
      code: "sitemap_duplicate_paths",
      severity: "error",
      message: "Duplicate paths detected in ownership sitemap entries.",
    });
  }

  for (const requiredPath of [OWNERSHIP_HUB_PATH, OWNERSHIP_VEHICLE_INDEX_PATH]) {
    if (!uniquePaths.has(requiredPath)) {
      pushIssue({
        code: "sitemap_missing_hub",
        severity: "error",
        message: `Missing hub path in sitemap: ${requiredPath}`,
        path: requiredPath,
      });
    }
  }

  const questionPathCount = paths.filter((path) =>
    Object.keys(QUESTION_PAGE_SEGMENTS).some((segment) =>
      path.endsWith(`/${segment}`)
    )
  ).length;
  if (questionPathCount !== TIER1_MODEL_FAMILY_SLUGS.length * 4) {
    pushIssue({
      code: "sitemap_question_count",
      severity: "error",
      message: `Expected ${TIER1_MODEL_FAMILY_SLUGS.length * 4} question ownership URLs in sitemap, found ${questionPathCount}.`,
    });
  }

  try {
    const robots = readFileSync(join(ROOT, "public", "robots.txt"), "utf8");
    if (!/Allow:\s*\/ownership\//m.test(robots)) {
      pushIssue({
        code: "robots_ownership_disallow",
        severity: "error",
        message: "robots.txt does not allow crawling /ownership/.",
      });
    }
  } catch {
    pushIssue({
      code: "robots_missing",
      severity: "error",
      message: "public/robots.txt is missing.",
    });
  }

  const canonicalRegistry = new Map();
  const registerCanonical = (path, canonical) => {
    if (!canonical) {
      pushIssue({
        code: "canonical_missing",
        severity: "error",
        message: "Missing canonical URL.",
        path,
      });
      return;
    }
    if (canonicalRegistry.has(canonical) && canonicalRegistry.get(canonical) !== path) {
      pushIssue({
        code: "canonical_duplicate",
        severity: "error",
        message: `Duplicate canonical ${canonical} for ${path} and ${canonicalRegistry.get(canonical)}.`,
        path,
      });
    }
    canonicalRegistry.set(canonical, path);
  };

  registerCanonical(OWNERSHIP_HUB_PATH, `${siteOrigin}${OWNERSHIP_HUB_PATH}`);
  registerCanonical(
    OWNERSHIP_VEHICLE_INDEX_PATH,
    `${siteOrigin}${OWNERSHIP_VEHICLE_INDEX_PATH}`
  );

  if (buildOwnershipHubBreadcrumbs().length !== 2) {
    pushIssue({
      code: "breadcrumb_hub_length",
      severity: "error",
      message: "Ownership hub breadcrumbs must contain Home and Ownership.",
    });
  }

  if (buildOwnershipVehicleIndexBreadcrumbs().length !== 3) {
    pushIssue({
      code: "breadcrumb_index_length",
      severity: "error",
      message:
        "Vehicle ownership index breadcrumbs must contain Home, Ownership, and Vehicle Ownership.",
    });
  }

  for (const slug of sampleSlugs) {
    const vehicleName = slug
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

    for (const [segment, config] of Object.entries(STANDARD_PAGE_SEGMENTS)) {
      const path = ownershipTopicPath(slug, segment);
      const canonical = `${siteOrigin}${path}`;
      registerCanonical(path, canonical);

      const title = `${vehicleName} ${config.titleSuffix}`;
      if (!title.includes(config.titleSuffix)) {
        pushIssue({
          code: "metadata_title_suffix",
          severity: "error",
          message: `Standard title for ${path} must include "${config.titleSuffix}".`,
          path,
        });
      }

      const breadcrumbs = buildOwnershipVehicleTopicBreadcrumbs({
        vehicleName,
        pageLabel: config.breadcrumbLabel,
        pagePath: path,
      });
      if (breadcrumbs.length !== 4) {
        pushIssue({
          code: "breadcrumb_vehicle_length",
          severity: "error",
          message: `Vehicle ownership breadcrumbs must have 4 levels for ${path}.`,
          path,
        });
      }

      if (breadcrumbs[2]?.name !== "Vehicle Ownership") {
        pushIssue({
          code: "breadcrumb_vehicle_index_label",
          severity: "error",
          message: `Missing Vehicle Ownership breadcrumb on ${path}.`,
          path,
        });
      }
    }

    for (const [segment, config] of Object.entries(QUESTION_PAGE_SEGMENTS)) {
      const path = ownershipTopicPath(slug, segment);
      const canonical = `${siteOrigin}${path}`;
      registerCanonical(path, canonical);

      const title = formatQuestionTitle(config.titleTemplate, vehicleName);
      if (!title.includes(vehicleName.split(" ")[0])) {
        pushIssue({
          code: "metadata_question_title",
          severity: "error",
          message: `Question title for ${path} must include vehicle name.`,
          path,
        });
      }

      const breadcrumbs = buildOwnershipVehicleTopicBreadcrumbs({
        vehicleName,
        pageLabel: config.breadcrumbLabel,
        pagePath: path,
      });
      if (breadcrumbs.length !== 4) {
        pushIssue({
          code: "breadcrumb_question_length",
          severity: "error",
          message: `Question ownership breadcrumbs must have 4 levels for ${path}.`,
          path,
        });
      }
    }
  }

  for (const suffix of STANDARD_TITLE_SUFFIXES) {
    const represented = Object.values(STANDARD_PAGE_SEGMENTS).some(
      (config) => config.titleSuffix === suffix
    );
    if (!represented) {
      pushIssue({
        code: "metadata_suffix_registry",
        severity: "error",
        message: `Missing standard ownership title suffix: ${suffix}.`,
      });
    }
  }

  if (HUB_SCHEMA_TYPES.length !== 3) {
    pushIssue({
      code: "schema_hub_registry",
      severity: "error",
      message: "Hub schema type registry is incomplete.",
    });
  }

  if (QUESTION_SCHEMA_TYPES.length !== STANDARD_SCHEMA_TYPES.length + 1) {
    pushIssue({
      code: "schema_question_registry",
      severity: "error",
      message: "Question schema type registry is incomplete.",
    });
  }

  const linkGraph = buildOwnershipLinkGraph(siteOrigin);
  for (const path of paths) {
    if (path === OWNERSHIP_HUB_PATH) continue;
    if (!hasInboundLink(path, linkGraph)) {
      pushIssue({
        code: "orphan_ownership_page",
        severity: "error",
        message: `No inbound internal links found for ${path}.`,
        path,
      });
    }
  }

  for (const slug of VALIDATION_SLUGS) {
    for (const segment of Object.keys(STANDARD_PAGE_SEGMENTS)) {
      const path = ownershipTopicPath(slug, segment);
      if (!uniquePaths.has(path)) {
        pushIssue({
          code: "validation_slug_missing_standard",
          severity: "error",
          message: `Validation slug missing standard ownership URL: ${path}`,
          path,
        });
      }
    }
    for (const segment of Object.keys(QUESTION_PAGE_SEGMENTS)) {
      const path = ownershipTopicPath(slug, segment);
      if (!uniquePaths.has(path)) {
        pushIssue({
          code: "validation_slug_missing_question",
          severity: "error",
          message: `Validation slug missing question ownership URL: ${path}`,
          path,
        });
      }
    }
  }

  return {
    passed: issues.length === 0,
    issueCount: issues.length,
    warningCount: warnings.length,
    issues,
    warnings,
    stats: {
      sitemapUrls: paths.length,
      uniqueSitemapUrls: uniquePaths.size,
      canonicalUrls: canonicalRegistry.size,
      validationSlugs: sampleSlugs.length,
      questionSitemapUrls: questionPathCount,
    },
  };
}

/**
 * @param {ReturnType<typeof auditOwnershipSeo>} report
 * @returns {string}
 */
export function formatOwnershipSeoAuditReport(report) {
  const lines = [
    `Ownership SEO audit: ${report.passed ? "PASSED" : "FAILED"}`,
    `Sitemap URLs: ${report.stats.sitemapUrls}`,
    `Question sitemap URLs: ${report.stats.questionSitemapUrls}`,
    `Canonical URLs checked: ${report.stats.canonicalUrls}`,
    `Errors: ${report.issueCount}`,
    `Warnings: ${report.warningCount}`,
  ];

  if (report.issues.length) {
    lines.push("", "Errors:");
    for (const issue of report.issues) {
      lines.push(`- [${issue.code}] ${issue.message}`);
    }
  }

  if (report.warnings.length) {
    lines.push("", "Warnings:");
    for (const warning of report.warnings) {
      lines.push(`- [${warning.code}] ${warning.message}`);
    }
  }

  return lines.join("\n");
}
