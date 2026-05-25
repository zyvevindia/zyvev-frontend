#!/usr/bin/env node
/**
 * Charging guide completeness — npm run authority:charging-audit
 */
import "./lib/bootstrapEnv.mjs";
import { writeAuditReport, reportHeader } from "./lib/reportWriter.mjs";

const url = new URL("../src/ops/authorityChargingAuditOps.js", import.meta.url).href;
const { generateAuthorityChargingAuditReport, authorityChargingAuditMarkdown } =
  await import(url);

const report = generateAuthorityChargingAuditReport();

const { jsonPath, mdPath } = writeAuditReport({
  subdir: "authority-seo",
  basename: "authority-charging",
  json: report,
  markdown:
    reportHeader("Charging guides", report.summary) +
    authorityChargingAuditMarkdown(report),
});

console.log(`\nCharging authority audit:\n  ${jsonPath}\n  ${mdPath}\n`);
console.log(JSON.stringify(report.summary, null, 2));
