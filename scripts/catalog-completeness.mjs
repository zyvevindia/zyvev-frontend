#!/usr/bin/env node
/**
 * Catalog completeness summary — npm run catalog:completeness
 */
import "./lib/bootstrapEnv.mjs";
import { writeAuditReport, reportHeader } from "./lib/reportWriter.mjs";
import { loadCatalogCarsForAudit } from "./lib/loadCatalogForAudit.mjs";

const url = new URL("../src/ops/catalogCompletenessOps.js", import.meta.url).href;
const {
  generateCatalogAuditReport,
  summarizeCatalogCompleteness,
  missingMediaReport,
  incompleteSpecReport,
} = await import(url);

const cars = await loadCatalogCarsForAudit();
const report = generateCatalogAuditReport(cars);
const summary = summarizeCatalogCompleteness(report);

const md = [
  reportHeader("Catalog completeness", summary),
  "",
  "## Missing media",
  "",
  "```json",
  JSON.stringify(missingMediaReport(report), null, 2),
  "```",
  "",
  "## Incomplete specs",
  "",
  "```json",
  JSON.stringify(incompleteSpecReport(report), null, 2),
  "```",
].join("\n");

const { jsonPath, mdPath } = writeAuditReport({
  subdir: "catalog-audit",
  basename: "catalog-completeness",
  json: { summary, report },
  markdown: md,
});

console.log(`\nCatalog completeness:\n  ${jsonPath}\n  ${mdPath}\n`);
console.log(JSON.stringify(summary, null, 2));
