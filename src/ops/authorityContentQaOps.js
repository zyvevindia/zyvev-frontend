/**
 * Authority populated content QA — editorial completeness + links.
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { AUTHORITY_ALL_EDITORIAL_TOPICS } from "../../scripts/content-generators/authorityPages.mjs";
import { scoreEditorialQuality } from "../content/authority/editorialQuality.js";
import { validateAuthorityEditorialPage } from "../content/authority/editorialFramework.js";
import { buildCompareSupportAuthorityAudit } from "../content/authority/compareSupport.js";
import { CONTENT_REGISTRY_ENTRIES } from "../content/registry.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

const INTERNAL_PATH_RE =
  /^\/(compare|guides|cars|discover|charging-guides|ownership-guides|best-evs|cities)(\/|$)/;

function loadSeoJson(contentSlug) {
  const rel = join(ROOT, "public/seo-data", `${contentSlug}.json`);
  if (!existsSync(rel)) return null;
  try {
    const raw = JSON.parse(readFileSync(rel, "utf8"));
    return raw.seoPage || raw;
  } catch {
    return null;
  }
}

function collectHrefs(seoPage) {
  const hrefs = [];
  for (const section of seoPage.editorialSections || []) {
    for (const link of section.links || []) {
      if (link.href) hrefs.push(link.href);
    }
  }
  for (const block of seoPage.relatedLinks || []) {
    for (const link of block.links || []) {
      if (link.href) hrefs.push(link.href);
    }
  }
  for (const link of seoPage.compareSupportLinks || []) {
    if (link.href) hrefs.push(link.href);
  }
  if (seoPage.cta?.href) hrefs.push(seoPage.cta.href);
  return hrefs;
}

function registryHasPath(path) {
  return CONTENT_REGISTRY_ENTRIES.some((e) => e.path === path);
}

/**
 * @param {object} [_ctx]
 */
export function generateAuthorityContentQaReport(_ctx = {}) {
  const topicResults = [];
  const failures = [];
  const warnings = [];

  for (const topic of AUTHORITY_ALL_EDITORIAL_TOPICS) {
    const seoPage = loadSeoJson(topic.contentSlug);
    const row = {
      id: topic.id,
      contentSlug: topic.contentSlug,
      path: topic.path,
      fileExists: Boolean(seoPage),
      registryOk: registryHasPath(topic.path),
    };

    if (!seoPage) {
      failures.push({ id: "missing_json", topic: topic.id });
      topicResults.push({ ...row, ok: false, issues: ["missing_json"] });
      continue;
    }

    const editorial = validateAuthorityEditorialPage(seoPage);
    row.editorialScore = editorial.completenessScore;
    row.editorialOk = editorial.ok;

    const hrefs = collectHrefs(seoPage);
    const brokenLinks = hrefs.filter(
      (href) =>
        href.startsWith("/") &&
        INTERNAL_PATH_RE.test(href) &&
        !registryHasPath(href) &&
        !href.startsWith("/discover/") &&
        !href.startsWith("/compare") &&
        href !== "/guides" &&
        href !== "/cars"
    );
    row.brokenLinkCount = brokenLinks.length;

    const issues = [
      ...editorial.issues.map((i) => i.code),
      ...(!row.registryOk ? ["registry_missing"] : []),
      ...(brokenLinks.length ? ["broken_internal_links"] : []),
    ];

    if (!editorial.ok) {
      warnings.push({ id: "editorial_incomplete", topic: topic.id, issues: editorial.issues });
    }
    if (brokenLinks.length) {
      warnings.push({
        id: "broken_links",
        topic: topic.id,
        links: brokenLinks.slice(0, 5),
      });
    }
    if (!row.registryOk) {
      failures.push({ id: "registry_missing", topic: topic.id });
    }

    row.ok = issues.length === 0 || (editorial.ok && row.registryOk);
    row.issues = issues;
    topicResults.push(row);
  }

  const compareSupport = buildCompareSupportAuthorityAudit();
  const weakCompare = compareSupport.weakPairs || [];

  if (weakCompare.length) {
    warnings.push({
      id: "compare_support_weak",
      count: weakCompare.length,
      pairs: weakCompare.slice(0, 6),
    });
  }

  const ok =
    failures.length === 0 &&
    topicResults.filter((t) => t.fileExists).length ===
      AUTHORITY_ALL_EDITORIAL_TOPICS.length;

  return {
    generatedAt: new Date().toISOString(),
    reportType: "authority-content-qa",
    ok,
    topicCount: AUTHORITY_ALL_EDITORIAL_TOPICS.length,
    topics: topicResults,
    failures,
    warnings,
    compareSupport: compareSupport.summary,
    summary: {
      filesPresent: topicResults.filter((t) => t.fileExists).length,
      editorialPass: topicResults.filter((t) => t.editorialOk).length,
      registryPass: topicResults.filter((t) => t.registryOk).length,
      failureCount: failures.length,
      warningCount: warnings.length,
    },
  };
}

export function authorityContentQaMarkdown(report) {
  const lines = [
    "# Authority content QA",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `**Status:** ${report.ok ? "PASS" : "ATTENTION"}`,
    "",
    `- Files present: **${report.summary?.filesPresent}/${report.topicCount}**`,
    `- Editorial pass: **${report.summary?.editorialPass}**`,
    `- Registry pass: **${report.summary?.registryPass}**`,
    `- Failures: **${report.summary?.failureCount}**`,
    `- Warnings: **${report.summary?.warningCount}**`,
    "",
    "| Topic | File | Editorial | Registry |",
    "| --- | --- | --- | --- |",
  ];
  for (const t of report.topics || []) {
    lines.push(
      `| ${t.id} | ${t.fileExists ? "yes" : "no"} | ${t.editorialOk ? "ok" : "review"} | ${t.registryOk ? "yes" : "no"} |`
    );
  }
  return lines.join("\n");
}
