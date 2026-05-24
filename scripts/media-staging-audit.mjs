/**
 * Media staging audit — npm run media:staging-audit
 */

import "./lib/bootstrapEnv.mjs";

import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { buildMediaStagingAudit } from "../src/ops/mediaStagingOps.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const report = buildMediaStagingAudit();

console.log("\n=== EVSavari media staging audit ===\n");
console.log(`Families: ${report.families.length}`);
console.log(`Unresolved: ${report.unresolvedFamilies.length}`);
console.log(`Upload queue: ${report.uploadQueue.length}`);
console.log(`Approval queue: ${report.approvalQueue.length}`);

for (const f of report.unresolvedFamilies) {
  console.log(`  ${f.familySlug}: ${f.publishStatus} — ${f.issues.join(", ") || "ok"}`);
}

mkdirSync(join(root, "reports"), { recursive: true });
const stamp = report.generatedAt.slice(0, 10);
const jsonPath = join(root, "reports", `media-staging-${stamp}.json`);
writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");
console.log(`\nWrote ${jsonPath}\n`);

process.exit(report.unresolvedFamilies.length > 5 ? 1 : 0);
