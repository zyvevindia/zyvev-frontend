/**
 * Media Population Day 3 report — npm run media:population-day3
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  AUDIT_IMAGE_TYPES,
  buildMediaAuditV1Report,
} from "./lib/mediaAuditV1.mjs";
import { LOCAL_CAR_MEDIA_DAY3_FAMILIES } from "../src/media/localCarMediaManifest.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "docs", "media");
const jsonPath = join(outDir, "media-population-day3.json");
const mdPath = join(outDir, "media-population-day3.md");

const audit = buildMediaAuditV1Report(root);
const day3Rows = audit.vehicles.filter((row) =>
  LOCAL_CAR_MEDIA_DAY3_FAMILIES.includes(row.familySlug)
);

const vehiclesAt100 = audit.vehicles.filter((row) => row.coveragePct === 100).length;

const report = {
  version: "media-population-day3",
  generatedAt: new Date().toISOString(),
  vehiclesTargeted: [...LOCAL_CAR_MEDIA_DAY3_FAMILIES],
  fallbackChain: ["local-image", "cloudinary", "fallback-ev.svg"],
  localPathPattern: "/images/cars/{familySlug}/{type}.webp",
  fleetCoverageBeforePct: 65,
  fleetCoverageAfterPct: audit.summary.fleetCoveragePct,
  fleetCoverageDeltaPct: audit.summary.fleetCoveragePct - 65,
  fleetCoverageTargetPct: 82,
  fleetCoverageTargetNote:
    "Day 3 adds 23 net slots (5 vehicles); remaining gap is partial tier-1 gallery (dashboard) and zero-coverage families.",
  vehiclesAt100Before: 10,
  vehiclesAt100After: vehiclesAt100,
  auditSummary: audit.summary,
  vehicles: day3Rows.map((row) => ({
    familySlug: row.familySlug,
    displayName: row.displayName,
    coveragePct: row.coveragePct,
    types: row.types,
  })),
};

const lines = [
  "# Media Population Day 3",
  "",
  `Generated: ${report.generatedAt}`,
  "",
  "## Summary",
  "",
  `- **Fleet coverage:** ${report.fleetCoverageBeforePct}% → **${report.fleetCoverageAfterPct}%** (+${report.fleetCoverageDeltaPct} pts)`,
  `- **Target:** ~${report.fleetCoverageTargetPct}–85%`,
  `- **Vehicles at 100%:** ${report.vehiclesAt100Before} → **${report.vehiclesAt100After}**`,
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
  "## Type matrix (Day 3 vehicles)",
  "",
  "| Vehicle | Listing | Compare | Front | Rear | Side | Interior | Dashboard | Coverage % |",
  "|---------|---------|---------|-------|------|------|----------|-----------|------------|"
);

for (const row of day3Rows) {
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

console.log("\n=== Media Population Day 3 report ===\n");
console.log(`Fleet coverage: ${report.fleetCoverageAfterPct}%`);
console.log(`Vehicles at 100%: ${report.vehiclesAt100After}`);
for (const row of report.vehicles) {
  console.log(`  ${row.displayName}: ${row.coveragePct}%`);
}
console.log(`\nWrote:\n  ${mdPath}\n  ${jsonPath}\n`);

const all100 = report.vehicles.every((r) => r.coveragePct === 100);
if (!all100 || report.vehiclesAt100After < 15) {
  process.exit(1);
}
