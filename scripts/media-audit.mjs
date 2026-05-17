/**
 * Media QA — run: npm run media:audit
 * Audits production family manifest + optional live catalog fetch.
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  auditProductionFamilies,
  auditVehicleMedia,
  summarizeMediaAudit,
  probeBrokenImages,
} from "../src/utils/mediaAudit.js";
import { PRODUCTION_FAMILY_SLUGS } from "../src/media/familyMediaManifest.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const probeLive = process.argv.includes("--probe");

function loadTier1Variants() {
  const manifestPath = join(
    root,
    "../zyvev-backend/docs/architecture/catalog/tier-1/manifest.json"
  );
  if (!existsSync(manifestPath)) {
    return [];
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const variantsDir = join(
    root,
    "../zyvev-backend/docs/architecture/catalog/tier-1/variants"
  );
  return manifest.slugs.map((slug) => {
    const filePath = join(variantsDir, `${slug}.json`);
    if (!existsSync(filePath)) return null;
    const record = JSON.parse(readFileSync(filePath, "utf8"));
    const media = record.media || {};
    return {
      slug,
      brandSlug: record.identity?.brandSlug,
      modelSlug: record.identity?.modelSlug,
      heroImage: media.heroImage,
      listingThumbnail: media.listingThumbnail,
      compareThumbnail: media.compareThumbnail,
      catalogMeta: { slug, media },
    };
  }).filter(Boolean);
}

console.log("\n=== EVSavari media audit ===\n");

console.log("Production families (Cloudinary manifest):");
for (const row of auditProductionFamilies()) {
  const status = row.complete ? "OK" : `missing: ${row.missing.join(", ")}`;
  console.log(`  ${row.familySlug} — ${status}`);
}

const tier1 = loadTier1Variants();
const productionVariants = tier1.filter((v) =>
  PRODUCTION_FAMILY_SLUGS.some(
    (f) => v.slug === f || v.slug.startsWith(`${f}-`)
  )
);

const vehicleAudits = productionVariants.map((car) => auditVehicleMedia(car));
const summary = summarizeMediaAudit(vehicleAudits);

console.log(`\nTier-1 production variants checked: ${vehicleAudits.length}`);
console.log(
  `Cloudinary-primary (hero+listing+compare): ${summary.cloudinaryReady}`
);
console.log(`Warnings: ${summary.warnings}  Errors: ${summary.errors}\n`);

for (const issue of summary.issues) {
  console.log(
    `[${issue.severity.toUpperCase()}] ${issue.slug} (${issue.role}): ${issue.message}`
  );
}

let probeFailed = false;

if (probeLive) {
  const urls = PRODUCTION_FAMILY_SLUGS.flatMap((f) => {
    const media = auditProductionFamilies().find((r) => r.familySlug === f)?.media;
    if (!media) return [];
    return [media.heroImage, media.listingThumbnail, media.compareThumbnail];
  });

  console.log("\nProbing Cloudinary URLs (HEAD)...");
  const broken = await probeBrokenImages(urls);
  for (const row of broken) {
    console.log(`  BROKEN ${row.status || ""} ${row.url}`);
  }
  if (!broken.length) {
    console.log("  All probed production URLs responded OK.");
  } else {
    probeFailed = true;
  }
}

if (summary.errors > 0 || probeFailed) {
  process.exit(1);
}

console.log("\nMedia audit complete.\n");
