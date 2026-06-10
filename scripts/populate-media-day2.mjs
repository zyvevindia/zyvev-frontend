/**
 * Media Population Day 2 — npm run media:populate-day2
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { LOCAL_CAR_MEDIA_DAY2_FAMILIES } from "../src/media/localCarMediaManifest.js";
import { populateLocalCarMedia } from "./lib/populateLocalCarMedia.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const seedPath = join(__dirname, "lib", "mediaPopulationDay2Seed.json");
const seed = JSON.parse(readFileSync(seedPath, "utf8"));

console.log("\n=== Media Population Day 2 ===\n");

const results = await populateLocalCarMedia({
  root,
  families: LOCAL_CAR_MEDIA_DAY2_FAMILIES,
  seed,
  batchLabel: "EVSavari Media Day 2",
});

const okCount = results.filter((r) => r.ok).length;
console.log(`\nCompleted ${okCount}/${LOCAL_CAR_MEDIA_DAY2_FAMILIES.length} families.\n`);

if (okCount !== LOCAL_CAR_MEDIA_DAY2_FAMILIES.length) {
  process.exit(1);
}
