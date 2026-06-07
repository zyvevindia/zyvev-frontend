/**
 * Licensed media attribution audit — npm run media:attribution-audit
 *
 * Verifies every ingest URL in tier1-cloudinary-seed.json traces to a complete
 * attribution record. Legacy frozen families (Nexon, Punch) are informational only.
 */

import { auditMediaAttribution } from "./lib/mediaAttribution.mjs";
import {
  LEGACY_FROZEN_MEDIA_FAMILIES,
  LICENSED_STANDARD_ROLLCALL,
  MEDIA_POLICY_VERSION,
} from "../src/media/mediaPolicy.js";

console.log("\n=== EVSavari media attribution audit ===");
console.log(`Policy version: ${MEDIA_POLICY_VERSION}\n`);

console.log("Legacy frozen (do not replace Cloudinary assets):");
for (const slug of LEGACY_FROZEN_MEDIA_FAMILIES) {
  console.log(`  • ${slug}`);
}

console.log("\nLicensed standard roll-call:");
for (const slug of LICENSED_STANDARD_ROLLCALL) {
  console.log(`  • ${slug}`);
}

const { ok, issues } = auditMediaAttribution();

for (const issue of issues) {
  const prefix =
    issue.severity === "error"
      ? "ERROR"
      : issue.severity === "warn"
        ? "WARN"
        : "INFO";
  const loc = [issue.familySlug, issue.role].filter(Boolean).join(" / ");
  console.log(`\n[${prefix}] ${loc ? `${loc}: ` : ""}${issue.message}`);
}

if (ok) {
  console.log("\nAttribution audit passed — all licensed seed URLs are traceable.\n");
  process.exit(0);
}

console.error(
  "\nAttribution audit failed — fix tier1-media-attribution.json or tier1-cloudinary-seed.json.\n"
);
process.exit(1);
