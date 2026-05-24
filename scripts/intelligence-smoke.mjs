/**
 * EV Intelligence Layer — smoke checks (no browser).
 */
import "./lib/bootstrapEnv.mjs";

import { buildVehicleIntelligence } from "../src/intelligence/buildVehicleIntelligence.js";
import {
  attachIntelligenceToCompareCars,
  getActiveCompareRows,
} from "../src/intelligence/compareSpecRows.js";

const sampleCar = {
  _id: "test-nexon",
  slug: "tata-nexon-ev",
  name: "Tata Nexon EV",
  startingPrice: 1499000,
  specifications: {
    range: 465,
    batteryPack: "40.5 kWh",
    chargingTime: "40 min DC fast charge",
    topSpeed: "120 kmph",
  },
  catalogMeta: {
    claimedRangeKm: 465,
    realWorldRangeKm: { min: 320, max: 380 },
    chargingSummary: "50 kW DC · CCS2 · 10–80% in ~40 min",
    compareValueScore: 82,
    suitabilityScores: { city: 85, highway: 70, family: 78 },
    ownershipWarranty: { batteryYears: 8, batteryKm: 160000 },
    pros: ["V2L support", "Connected car app", "OTA updates"],
    psychologyTags: ["best_for_city"],
  },
};

let failed = 0;

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    failed += 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

const intel = buildVehicleIntelligence(sampleCar);
assert("builds intelligence bundle", intel != null);
assert("charging has data", intel?.charging?.hasData === true);
assert("range has real-world band", intel?.range?.estimatedRealWorldKm != null);
assert("ownership estimates present", intel?.ownership?.monthlyChargingCostInr > 0);
assert("features highlights", (intel?.features?.highlights?.length || 0) > 0);
assert("suitability insights", (intel?.suitability?.insights?.length || 0) >= 4);

const sparseCar = {
  _id: "x",
  specifications: { range: 300, batteryPack: "45 kWh" },
};
const sparseIntel = buildVehicleIntelligence(sparseCar);
assert("sparse car still builds intel", sparseIntel != null);

const compareSet = attachIntelligenceToCompareCars([
  sampleCar,
  { ...sampleCar, _id: "b", slug: "mg-zs-ev", name: "MG ZS EV", startingPrice: 1899000, specifications: { range: 461, batteryPack: "50.3 kWh", chargingTime: "50 min" } },
]);
const rows = getActiveCompareRows(compareSet);
assert("compare rows generated", rows.length >= 6);
assert("includes DC charging row", rows.some((r) => r.id === "dc_charging"));

if (failed > 0) {
  console.error(`\n${failed} intelligence smoke check(s) failed.`);
  process.exit(1);
}

console.log("\nIntelligence smoke passed.");
