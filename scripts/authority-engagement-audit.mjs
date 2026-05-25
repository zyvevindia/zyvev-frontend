#!/usr/bin/env node
import "./lib/bootstrapEnv.mjs";
import { writeAuditReport, reportHeader } from "./lib/reportWriter.mjs";

const url = new URL("../src/ops/authorityEngagementAuditOps.js", import.meta.url).href;
const { generateAuthorityEngagementAuditReport, authorityEngagementAuditMarkdown } =
  await import(url);

const report = generateAuthorityEngagementAuditReport();
const { jsonPath, mdPath } = writeAuditReport({
  subdir: "authority-depth",
  basename: "authority-engagement",
  json: report,
  markdown:
    reportHeader("Authority engagement", report.summary) +
    authorityEngagementAuditMarkdown(report),
});
console.log(`\nAuthority engagement:\n  ${jsonPath}\n  ${mdPath}\n`);
