/**
 * Seed Tier-1 catalog vehicles into Supabase (disciplined onboarding).
 * Requires: VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (scripts only).
 *
 * Run:
 *   npm run backend:seed-tier1              # all 11 families
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
  const defsUrl = pathToFileURL(
    join(ROOT, "src/backend/catalog/tier1CatalogDefinitions.js")
  ).href;
  const convUrl = pathToFileURL(
    join(ROOT, "src/backend/catalog/catalogConventions.js")
  ).href;

  const { getSupabaseAdminClient, isSupabaseAdminConfigured } = await import(
    adminUrl
  );
  const { seedCatalogVehicle } = await import(seedUrl);
  const { TIER1_CATALOG_DEFINITIONS } = await import(defsUrl);
  const { CATALOG_CONVENTIONS } = await import(convUrl);

  if (!isSupabaseAdminConfigured()) {
    fail(formatOperationalEnvErrors(["Supabase admin client unavailable"]));
  }

  const only = parseListArg("--only");
  const skip = new Set(parseListArg("--skip") || []);

  let definitions = TIER1_CATALOG_DEFINITIONS;
  if (only?.length) {
    definitions = only.map((slug) => {
      const def = TIER1_CATALOG_DEFINITIONS.find((d) => d.slug === slug);
      if (!def) fail(`unknown family slug: ${slug}`);
      return def;
    });
  } else {
    const order = CATALOG_CONVENTIONS.onboardingSequence;
    definitions = [...TIER1_CATALOG_DEFINITIONS].sort(
      (a, b) => order.indexOf(a.slug) - order.indexOf(b.slug)
    );
    definitions = definitions.filter((d) => !skip.has(d.slug));
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
