/**
 * Semi-automated catalog ingestion smoke — deterministic pipeline only (no network).
 */

import "./lib/bootstrapEnv.mjs";

import assert from "node:assert/strict";

import { validateImportEnvelope } from "../src/intelligence/ingestion/importSchema.js";
import { runIngestionPipeline } from "../src/intelligence/ingestion/runIngestionPipeline.js";
import { INGESTION_FORMAT } from "../src/intelligence/ingestion/constants.js";

const sampleJson = JSON.stringify({
  format: INGESTION_FORMAT,
  sourceSystem: "smoke_test",
  items: [
    { slug: "tata-nexon-ev", starting_price: 1_599_000, range_km: 465 },
    { slug: "unknown-slug-xyz", starting_price: 1_000_000 },
  ],
});

const mockCar = {
  slug: "tata-nexon-ev",
  name: "Tata Nexon EV",
  startingPrice: 1_550_000,
  price: 1_550_000,
  specifications: { range: 450, batteryPack: "40 kWh" },
};

console.log("\n=== ingestion:smoke ===\n");

const bad = validateImportEnvelope({ format: "wrong", items: [] });
assert.equal(bad.ok, false);

const ok = runIngestionPipeline("json", sampleJson, {}, [mockCar]);
assert.ok(ok.ok);
assert.ok(ok.session.id);
assert.ok(ok.session.diffReports.length === 2);

const nexonDiff = ok.session.diffReports.find((d) => d.slug === "tata-nexon-ev");
assert.ok(nexonDiff.changes.length >= 1);
assert.ok(["minor", "pricing", "intelligence"].includes(nexonDiff.severity));

console.log("OK: ingestion schema + pipeline + diff shape\n");
