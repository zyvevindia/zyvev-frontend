#!/usr/bin/env node
/**
 * Generate photo replacement tracker docs.
 * Usage: node scripts/generate-photo-replacement-tracker.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildPhotoReplacementTracker,
  formatPhotoReplacementMarkdown,
} from "./lib/photoReplacementTracker.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const docsDir = join(root, "docs", "media");

const report = buildPhotoReplacementTracker();
const markdown = formatPhotoReplacementMarkdown(report);

mkdirSync(docsDir, { recursive: true });
writeFileSync(
  join(docsDir, "photo-replacement-tracker.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8"
);
writeFileSync(
  join(docsDir, "photo-replacement-tracker.md"),
  `${markdown}\n`,
  "utf8"
);

console.log("Photo replacement tracker generated.");
console.log(`  Vehicles: ${report.summary.vehicleCount}`);
console.log(`  Slots:    ${report.summary.totalSlots} (all placeholder)`);
console.log("  Wrote docs/media/photo-replacement-tracker.md");
console.log("  Wrote docs/media/photo-replacement-tracker.json");
