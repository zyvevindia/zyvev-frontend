/**
 * Seed Tier-1 catalog vehicles into Supabase (disciplined onboarding).
 * Requires: VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (scripts only).
 *
 * Run:
 *   npm run backend:seed-tier1              # all generated families
 *   npm run backend:seed-tier1 -- --only=tata-punch-ev
 *   npm run backend:seed-tier1 -- --skip=tata-nexon-ev
 */

import "./lib/bootstrapEnv.mjs";

import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function fail(msg) {
  console.error(`backend-seed-tier1 FAILED: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

function parseListArg(prefix) {
  const arg = process.argv.find((a) => a.startsWith(`${prefix}=`));
  if (!arg) return null;
  return arg
    .slice(prefix.length + 1)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function main() {
  console.log("\n=== Seed Tier-1 Catalog ===\n");

  const validationUrl = pathToFileURL(
    join(ROOT, "src/backend/envValidation.js")
  ).href;
  const { validateOperationalEnv, formatOperationalEnvErrors } = await import(
    validationUrl
  );

  const envCheck = validateOperationalEnv({
    requireSupabase: true,
    requireServiceRole: true,
  });
  if (!envCheck.configured) {
    fail(formatOperationalEnvErrors(envCheck.issues));
  }

  const adminUrl = pathToFileURL(
    join(ROOT, "src/backend/supabase/adminClient.js")
  ).href;
  const seedUrl = pathToFileURL(
    join(ROOT, "src/backend/catalog/catalogSeedUtils.js")
  ).href;
  const generatedDefsUrl = pathToFileURL(
    join(ROOT, "src/backend/catalog/generated/index.js")
  ).href;
  const convUrl = pathToFileURL(
    join(ROOT, "src/backend/catalog/catalogConventions.js")
  ).href;

  const { getSupabaseAdminClient, isSupabaseAdminConfigured } = await import(
    adminUrl
  );
  const { seedCatalogVehicle } = await import(seedUrl);
  const {
    loadGeneratedTier1Definition,
    listGeneratedTier1DefinitionSlugs,
  } = await import(generatedDefsUrl);
  const { CATALOG_CONVENTIONS } = await import(convUrl);

  if (!isSupabaseAdminConfigured()) {
    fail(formatOperationalEnvErrors(["Supabase admin client unavailable"]));
  }

  const only = parseListArg("--only");
  const skip = new Set(parseListArg("--skip") || []);
  const order = CATALOG_CONVENTIONS.onboardingSequence;
  let definitions;

  if (only?.length) {
    definitions = only.map((slug) => {
      const def = loadGeneratedTier1Definition(slug);
      if (!def) fail(`unknown family slug (no generated tier1): ${slug}`);
      return def;
    });
  } else {
    definitions = listGeneratedTier1DefinitionSlugs()
      .filter((slug) => !skip.has(slug))
      .sort((a, b) => {
        const ai = order.indexOf(a);
        const bi = order.indexOf(b);
        if (ai === -1 && bi === -1) return a.localeCompare(b);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      })
      .map((slug) => loadGeneratedTier1Definition(slug))
      .filter(Boolean);
  }

  const supabase = getSupabaseAdminClient();
  let seeded = 0;

  for (const definition of definitions) {
    console.log(`\n--- ${definition.brand} ${definition.name} (${definition.slug}) ---`);
    const result = await seedCatalogVehicle(supabase, definition, {
      seedPhase: "day3-tier1-onboarding",
    });

    if (!result.ok) {
      fail(`${definition.slug}: ${result.error?.message || "seed failed"}`);
    }

    ok(
      `${definition.slug}: ${result.variantCount} variants, ${result.mediaCount} media`
    );
    seeded += 1;
  }

  console.log(`\nbackend-seed-tier1 passed (${seeded} families)\n`);
}

main().catch((e) => fail(e.message));
