/**
 * Charging guide completeness audit.
 */

import {
  CHARGING_GUIDE_TOPICS,
  CHARGING_GUIDE_TAXONOMY,
  CHARGING_INTENT_MAP,
  CHARGING_FAQ_STRUCTURE,
} from "../content/authority/chargingTopics.js";
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

export function generateAuthorityChargingAuditReport() {
  const topics = CHARGING_GUIDE_TOPICS.map((t) => {
    const route = isAuthorityTopicRouteReady(t);
    const inTaxonomy = Object.values(CHARGING_GUIDE_TAXONOMY).some((bucket) =>
      bucket.topicIds.includes(t.id)
    );
    const intents = CHARGING_INTENT_MAP.filter((m) =>
      m.topicIds.includes(t.id)
    ).map((m) => m.intent);
    const seoPage = loadEditorial(t.contentSlug);
    const editorialQa = seoPage
      ? validateAuthorityEditorialPage(seoPage)
      : { ok: false, issues: [{ code: "no_editorial_json" }] };
    const complete =
      Boolean(seoPage) && editorialQa.ok && route && inTaxonomy;
    return {
      id: t.id,
      title: t.title,
      readiness: t.readiness,
      canonicalPath: t.canonicalPath || null,
      routeReady: route,
      inTaxonomy,
      intents,
      complete,
      editorialOk: editorialQa.ok,
      editorialScore: editorialQa.completenessScore,
      gaps: [
        !seoPage ? "no_editorial_json" : null,
        !editorialQa.ok ? "editorial_incomplete" : null,
        !inTaxonomy ? "missing_taxonomy" : null,
        !route ? "no_live_route" : null,
        t.readiness === READINESS_STATUS.STRUCTURED ? "needs_editorial_page" : null,
      ].filter(Boolean),
    };
  });

  const complete = topics.filter((t) => t.complete).length;
  const percent = Math.round(
    (complete / Math.max(CHARGING_GUIDE_TOPICS.length, 1)) * 100
  );

  const taxonomyCoverage = Object.entries(CHARGING_GUIDE_TAXONOMY).map(
    ([key, bucket]) => ({
      key,
      label: bucket.label,
      topics: bucket.topicIds.length,
      published: bucket.topicIds.filter((id) => {
        const t = CHARGING_GUIDE_TOPICS.find((x) => x.id === id);
        return (
          t?.readiness === READINESS_STATUS.PUBLISHED &&
          isAuthorityTopicRouteReady(t)
        );
      }).length,
    })
  );

  return {
    generatedAt: new Date().toISOString(),
    reportType: "authority-charging-completeness",
    cluster: AUTHORITY_CLUSTER_ID.CHARGING_GUIDES,
    taxonomy: taxonomyCoverage,
    intentMapCount: CHARGING_INTENT_MAP.length,
    faqTemplateCount: CHARGING_FAQ_STRUCTURE.templates.length,
    schemaType: CHARGING_FAQ_STRUCTURE.schemaType,
    topics,
    summary: {
      total: CHARGING_GUIDE_TOPICS.length,
      complete,
      completenessPercent: percent,
      needsReview: topics.filter((t) => !t.complete).map((t) => t.id),
    },
  };
}

export function authorityChargingAuditMarkdown(report) {
  const lines = [
    "# Charging guide audit",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `- Completeness: **${report.summary?.completenessPercent}%**`,
    `- Intent mappings: **${report.intentMapCount}**`,
    `- FAQ templates: **${report.faqTemplateCount}** (${report.schemaType})`,
    "",
    "## Taxonomy",
    "",
    "| Bucket | Published / Total |",
    "| --- | --- |",
  ];
  for (const b of report.taxonomy || []) {
    lines.push(`| ${b.label} | ${b.published} / ${b.topics} |`);
  }
  lines.push("", "## Topics", "", "| Topic | Route | Taxonomy |", "| --- | --- | --- |");
  for (const t of report.topics || []) {
    lines.push(
      `| ${t.title} | ${t.routeReady ? "yes" : "no"} | ${t.inTaxonomy ? "yes" : "no"} |`
    );
  }
  return lines.join("\n");
}
