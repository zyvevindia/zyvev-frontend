/**
 * Media Audit v1 — npm run media:audit
 *
 * Measures image completeness for all golden-dataset catalog vehicles.
 * Writes docs/media/media-audit-v1.md and docs/media/media-audit-v1.json
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildMediaAuditV1Report,
  mediaAuditV1Markdown,
} from "./lib/mediaAuditV1.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "docs", "media");
const jsonPath = join(outDir, "media-audit-v1.json");
const mdPath = join(outDir, "media-audit-v1.md");

const report = buildMediaAuditV1Report(root);
const markdown = mediaAuditV1Markdown(report);

mkdirSync(outDir, { recursive: true });
writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(mdPath, markdown, "utf8");

console.log("\n=== EVSavari Media Audit v1 ===\n");
console.log(`Vehicles: ${report.vehicleCount}`);
console.log(`Fleet coverage: ${report.summary.fleetCoveragePct}%`);
console.log(`Vehicles at 100%: ${report.summary.vehiclesAt100Pct}`);
console.log(`\nWrote:\n  ${mdPath}\n  ${jsonPath}\n`);

for (const row of report.vehicles) {
  const flags = ["listing", "compare", "front", "rear", "side", "interior", "dashboard"]
    .map((t) => (row.types[t].present ? "✓" : "—"))
    .join(" ");
  console.log(`  ${row.displayName.padEnd(28)} ${flags}  ${row.coveragePct}%`);
}

console.log("");
