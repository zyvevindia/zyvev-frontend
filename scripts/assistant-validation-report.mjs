#!/usr/bin/env node
/**
 * AI Buyer Assistant validation report — npm run assistant:validation
 */
import "./lib/bootstrapEnv.mjs";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { writeAuditReport } from "./lib/reportWriter.mjs";
import { runAssistantValidationAudit } from "./lib/assistantValidation.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

console.log("Running AI Buyer Assistant validation audit…\n");

const audit = runAssistantValidationAudit();

const { jsonPath, mdPath } = writeAuditReport({
  subdir: "assistant-validation",
  basename: "assistant-validation",
  json: {
    generatedAt: audit.generatedAt,
    version: audit.version,
    stats: audit.stats,
    readiness: audit.readiness,
    budgetBands: audit.budgetBands,
    contradictory: audit.contradictory,
    diversity: audit.diversity,
    quality: audit.quality,
    anomalies: audit.anomalies,
    suggestions: audit.suggestions,
    archetypeFocused: Object.fromEntries(
      Object.entries(audit.archetypes.focused).map(([id, row]) => [
        id,
        {
          title: row.title,
          emptyBuckets: row.emptyBuckets,
          strongCount: row.response.buckets?.strongMatches?.length || 0,
          goodCount: row.response.buckets?.goodAlternatives?.length || 0,
          weakCount: row.response.buckets?.weakFits?.length || 0,
        },
      ])
    ),
  },
  markdown: audit.markdown,
});

const stableMdPath = join(ROOT, "reports", "assistant-validation-report.md");
mkdirSync(dirname(stableMdPath), { recursive: true });
writeFileSync(stableMdPath, audit.markdown, "utf8");

console.log(`Validation report:\n  ${jsonPath}\n  ${mdPath}\n  ${stableMdPath}\n`);
console.log(`Overall readiness: ${audit.readiness.overall}`);
console.log(`Matrix scenarios: ${audit.stats.matrixCount}`);
console.log(`Budget anomalies: ${audit.stats.budgetAnomalyCount}`);
console.log(`Never recommended (strong): ${audit.diversity.neverRecommended.length}`);

if (audit.readiness.overall === "FAIL") {
  console.warn("\nWARNING: assistant validation readiness is FAIL (report still written)");
}

console.log("\nPASS: assistant validation report generated");
