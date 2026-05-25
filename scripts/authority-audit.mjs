#!/usr/bin/env node
/**
 * Authority SEO readiness — npm run authority:audit
 */
import "./lib/bootstrapEnv.mjs";
import { writeAuditReport, reportHeader } from "./lib/reportWriter.mjs";

const url = new URL("../src/ops/authoritySeoAuditOps.js", import.meta.url).href;
const { generateAuthoritySeoAuditReport, authoritySeoAuditMarkdown } =
  await import(url);

const report = generateAuthoritySeoAuditReport({});

const { jsonPath, mdPath } = writeAuditReport({
  subdir: "authority-seo",
  basename: "authority-readiness",
  json: report,
  markdown:
    reportHeader("Authority SEO readiness", report.summary) +
    authoritySeoAuditMarkdown(report),
});

console.log(`\nAuthority SEO readiness:\n  ${jsonPath}\n  ${mdPath}\n`);
console.log(JSON.stringify(report.summary, null, 2));
