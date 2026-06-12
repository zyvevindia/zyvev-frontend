/**
 * Day 3 catalog operations smoke — conventions, definitions, media, compare pairs.
 * Optional live DB check: npm run backend:catalog-ops-smoke -- --live
 */

import "./lib/bootstrapEnv.mjs";

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LIVE = process.argv.includes("--live");

function fail(msg) {
  console.error(`backend-catalog-ops-smoke FAILED: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

async function main() {
  console.log("\n=== Catalog Operations Smoke ===\n");

  const convUrl = pathToFileURL(
    join(ROOT, "src/backend/catalog/catalogConventions.js")
  ).href;
  const defsUrl = pathToFileURL(
    join(ROOT, "src/backend/catalog/generated/index.js")
  ).href;
  const tier1Url = pathToFileURL(join(ROOT, "src/ops/tier1Families.js")).href;
  const prodUrl = pathToFileURL(
    join(ROOT, "src/media/productionFamilies.js")
  ).href;

  const {
    CATALOG_CONVENTIONS,
    DAY3_COMPARE_PAIRS,
    validateFamilySlug,
    cloudinaryPublicId,
    cloudinaryUrl,
  } = await import(convUrl);
  const {
    GENERATED_TIER1_DEFINITIONS,
    listGeneratedTier1DefinitionSlugs,
  } = await import(defsUrl);
  const { TIER1_FAMILY_SLUGS } = await import(tier1Url);
  const { PRODUCTION_FAMILY_SLUGS } = await import(prodUrl);

  const defSlugs = listGeneratedTier1DefinitionSlugs();
  for (const slug of TIER1_FAMILY_SLUGS) {
    if (!defSlugs.includes(slug)) {
      fail(`missing generated tier1 definition: ${slug}`);
    }
    if (!PRODUCTION_FAMILY_SLUGS.includes(slug)) {
      fail(`missing productionFamilies entry: ${slug}`);
    }
  }
  ok(
    `tier-1 alignment: ${TIER1_FAMILY_SLUGS.length} day3 families in ${defSlugs.length} generated definitions`
  );

  for (const def of Object.values(GENERATED_TIER1_DEFINITIONS)) {
    if (!validateFamilySlug(def.slug)) fail(`invalid slug: ${def.slug}`);
    if (!def.variants?.length) fail(`${def.slug}: no variants`);
    for (const v of def.variants) {
      if (!CATALOG_CONVENTIONS.variantSlugPattern.test(v.slug)) {
        fail(`${def.slug}: invalid variant slug ${v.slug}`);
      }
    }
    for (const role of CATALOG_CONVENTIONS.mediaRoles) {
      const pid = cloudinaryPublicId(def.slug, role);
      const url = cloudinaryUrl(def.slug, role);
      if (!pid.startsWith(CATALOG_CONVENTIONS.cloudinaryPublicIdPrefix)) {
        fail(`${def.slug}: bad public id ${pid}`);
      }
      if (!url.includes(pid.replace(/\//g, "/"))) {
        fail(`${def.slug}: url/publicId mismatch for ${role}`);
      }
    }
  }
  ok("normalization + media role conventions");

  const comparePath = join(ROOT, "public/sitemaps/compare.xml");
  if (!existsSync(comparePath)) fail("compare sitemap missing");
  const compareXml = readFileSync(comparePath, "utf8");

  for (const pair of DAY3_COMPARE_PAIRS) {
    for (const family of pair.families) {
      if (!defSlugs.includes(family)) {
        fail(`compare pair ${pair.label}: unknown family ${family}`);
      }
    }
  }

  const sitemapHits = DAY3_COMPARE_PAIRS.filter((p) =>
    compareXml.includes(`/compare/${p.compareSlug}`)
  ).length;
  ok(`day3 compare pairs defined (${DAY3_COMPARE_PAIRS.length}); sitemap hits ${sitemapHits}`);

  if (LIVE) {
    const adminUrl = pathToFileURL(
      join(ROOT, "src/backend/supabase/adminClient.js")
    ).href;
    const seedUrl = pathToFileURL(
      join(ROOT, "src/backend/catalog/catalogSeedUtils.js")
    ).href;
    const { getSupabaseAdminClient, isSupabaseAdminConfigured } = await import(
      adminUrl
    );
    const { getCatalogVehicleCounts } = await import(seedUrl);

    if (!isSupabaseAdminConfigured()) {
      fail("live mode requires VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY");
    }

    const supabase = getSupabaseAdminClient();
    let persisted = 0;

    for (const slug of defSlugs) {
      const counts = await getCatalogVehicleCounts(supabase, slug);
      if (counts.ok && counts.variantCount >= 1 && counts.mediaCount >= 7) {
        persisted += 1;
        ok(`live ${slug}: ${counts.variantCount} variants, ${counts.mediaCount} media`);
      }
    }

    if (persisted === 0) {
      ok("live: no tier-1 vehicles seeded yet (run backend:seed-tier1)");
    } else {
      ok(`live persistence: ${persisted}/${defSlugs.length} families catalog-ready`);
    }
  } else {
    ok("offline mode (add --live for Supabase catalog read-back)");
  }

  console.log("\nbackend-catalog-ops-smoke passed\n");
}

main().catch((e) => fail(e.message));
