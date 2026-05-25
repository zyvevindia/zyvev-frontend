#!/usr/bin/env node
import "./lib/bootstrapEnv.mjs";
import { writeAuditReport, reportHeader } from "./lib/reportWriter.mjs";

const url = new URL("../src/ops/authorityQualityAuditOps.js", import.meta.url).href;
const { generateAuthorityQualityAuditReport, authorityQualityAuditMarkdown } =
  await import(url);

const report = generateAuthorityQualityAuditReport();
const { jsonPath, mdPath } = writeAuditReport({
  subdir: "authority-quality",
  basename: "authority-quality",
  json: report,
  markdown:
    reportHeader("Authority quality", report.summary) +
    authorityQualityAuditMarkdown(report),
});
console.log(`\nAuthority quality:\n  ${jsonPath}\n  ${mdPath}\n`);
