#!/usr/bin/env node
/**
 * Production QA audit — npm run production:qa
 */
import "./lib/bootstrapEnv.mjs";
import { writeAuditReport, reportHeader } from "./lib/reportWriter.mjs";
import { loadCatalogCarsForAudit } from "./lib/loadCatalogForAudit.mjs";

const qaUrl = new URL("../src/ops/productionQaOps.js", import.meta.url).href;
const manifestUrl = new URL("../src/content/generated/manifest.js", import.meta.url)
  .href;

const { runProductionQaAudit, productionQaMarkdown } = await import(qaUrl);
const { GENERATED_COMPARE_SLUGS } = await import(manifestUrl);

const cars = await loadCatalogCarsForAudit();
const report = runProductionQaAudit({
  cars,
  compareSlugs: GENERATED_COMPARE_SLUGS,
});

const { jsonPath, mdPath } = writeAuditReport({
  subdir: "production-qa",
  basename: "production-qa",
  json: report,
  markdown:
    reportHeader("Production QA", report.summary) + productionQaMarkdown(report),
});

console.log(`\nProduction QA:\n  ${jsonPath}\n  ${mdPath}\n`);
if (!report.summary?.ok) {
  console.error(`FAIL: ${report.summary.failed} check(s) failed`);
  process.exit(1);
}
console.log("PASS: production QA checks");
