/**
 * Media Population Day 1 report — npm run media:population-day1
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  AUDIT_IMAGE_TYPES,
  buildMediaAuditV1Report,
} from "./lib/mediaAuditV1.mjs";
import { LOCAL_CAR_MEDIA_DAY1_FAMILIES } from "../src/media/localCarMediaManifest.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "docs", "media");
const jsonPath = join(outDir, "media-population-day1.json");
const mdPath = join(outDir, "media-population-day1.md");

const audit = buildMediaAuditV1Report(root);
const day1Rows = audit.vehicles.filter((row) =>
  LOCAL_CAR_MEDIA_DAY1_FAMILIES.includes(row.familySlug)
);

const report = {
  version: "media-population-day1",
  generatedAt: new Date().toISOString(),
  vehiclesTargeted: [...LOCAL_CAR_MEDIA_DAY1_FAMILIES],
  fallbackChain: ["local-image", "cloudinary", "fallback-ev.svg"],
  localPathPattern: "/images/cars/{familySlug}/{type}.webp",
  fleetCoverageBeforePct: 27,
  fleetCoverageAfterPct: audit.summary.fleetCoveragePct,
  fleetCoverageDeltaPct:
    audit.summary.fleetCoveragePct - 27,
  auditSummary: audit.summary,
  vehicles: day1Rows.map((row) => ({
    familySlug: row.familySlug,
    displayName: row.displayName,
    coveragePct: row.coveragePct,
    types: row.types,
  })),
};

const lines = [
  "# Media Population Day 1",
  "",
  `Generated: ${report.generatedAt}`,
  "",
  "## Summary",
  "",
  `- **Fleet coverage:** ${report.fleetCoverageBeforePct}% → **${report.fleetCoverageAfterPct}%** (+${report.fleetCoverageDeltaPct} pts)`,
  `- **Fallback chain:** local image → Cloudinary → \`fallback-ev.svg\``,
  `- **Local path:** \`${report.localPathPattern}\``,
  "",
  "## Vehicle coverage",
  "",
  "| Vehicle | Coverage % |",
  "|---------|------------|",
];

for (const row of report.vehicles) {
  const mark = row.coveragePct === 100 ? "✓" : "—";
  lines.push(`| ${row.displayName} | ${row.coveragePct}% ${mark} |`);
}

lines.push(
  "",
  "## Type matrix (Day 1 vehicles)",
  "",
  "| Vehicle | Listing | Compare | Front | Rear | Side | Interior | Dashboard | Coverage % |",
  "|---------|---------|---------|-------|------|------|----------|-----------|------------|"
);

for (const row of day1Rows) {
  const cells = AUDIT_IMAGE_TYPES.map((t) =>
    row.types[t].present ? "✓" : "—"
  );
  lines.push(
    `| ${row.displayName} | ${cells.join(" | ")} | ${row.coveragePct}% |`
  );
}

lines.push("");

mkdirSync(outDir, { recursive: true });
writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(mdPath, lines.join("\n"), "utf8");

console.log("\n=== Media Population Day 1 report ===\n");
console.log(`Fleet coverage: ${report.fleetCoverageAfterPct}%`);
for (const row of report.vehicles) {
  console.log(`  ${row.displayName}: ${row.coveragePct}%`);
}
console.log(`\nWrote:\n  ${mdPath}\n  ${jsonPath}\n`);

const all100 = report.vehicles.every((r) => r.coveragePct === 100);
if (!all100 || report.fleetCoverageAfterPct < 45) {
  process.exit(1);
}
