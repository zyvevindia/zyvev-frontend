#!/usr/bin/env node
/**
 * Media placeholder audit — npm run media:placeholder-audit
 *
 * Scans public/images/cars/** for batch-generated placeholder WebP files.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  formatMediaPlaceholderMarkdown,
  runMediaPlaceholderAudit,
} from "./lib/mediaPlaceholderAudit.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const docsDir = join(root, "docs", "media");

const report = await runMediaPlaceholderAudit({ rootDir: root });
const markdown = formatMediaPlaceholderMarkdown(report);

mkdirSync(docsDir, { recursive: true });
writeFileSync(
  join(docsDir, "media-placeholder-audit.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8"
);
writeFileSync(
  join(docsDir, "media-placeholder-audit.md"),
  `${markdown}\n`,
  "utf8"
);

console.log("\n=== Media Placeholder Audit ===\n");
console.log(`Vehicles:     ${report.summary.vehicleCount}`);
console.log(`Total images: ${report.summary.totalImages}`);
console.log(`Real:         ${report.summary.realImages}`);
console.log(`Placeholder:  ${report.summary.placeholderImages}`);
console.log(`Coverage:     ${report.summary.coveragePct}% real photos`);
console.log("\nWrote:");
console.log("  docs/media/media-placeholder-audit.md");
console.log("  docs/media/media-placeholder-audit.json\n");

for (const row of report.vehicles) {
  console.log(
    `  ${row.displayName.padEnd(28)} real=${row.realImages} placeholder=${row.placeholderImages}  ${row.coveragePct}%`
  );
}

console.log("");
