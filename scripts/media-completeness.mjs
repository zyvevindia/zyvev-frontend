#!/usr/bin/env node
/**
 * Tier-1 media completeness — npm run media:completeness
 */
import "./lib/bootstrapEnv.mjs";
import { writeAuditReport, reportHeader } from "./lib/reportWriter.mjs";

const url = new URL("../src/ops/tier1MediaHealth.js", import.meta.url).href;
const {
  buildTier1MediaCompletenessReport,
  tier1MediaCompletenessMarkdown,
  summarizeTier1OptionalMediaGaps,
} = await import(url);

const report = buildTier1MediaCompletenessReport();
const optionalGaps = summarizeTier1OptionalMediaGaps(report.optional);

const { jsonPath, mdPath } = writeAuditReport({
  subdir: "media-audit",
  basename: "media-completeness",
  json: { ...report, optionalGaps },
  markdown:
    reportHeader("Media completeness", report.summary) +
    tier1MediaCompletenessMarkdown(report),
});

console.log(`\nMedia completeness:\n  ${jsonPath}\n  ${mdPath}\n`);
console.log(JSON.stringify(report.summary, null, 2));
