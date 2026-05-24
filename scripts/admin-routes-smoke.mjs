/**
 * Ensures critical /admin/* routes are present in the production JS bundle.
 * Run after `npm run build` (post-launch:smoke).
 */

import "./lib/bootstrapEnv.mjs";

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
  "/admin/catalog-freshness",
  "/admin/system-status",
  "/admin/catalog-health",
];

/** Lazy chunks that must exist when routes are registered */
const REQUIRED_LAZY_CHUNKS = [
  "PublicBetaOpsPage",
  "RecommendationRefinementPage",
  "ContentUsefulnessPage",
  "ConversionRefinementPage",
  "CatalogFreshnessPage",
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

function findLazyChunkFiles(componentName) {
  return readdirSync(DIST_ASSETS).filter(
    (f) => f.startsWith(`${componentName}-`) && f.endsWith(".js")
  );
}

function main() {
  const bundle = loadIndexBundles();
  const missing = REQUIRED_ADMIN_PATHS.filter((p) => !bundle.includes(p));

  if (missing.length) {
    console.error("admin-routes-smoke FAILED — missing from index bundle:");
    for (const p of missing) console.error(`  - ${p}`);
    process.exit(1);
  }

  const missingChunks = REQUIRED_LAZY_CHUNKS.filter(
    (name) => findLazyChunkFiles(name).length === 0
  );
  if (missingChunks.length) {
    console.error("admin-routes-smoke FAILED — lazy chunk files missing:");
    for (const name of missingChunks) console.error(`  - ${name}-*.js`);
    process.exit(1);
  }

  const unresolved = REQUIRED_LAZY_CHUNKS.filter((name) => {
    const file = findLazyChunkFiles(name)[0];
    return !bundle.includes(file);
  });
  if (unresolved.length) {
    console.error(
      "admin-routes-smoke FAILED — index bundle does not reference lazy chunks:"
    );
    for (const name of unresolved) console.error(`  - ${name}`);
    process.exit(1);
  }

  console.log(
    `admin-routes-smoke OK (${REQUIRED_ADMIN_PATHS.length} paths, ${REQUIRED_LAZY_CHUNKS.length} lazy chunks)`
  );
}

main();
