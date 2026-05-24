/**
 * Seed Tata Nexon EV — foundation catalog validation.
 * Requires: VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (scripts only, never Vite).
 *
 * Run: npm run backend:seed-nexon-ev
 */

import "./lib/bootstrapEnv.mjs";

import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function fail(msg) {
  console.error(`backend-seed-nexon-ev FAILED: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

async function main() {
  console.log("\n=== Seed Tata Nexon EV ===\n");

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

  const { getSupabaseAdminClient, isSupabaseAdminConfigured } = await import(
    adminUrl
  );
  const { seedCatalogVehicle } = await import(seedUrl);
  const { getTier1Definition } = await import(defsUrl);

  if (!isSupabaseAdminConfigured()) {
    fail(formatOperationalEnvErrors(["Supabase admin client unavailable"]));
  }

  const definition = getTier1Definition("tata-nexon-ev");
  if (!definition) fail("tata-nexon-ev definition missing");

  const supabase = getSupabaseAdminClient();
  const result = await seedCatalogVehicle(supabase, definition, {
    seedPhase: "day3-nexon-foundation",
  });

  if (!result.ok) {
    fail(result.error?.message || "seed failed");
  }

  ok(`vehicle ${result.vehicle.slug} (${result.vehicle.id})`);
  for (const v of result.variants) ok(`variant ${v.slug}`);
  for (const role of result.media) ok(`media role ${role}`);
  ok(
    `read-back: ${result.variantCount} variants, ${result.mediaCount} media rows`
  );

  console.log("\nbackend-seed-nexon-ev passed\n");
}

main().catch((e) => fail(e.message));
