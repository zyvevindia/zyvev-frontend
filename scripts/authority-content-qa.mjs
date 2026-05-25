#!/usr/bin/env node
/**
 * Authority populated content QA — npm run authority:content-qa
 */
import "./lib/bootstrapEnv.mjs";
import { writeAuditReport, reportHeader } from "./lib/reportWriter.mjs";

const url = new URL("../src/ops/authorityContentQaOps.js", import.meta.url).href;
const { generateAuthorityContentQaReport, authorityContentQaMarkdown } =
  await import(url);

const report = generateAuthorityContentQaReport();

const { jsonPath, mdPath } = writeAuditReport({
  subdir: "authority-seo",
  basename: "authority-content-qa",
  json: report,
  markdown:
    reportHeader("Authority content QA", report.summary) +
    authorityContentQaMarkdown(report),
});

console.log(`\nAuthority content QA:\n  ${jsonPath}\n  ${mdPath}\n`);
console.log(JSON.stringify(report.summary, null, 2));
if (!report.ok) process.exit(1);
