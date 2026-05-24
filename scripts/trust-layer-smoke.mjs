/**
 * Real-World EV Data + Trust Layer smoke checks.
 */
import "./lib/bootstrapEnv.mjs";

import { buildVehicleIntelligence, withVehicleIntelligence } from "../src/intelligence/buildVehicleIntelligence.js";
import { buildCompareTrustSummary } from "../src/intelligence/compareTrustSummary.js";
import { buildChargingPracticality } from "../src/intelligence/chargingPracticality.js";
import { buildChargingIntelligence } from "../src/intelligence/chargingIntelligence.js";
import { validateCompareSet, auditIntelligenceBundle } from "../src/intelligence/intelligenceValidation.js";
import { extractCurationMetadata, applyCurationToRange } from "../src/intelligence/curationMetadata.js";
import { buildRangeConfidence } from "../src/intelligence/rangeConfidence.js";
import { buildTrustFaqAnchors } from "../src/intelligence/trustMetadata.js";

let failed = 0;

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    failed += 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

const sampleCar = {
  _id: "1",
  slug: "tata-nexon-ev",
  name: "Tata Nexon EV",
  startingPrice: 1499000,
  specifications: {
    range: 465,
    batteryPack: "40.5 kWh",
    chargingTime: "40 min DC",
    dcChargingKw: 50,
  },
  catalogMeta: {
    claimedRangeKm: 465,
    ownershipWarranty: { batteryYears: 8, batteryKm: 160000 },
    suitabilityScores: { city: 85, highway: 70 },
  },
};

const intel = buildVehicleIntelligence(sampleCar);
assert("intelligence bundle v3", intel?.version === 3);
assert("range has claimed", intel?.range?.claimedRangeKm === 465);
assert(
  "real-world band",
  intel?.range?.estimatedRealWorldKm?.min > 0 &&
    intel?.range?.estimatedRealWorldKm?.max <
      intel.range.claimedRangeKm
);
assert("range confidence source", Boolean(intel?.range?.rangeConfidenceSource));
assert("estimate method", Boolean(intel?.range?.estimateMethod));
assert("confidence explanation", Boolean(intel?.range?.confidenceExplanation));
assert("city/highway bands", intel?.range?.cityRangeKm && intel?.range?.highwayRangeKm);
assert("charging practicality", intel?.chargingPracticality?.hasData);
assert("trust bundle", intel?.trust?.faqAnchors?.length >= 3);
assert("governance audit partial", intel?.governance?.partial !== undefined);

const charging = buildChargingIntelligence(sampleCar);
const practicality = buildChargingPracticality(sampleCar, charging);
assert("practicality summary lines", practicality.summaryLines?.length > 0);

const curated = extractCurationMetadata({
  catalogMeta: {
    intelligenceCuration: {
      reviewed: true,
      editorialNotes: ["Real-world range verified internally"],
      overrides: {
        realWorldRangeKm: { min: 310, max: 360 },
      },
    },
  },
});
assert("curation reviewed", curated.reviewed === true);
let range = buildRangeConfidence(sampleCar);
range = applyCurationToRange(range, curated);
assert(
  "curation range override",
  range.estimatedRealWorldKm?.min === 310 &&
    range.estimatedRealWorldKm?.max === 360
);

const carA = withVehicleIntelligence(sampleCar);
const carB = withVehicleIntelligence({
  ...sampleCar,
  _id: "2",
  slug: "mg-zs-ev",
  name: "MG ZS EV",
  specifications: { range: 461, batteryPack: "50.3 kWh", dcChargingKw: 76 },
});
const compareTrust = buildCompareTrustSummary([carA, carB]);
assert("compare trust summary", compareTrust.hasData);
assert("compare trust range rows", compareTrust.rangeRows.length === 2);

const compareValidation = validateCompareSet([carA, carB]);
assert("compare validation safe", compareValidation.safe === true);

const audit = auditIntelligenceBundle(intel);
assert("audit partial safe", typeof audit.partial === "boolean");

assert("trust FAQ anchors", buildTrustFaqAnchors().length >= 3);

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll trust-layer smoke checks passed.");
