/**
 * Beginner EV education completeness audit.
 */

import { BEGINNER_EV_TOPICS } from "../content/authority/beginnerTopics.js";
import { AUTHORITY_CLUSTER_ID, READINESS_STATUS } from "../content/authority/metadata.js";
import { isAuthorityTopicRouteReady } from "../content/authority/routeReadiness.js";
import { validateAuthorityEditorialPage } from "../content/authority/editorialFramework.js";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

function loadEditorial(slug) {
  if (!slug) return null;
  const path = join(ROOT, "public/seo-data", `${slug}.json`);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")).seoPage;
  } catch {
    return null;
  }
}

export function generateAuthorityBeginnerAuditReport() {
  const topics = BEGINNER_EV_TOPICS.map((t) => {
    const sectionsOk = (t.reviewSections?.length ?? 0) >= 4;
    const route = isAuthorityTopicRouteReady(t);
    const seoPage = loadEditorial(t.contentSlug);
    const editorialQa = seoPage
      ? validateAuthorityEditorialPage(seoPage)
      : { ok: false, issues: [{ code: "no_editorial_json" }] };
    const complete =
      Boolean(seoPage) &&
      editorialQa.ok &&
      route &&
      sectionsOk &&
      t.compareSupportRelevance !== "none";
    return {
      id: t.id,
      title: t.title,
      readiness: t.readiness,
      canonicalPath: t.canonicalPath || null,
      routeReady: route,
      reviewSections: t.reviewSections?.length ?? 0,
      compareSupportRelevance: t.compareSupportRelevance,
      complete,
      editorialScore: editorialQa.completenessScore,
      editorialOk: editorialQa.ok,
      gaps: [
        !seoPage ? "no_editorial_json" : null,
        !editorialQa.ok ? "editorial_incomplete" : null,
        !sectionsOk ? "thin_outline" : null,
        !route ? "no_live_route" : null,
        t.readiness === READINESS_STATUS.STRUCTURED ? "needs_editorial_page" : null,
      ].filter(Boolean),
    };
  });

  const complete = topics.filter((t) => t.complete).length;
  const percent = Math.round(
    (complete / Math.max(BEGINNER_EV_TOPICS.length, 1)) * 100
  );

  return {
    generatedAt: new Date().toISOString(),
    reportType: "authority-beginner-completeness",
    cluster: AUTHORITY_CLUSTER_ID.BEGINNER_EDUCATION,
    topics,
    summary: {
      total: BEGINNER_EV_TOPICS.length,
      complete,
      completenessPercent: percent,
      needsReview: topics.filter((t) => !t.complete).map((t) => t.id),
    },
  };
}

export function authorityBeginnerAuditMarkdown(report) {
  const lines = [
    "# Beginner EV education audit",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `- Completeness: **${report.summary?.completenessPercent}%** (${report.summary?.complete}/${report.summary?.total})`,
    "",
    "| Topic | Readiness | Route | Sections |",
    "| --- | --- | --- | --- |",
  ];
  for (const t of report.topics || []) {
    lines.push(
      `| ${t.title} | ${t.readiness} | ${t.routeReady ? "yes" : "no"} | ${t.reviewSections} |`
    );
  }
  if (report.summary?.needsReview?.length) {
    lines.push("", "## Needs work", "", report.summary.needsReview.join(", "));
  }
  return lines.join("\n");
}
