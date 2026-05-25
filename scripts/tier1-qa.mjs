#!/usr/bin/env node
import "./lib/bootstrapEnv.mjs";
import { writeAuditReport, reportHeader } from "./lib/reportWriter.mjs";
import { loadFocusProductionizationCars } from "./lib/loadCatalogForAudit.mjs";

const url = new URL("../src/ops/tier1QaOps.js", import.meta.url).href;
const { runTier1QaAudit, tier1QaMarkdown } = await import(url);

const cars = await loadFocusProductionizationCars();
const report = runTier1QaAudit(cars);

const { jsonPath, mdPath } = writeAuditReport({
  subdir: "tier1-productionization",
  basename: "tier1-qa",
  json: report,
  markdown: reportHeader("Tier-1 QA", report.summary) + tier1QaMarkdown(report),
});

console.log(`\nTier-1 QA:\n  ${jsonPath}\n  ${mdPath}\n`);
if (!report.summary?.ok) {
  console.error(`FAIL: ${report.summary.failureCount} failure(s)`);
  process.exit(1);
}
console.log("PASS: tier-1 QA (structural)");
