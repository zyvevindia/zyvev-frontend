/**
 * Backend persistence smoke — safe offline (skips when Supabase env unset).
 * Run: npm run backend:persistence-smoke
 *
 * Live validation (requires schema + 002 read policies applied):
 *   VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... npm run backend:persistence-smoke -- --live
 */

import "./lib/bootstrapEnv.mjs";

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { getNodeEnvLoadResult } from "./lib/loadEnv.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LIVE = process.argv.includes("--live");

const REQUIRED_PATHS = [
  "src/backend/index.js",
  "src/backend/config.js",
  "src/backend/envValidation.js",
  "src/backend/activation.js",
  "src/backend/supabase/client.js",
  "src/backend/services/persistenceMirror.js",
  "src/backend/services/sessionService.js",
  "src/backend/schema/migrations/001_foundation.sql",
  "src/backend/schema/migrations/002_foundation_read_policies.sql",
  "src/backend/services/compareEventService.js",
  "src/backend/services/trustFeedbackService.js",
  "src/backend/services/leadService.js",
  "src/backend/services/operationalSnapshotService.js",
  "src/backend/services/authService.js",
  "src/backend/services/vehicleService.js",
  "src/backend/services/vehicleMediaService.js",
];

const SCHEMA_TABLES = [
  "users",
  "sessions",
  "compare_events",
  "trust_feedback",
  "leads",
  "vehicles",
  "vehicle_variants",
  "vehicle_media",
  "operational_snapshots",
];

function fail(msg) {
  console.error(`backend-persistence-smoke FAILED: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

async function assertLiveWriteRead(label, writeResult, readResult) {
  if (!writeResult.ok && !writeResult.skipped) {
    fail(`${label} write: ${writeResult.error?.message || "unknown"}`);
  }
  ok(`${label} write`);
  if (!readResult.ok && !readResult.skipped) {
    fail(`${label} read: ${readResult.error?.message || "unknown"}`);
  }
  ok(`${label} read`);
}

async function main() {
  console.log("\n=== backend persistence smoke ===\n");

  const envLoad = getNodeEnvLoadResult();
  if (envLoad?.loadedFiles?.length) {
    ok(`env loaded: ${envLoad.loadedFiles.join(", ")}`);
  } else {
    ok("env files not found — using process environment only");
  }

  const runtimeUrl = process.env.VITE_SUPABASE_URL;
  ok(`runtime process.env VITE_SUPABASE_URL=${runtimeUrl ? "set" : "MISSING"}`);

  for (const rel of REQUIRED_PATHS) {
    if (!existsSync(join(ROOT, rel))) {
      fail(`missing ${rel}`);
    }
  }
  ok("backend file structure");

  const sql = readFileSync(
    join(ROOT, "src/backend/schema/migrations/001_foundation.sql"),
    "utf8"
  );
  for (const table of SCHEMA_TABLES) {
    if (
      !sql.includes(`public.${table}`) &&
      !sql.includes(`CREATE TABLE IF NOT EXISTS public.${table}`)
    ) {
      fail(`schema missing table ${table}`);
    }
  }
  ok("schema defines 9 foundation tables");

  const sql2 = readFileSync(
    join(ROOT, "src/backend/schema/migrations/002_foundation_read_policies.sql"),
    "utf8"
  );
  if (!sql2.includes("compare_events_anon_select")) {
    fail("002 read policies migration incomplete");
  }
  ok("read policies migration present");

  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  if (!pkg.dependencies?.["@supabase/supabase-js"]) {
    fail("@supabase/supabase-js not in package.json dependencies");
  }
  ok("@supabase/supabase-js installed");

  const backendUrl = pathToFileURL(join(ROOT, "src/backend/index.js")).href;
  const backend = await import(backendUrl);

  const env = backend.validateBackendEnv();
  if (env.configured) {
    ok("Supabase env configured");
  } else {
    ok("Supabase env not set — graceful idle mode");
  }

  if (env.issues.some((i) => i.includes("SERVICE_ROLE"))) {
    fail("service role key exposed to frontend env");
  }
  ok("no service role in frontend env");

  const sanity = await backend.runPersistenceSanityCheck();
  if (!sanity.ok && env.configured) {
    fail(sanity.message || "persistence sanity check failed");
  }
  ok(sanity.message || "persistence sanity check");

  if (LIVE && env.configured) {
    const sessionKey = `smoke-${Date.now()}`;

    const sessionTouch = await backend.touchSession({
      sessionKey,
      source: "backend-persistence-smoke",
    });
    await assertLiveWriteRead("sessions", sessionTouch, await backend.getSessionByKey(sessionKey));

    const compareWrite = await backend.insertCompareEvent({
      eventType: "smoke_compare_started",
      sessionKey,
      pairSlug: "tata-nexon-ev-vs-mg-zs-ev",
      vehicleSlugs: ["tata-nexon-ev", "mg-zs-ev"],
      payload: { source: "backend-persistence-smoke" },
    });
    await assertLiveWriteRead(
      "compare_events",
      compareWrite,
      await backend.listRecentCompareEvents({ limit: 3 })
    );

    const trustWrite = await backend.insertTrustFeedback({
      feedbackType: "recommendation_doubted",
      sessionKey,
      pairSlug: "tata-nexon-ev-vs-mg-zs-ev",
      severity: "medium",
      payload: { source: "backend-persistence-smoke" },
    });
    await assertLiveWriteRead(
      "trust_feedback",
      trustWrite,
      await backend.listRecentTrustFeedback({ limit: 3 })
    );

    const leadWrite = await backend.insertLead({
      sessionKey,
      sourcePage: "/compare/tata-nexon-ev-vs-mg-zs-ev",
      pairSlug: "tata-nexon-ev-vs-mg-zs-ev",
      vehicleSlugs: ["tata-nexon-ev"],
      confidence: "high",
      payload: { source: "backend-persistence-smoke", eventType: "lead_submitted" },
    });
    await assertLiveWriteRead("leads", leadWrite, await backend.listRecentLeads({ limit: 3 }));

    const mirror = await backend.persistUsageLearningEvent({
      type: "compare_started",
      sessionId: sessionKey,
      meta: {
        pairSlug: "tata-nexon-ev-vs-mg-zs-ev",
        sourcePage: "/compare/tata-nexon-ev-vs-mg-zs-ev",
      },
      at: new Date().toISOString(),
    });
    if (!mirror.ok && !mirror.skipped) {
      fail(`persistence mirror: ${mirror.error?.message || "unknown"}`);
    }
    ok("persistence mirror compare_started");

    const authSession = await backend.getSupabaseSession();
    if (authSession.skipped) {
      ok("auth session check skipped");
    } else {
      ok(`auth session ${authSession.session ? "active" : "none"} (expected none for smoke)`);
    }

    const vehicle = await backend.getVehicleBySlug("tata-nexon-ev");
    if (vehicle.ok && vehicle.data) {
      ok("catalog read tata-nexon-ev (seed present)");
    } else {
      ok("catalog read tata-nexon-ev skipped (run backend:seed-tier1 with service role)");
    }
  } else if (LIVE) {
    ok("live test skipped (env not configured)");
  }

  console.log("\nbackend-persistence-smoke passed\n");
}

main().catch((e) => fail(e.message));
