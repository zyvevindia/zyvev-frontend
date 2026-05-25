#!/usr/bin/env node
import "./lib/bootstrapEnv.mjs";
import { writeAuditReport, reportHeader } from "./lib/reportWriter.mjs";
import { loadFocusProductionizationCars } from "./lib/loadCatalogForAudit.mjs";

const url = new URL("../src/ops/compareTrustAuditOps.js", import.meta.url).href;
const { generateCompareTrustAuditReport, compareTrustAuditMarkdown } =
  await import(url);

const cars = await loadFocusProductionizationCars();
const report = generateCompareTrustAuditReport(cars);

const { jsonPath, mdPath } = writeAuditReport({
  subdir: "compare-quality",
  basename: "compare-trust-audit",
  json: report,
  markdown:
    reportHeader("Compare trust audit", report.summary) +
    compareTrustAuditMarkdown(report),
});

console.log(`\nCompare trust audit:\n  ${jsonPath}\n  ${mdPath}\n`);
