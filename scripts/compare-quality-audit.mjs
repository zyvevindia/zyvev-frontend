#!/usr/bin/env node
/**
 * Compare quality audit — npm run compare:quality-audit
 */
import "./lib/bootstrapEnv.mjs";
import { writeAuditReport, reportHeader } from "./lib/reportWriter.mjs";
import { loadCatalogCarsForAudit } from "./lib/loadCatalogForAudit.mjs";

const auditUrl = new URL("../src/ops/compareQualityAuditOps.js", import.meta.url)
  .href;
const manifestUrl = new URL("../src/content/generated/manifest.js", import.meta.url)
  .href;

const { generateCompareQualityReport, compareQualityMarkdown } = await import(
  auditUrl
);
const { GENERATED_COMPARE_SLUGS } = await import(manifestUrl);

const cars = await loadCatalogCarsForAudit();
const report = generateCompareQualityReport(
  cars,
  GENERATED_COMPARE_SLUGS.slice(0, 12)
);

const { jsonPath, mdPath } = writeAuditReport({
  subdir: "compare-quality",
  basename: "compare-quality",
  json: report,
  markdown:
    reportHeader("Compare quality", report.summary) +
    compareQualityMarkdown(report),
});

console.log(`\nCompare quality audit:\n  ${jsonPath}\n  ${mdPath}\n`);
