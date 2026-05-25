#!/usr/bin/env node
import "./lib/bootstrapEnv.mjs";
import { writeAuditReport, reportHeader } from "./lib/reportWriter.mjs";
import { loadFocusProductionizationCars } from "./lib/loadCatalogForAudit.mjs";

const url = new URL("../src/ops/tier1ProductionizationOps.js", import.meta.url).href;
const { generateTier1ProductionizationReport, tier1ProductionizationMarkdown } =
  await import(url);

const cars = await loadFocusProductionizationCars();
const report = generateTier1ProductionizationReport(cars);

const { jsonPath, mdPath } = writeAuditReport({
  subdir: "tier1-productionization",
  basename: "tier1-productionization",
  json: report,
  markdown:
    reportHeader("Tier-1 productionization", report.summary) +
    tier1ProductionizationMarkdown(report),
});

console.log(`\nTier-1 productionization report:\n  ${jsonPath}\n  ${mdPath}\n`);
console.log(JSON.stringify(report.summary, null, 2));
