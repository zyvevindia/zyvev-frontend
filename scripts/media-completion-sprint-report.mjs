/**
 * Media Completion Sprint report — npm run media:completion-sprint:report
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  AUDIT_IMAGE_TYPES,
  buildMediaAuditV1Report,
} from "./lib/mediaAuditV1.mjs";
import {
  MEDIA_COMPLETION_P1_FAMILIES,
  MEDIA_COMPLETION_P2_TYPES,
  MEDIA_COMPLETION_P3_DASHBOARD_FAMILIES,
  MEDIA_COMPLETION_SPRINT_FAMILIES,
} from "../src/media/localCarMediaManifest.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "docs", "media");
const jsonPath = join(outDir, "media-completion-sprint.json");
const mdPath = join(outDir, "media-completion-sprint.md");

const audit = buildMediaAuditV1Report(root);
const sprintRows = audit.vehicles.filter((row) =>
  MEDIA_COMPLETION_SPRINT_FAMILIES.includes(row.familySlug)
);

const vehiclesAt100 = audit.vehicles.filter((row) => row.coveragePct === 100);

const report = {
  version: "media-completion-sprint",
  generatedAt: new Date().toISOString(),
  fleetCoverageBeforePct: 78,
  fleetCoverageAfterPct: audit.summary.fleetCoveragePct,
  fleetCoverageDeltaPct: audit.summary.fleetCoveragePct - 78,
  fleetCoverageTargetPct: 95,
  vehiclesAt100Before: 15,
  vehiclesAt100After: vehiclesAt100.length,
  vehicleCount: audit.vehicleCount,
  priorities: {
    p1ZeroCoverage: [...MEDIA_COMPLETION_P1_FAMILIES],
    p2Partial: { ...MEDIA_COMPLETION_P2_TYPES },
    p3Dashboard: [...MEDIA_COMPLETION_P3_DASHBOARD_FAMILIES],
  },
  fallbackChain: ["local-image", "cloudinary", "fallback-ev.svg"],
  auditSummary: audit.summary,
  sprintVehicles: sprintRows.map((row) => ({
    familySlug: row.familySlug,
    displayName: row.displayName,
    coveragePct: row.coveragePct,
    types: row.types,
  })),
  allVehicles: audit.vehicles.map((row) => ({
    familySlug: row.familySlug,
    displayName: row.displayName,
    coveragePct: row.coveragePct,
  })),
};

const lines = [
  "# Media Completion Sprint",
  "",
  `Generated: ${report.generatedAt}`,
  "",
  "## Summary",
  "",
  `- **Fleet coverage:** ${report.fleetCoverageBeforePct}% → **${report.fleetCoverageAfterPct}%** (+${report.fleetCoverageDeltaPct} pts)`,
  `- **Target:** >${report.fleetCoverageTargetPct}%`,
  `- **Vehicles at 100%:** ${report.vehiclesAt100Before} → **${report.vehiclesAt100After}** / ${report.vehicleCount}`,
  `- **Fallback chain:** local image → Cloudinary → \`fallback-ev.svg\``,
  "",
  "## Sprint vehicles",
  "",
  "| Vehicle | Coverage % |",
  "|---------|------------|",
];

for (const row of report.sprintVehicles) {
  const mark = row.coveragePct === 100 ? "✓" : "—";
  lines.push(`| ${row.displayName} | ${row.coveragePct}% ${mark} |`);
}

lines.push(
  "",
  "## Full fleet",
  "",
  "| Vehicle | Coverage % |",
  "|---------|------------|"
);

for (const row of report.allVehicles) {
  const mark = row.coveragePct === 100 ? "✓" : "—";
  lines.push(`| ${row.displayName} | ${row.coveragePct}% ${mark} |`);
}

lines.push(
  "",
  "## Type matrix (sprint vehicles)",
  "",
  "| Vehicle | Listing | Compare | Front | Rear | Side | Interior | Dashboard | Coverage % |",
  "|---------|---------|---------|-------|------|------|----------|-----------|------------|"
);

for (const row of sprintRows) {
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

console.log("\n=== Media Completion Sprint report ===\n");
console.log(`Fleet coverage: ${report.fleetCoverageAfterPct}%`);
console.log(
  `Vehicles at 100%: ${report.vehiclesAt100After}/${report.vehicleCount}`
);
console.log(`\nWrote:\n  ${mdPath}\n  ${jsonPath}\n`);

if (
  report.fleetCoverageAfterPct < 95 ||
  report.vehiclesAt100After < report.vehicleCount
) {
  process.exit(1);
}
