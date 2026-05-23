/**
 * Ensures critical /admin/* routes are present in the production JS bundle.
 * Run after `npm run build` (post-launch:smoke).
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST_ASSETS = join(ROOT, "dist", "assets");

const REQUIRED_ADMIN_PATHS = [
  "/admin/public-beta-ops",
  "/admin/recommendation-refinement",
  "/admin/content-usefulness",
  "/admin/conversion-refinement",
  "/admin/media-health",
  "/admin/seo-authority",
  "/admin/system-status",
  "/admin/catalog-health",
];

function loadIndexBundles() {
  const files = readdirSync(DIST_ASSETS).filter(
    (f) => f.startsWith("index-") && f.endsWith(".js")
  );
  if (!files.length) {
    throw new Error("No dist/assets/index-*.js found — run npm run build first");
  }
  return files.map((f) => readFileSync(join(DIST_ASSETS, f), "utf8")).join("\n");
}

function main() {
  const bundle = loadIndexBundles();
  const missing = REQUIRED_ADMIN_PATHS.filter((p) => !bundle.includes(p));

  if (missing.length) {
    console.error("admin-routes-smoke FAILED — missing from index bundle:");
    for (const p of missing) console.error(`  - ${p}`);
    process.exit(1);
  }

  console.log(
    `admin-routes-smoke OK (${REQUIRED_ADMIN_PATHS.length} critical admin paths in bundle)`
  );
}

main();
