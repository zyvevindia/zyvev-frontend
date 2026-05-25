#!/usr/bin/env node
import "./lib/bootstrapEnv.mjs";
import { writeAuditReport, reportHeader } from "./lib/reportWriter.mjs";

const url = new URL("../src/ops/authorityDepthAuditOps.js", import.meta.url).href;
const { generateAuthorityDepthAuditReport, authorityDepthAuditMarkdown } =
  await import(url);

const report = generateAuthorityDepthAuditReport();
const { jsonPath, mdPath } = writeAuditReport({
  subdir: "authority-depth",
  basename: "authority-depth",
  json: report,
  markdown:
    reportHeader("Authority depth", {
      depthScore: report.depthScore,
      concernCoverage: report.concernCoverage?.score,
      mythClusterDepth: report.mythClusterDepth,
    }) + authorityDepthAuditMarkdown(report),
});
console.log(`\nAuthority depth:\n  ${jsonPath}\n  ${mdPath}\n`);
