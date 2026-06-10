/**
 * Media Population Day 3 — npm run media:populate-day3
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { LOCAL_CAR_MEDIA_DAY3_FAMILIES } from "../src/media/localCarMediaManifest.js";
import { populateLocalCarMedia } from "./lib/populateLocalCarMedia.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const seedPath = join(__dirname, "lib", "mediaPopulationDay3Seed.json");
const seed = JSON.parse(readFileSync(seedPath, "utf8"));

console.log("\n=== Media Population Day 3 ===\n");

const results = await populateLocalCarMedia({
  root,
  families: LOCAL_CAR_MEDIA_DAY3_FAMILIES,
  seed,
  batchLabel: "EVSavari Media Day 3",
});

const okCount = results.filter((r) => r.ok).length;
console.log(`\nCompleted ${okCount}/${LOCAL_CAR_MEDIA_DAY3_FAMILIES.length} families.\n`);

if (okCount !== LOCAL_CAR_MEDIA_DAY3_FAMILIES.length) {
  process.exit(1);
}
