#!/usr/bin/env node
/**
 * Catalog completeness audit — npm run catalog:audit
 */
import "./lib/bootstrapEnv.mjs";
import { writeAuditReport, reportHeader } from "./lib/reportWriter.mjs";
import { loadCatalogCarsForAudit } from "./lib/loadCatalogForAudit.mjs";

const url = new URL("../src/ops/catalogCompletenessOps.js", import.meta.url).href;
const {
  generateCatalogAuditReport,
  catalogCompletenessMarkdown,
  missingMediaReport,
  incompleteSpecReport,
} = await import(url);

const cars = await loadCatalogCarsForAudit();
const report = generateCatalogAuditReport(cars);

const { jsonPath, mdPath } = writeAuditReport({
  subdir: "catalog-audit",
  basename: "catalog-audit",
  json: {
    ...report,
    missingMedia: missingMediaReport(report),
    incompleteSpecs: incompleteSpecReport(report),
  },
  markdown:
    reportHeader("Catalog audit", {
      Vehicles: report.vehicleCount,
      "Avg completeness": `${report.summary?.avgCompletenessPercent ?? 0}%`,
    }) + catalogCompletenessMarkdown(report),
});

console.log(`\nCatalog audit written:\n  ${jsonPath}\n  ${mdPath}\n`);
