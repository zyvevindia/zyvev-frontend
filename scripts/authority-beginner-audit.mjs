#!/usr/bin/env node
/**
 * Beginner authority completeness — npm run authority:beginner-audit
 */
import "./lib/bootstrapEnv.mjs";
import { writeAuditReport, reportHeader } from "./lib/reportWriter.mjs";

const url = new URL("../src/ops/authorityBeginnerAuditOps.js", import.meta.url).href;
const { generateAuthorityBeginnerAuditReport, authorityBeginnerAuditMarkdown } =
  await import(url);

const report = generateAuthorityBeginnerAuditReport();

const { jsonPath, mdPath } = writeAuditReport({
  subdir: "authority-seo",
  basename: "authority-beginner",
  json: report,
  markdown:
    reportHeader("Beginner EV education", report.summary) +
    authorityBeginnerAuditMarkdown(report),
});

console.log(`\nBeginner authority audit:\n  ${jsonPath}\n  ${mdPath}\n`);
console.log(JSON.stringify(report.summary, null, 2));
