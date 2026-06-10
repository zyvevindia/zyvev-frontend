/**
 * Media Completion Sprint — npm run media:completion-sprint
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  MEDIA_COMPLETION_P1_FAMILIES,
  MEDIA_COMPLETION_P2_TYPES,
  MEDIA_COMPLETION_P3_DASHBOARD_FAMILIES,
  MEDIA_COMPLETION_SPRINT_FAMILIES,
} from "../src/media/localCarMediaManifest.js";
import { populateLocalCarMedia } from "./lib/populateLocalCarMedia.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const seedPath = join(__dirname, "lib", "mediaCompletionSprintSeed.json");
const seed = JSON.parse(readFileSync(seedPath, "utf8"));

const typesByFamily = {
  ...MEDIA_COMPLETION_P2_TYPES,
  ...Object.fromEntries(
    MEDIA_COMPLETION_P3_DASHBOARD_FAMILIES.map((slug) => [slug, ["dashboard"]])
  ),
  ...Object.fromEntries(
    MEDIA_COMPLETION_P1_FAMILIES.map((slug) => [
      slug,
      [
        "listing",
        "compare",
        "front",
        "rear",
        "side",
        "interior",
        "dashboard",
      ],
    ])
  ),
};

console.log("\n=== Media Completion Sprint ===\n");
console.log("Priority 1 (full):", MEDIA_COMPLETION_P1_FAMILIES.join(", "));
console.log(
  "Priority 2 (partial):",
  Object.keys(MEDIA_COMPLETION_P2_TYPES).join(", ")
);
console.log(
  "Priority 3 (dashboard):",
  MEDIA_COMPLETION_P3_DASHBOARD_FAMILIES.join(", ")
);
console.log("");

const results = await populateLocalCarMedia({
  root,
  families: MEDIA_COMPLETION_SPRINT_FAMILIES,
  seed,
  batchLabel: "EVSavari Media Completion Sprint",
  typesByFamily,
});

const okCount = results.filter((r) => r.ok).length;
console.log(
  `\nCompleted ${okCount}/${MEDIA_COMPLETION_SPRINT_FAMILIES.length} families.\n`
);

if (okCount !== MEDIA_COMPLETION_SPRINT_FAMILIES.length) {
  process.exit(1);
}
