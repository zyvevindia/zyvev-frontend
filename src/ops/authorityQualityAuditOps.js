/**
 * Authority editorial quality audit.
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  scoreEditorialQuality,
  detectDuplicatedCopy,
} from "../content/authority/editorialQuality.js";
import { validateAuthorityEditorialPage } from "../content/authority/editorialFramework.js";
import { AUTHORITY_ALL_EDITORIAL_TOPICS } from "../../scripts/content-generators/authorityPages.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

function loadSeo(slug) {
  const path = join(ROOT, "public/seo-data", `${slug}.json`);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")).seoPage;
  } catch {
    return null;
  }
}

export function generateAuthorityQualityAuditReport() {
  const pages = [];
  const failures = [];

  for (const topic of AUTHORITY_ALL_EDITORIAL_TOPICS) {
    const seoPage = loadSeo(topic.contentSlug);
    if (!seoPage) {
      failures.push({ topic: topic.id, code: "missing_json" });
      continue;
    }
    const editorial = validateAuthorityEditorialPage(seoPage);
    const quality = scoreEditorialQuality(seoPage);
    const internalLinks = countInternalLinks(seoPage);
    pages.push({
      id: topic.id,
      slug: topic.contentSlug,
      cluster: topic.learningPathwayId || topic.cluster,
      editorialOk: editorial.ok,
      qualityScore: quality.qualityScore,
      readabilityScore: quality.readabilityScore,
      calmToneScore: quality.calmToneScore,
      internalLinkCount: internalLinks,
      issues: [...editorial.issues.map((i) => i.code), ...quality.issues.map((i) => i.code)],
    });
  }

  const dupes = detectDuplicatedCopy(pages.map((p) => loadSeo(
    AUTHORITY_ALL_EDITORIAL_TOPICS.find((t) => t.id === p.id)?.contentSlug
  )).filter(Boolean));

  const avgQuality = Math.round(
    pages.reduce((s, p) => s + p.qualityScore, 0) / Math.max(pages.length, 1)
  );
  const avgLinks = Math.round(
    pages.reduce((s, p) => s + p.internalLinkCount, 0) / Math.max(pages.length, 1)
  );

  return {
    generatedAt: new Date().toISOString(),
    reportType: "authority-quality",
    pageCount: pages.length,
    avgQualityScore: avgQuality,
    avgInternalLinkDensity: avgLinks,
    duplicatedCopy: dupes,
    pages: pages.sort((a, b) => a.qualityScore - b.qualityScore),
    failures,
    summary: {
      passCount: pages.filter((p) => p.qualityScore >= 70 && p.editorialOk).length,
      hypeIssues: pages.filter((p) => p.issues.includes("hype_language")).length,
      weakFaqPages: pages.filter((p) => p.issues.includes("weak_faqs")).length,
    },
  };
}

function countInternalLinks(seoPage) {
  let n = 0;
  for (const s of seoPage.editorialSections || []) {
    n += (s.links || []).length;
  }
  n += (seoPage.compareSupportLinks || []).length;
  for (const block of seoPage.relatedLinks || []) {
    n += (block.links || []).length;
  }
  return n;
}

export function authorityQualityAuditMarkdown(report) {
  const lines = [
    "# Authority quality audit",
    "",
    `Avg quality: **${report.avgQualityScore}/100**`,
    `Avg internal links: **${report.avgInternalLinkDensity}**`,
    `Pass (≥70): **${report.summary?.passCount}/${report.pageCount}**`,
    "",
    "| Page | Quality | Readability | Links |",
    "| --- | --- | --- | --- |",
  ];
  for (const p of (report.pages || []).slice(0, 20)) {
    lines.push(
      `| ${p.id} | ${p.qualityScore} | ${p.readabilityScore} | ${p.internalLinkCount} |`
    );
  }
  return lines.join("\n");
}
