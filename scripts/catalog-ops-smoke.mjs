/**
 * Catalog Intelligence Ops + Freshness Layer smoke checks.
 */
import { buildVehicleIntelligence } from "../src/intelligence/buildVehicleIntelligence.js";
import {
  buildCatalogSnapshot,
  detectCatalogChanges,
  CHANGE_SEVERITY,
} from "../src/intelligence/changeDetection.js";
import {
  buildFreshnessMetadata,
  FRESHNESS_STATE,
} from "../src/intelligence/freshnessMetadata.js";
import {
  adjustConfidenceForFreshness,
  computeFreshnessScore,
} from "../src/intelligence/freshnessScoring.js";
import {
  auditVehicleCatalog,
  buildCatalogOpsSummary,
} from "../src/intelligence/catalogAudit.js";
import { extractCurationMetadata } from "../src/intelligence/curationMetadata.js";
import { buildChangeTransparency } from "../src/intelligence/changeTransparency.js";

let failed = 0;

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    failed += 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

const baseCar = {
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
    priceLastUpdated: new Date().toISOString(),
    intelligenceFreshness: {
      lastVerifiedAt: new Date().toISOString(),
    },
    intelligenceCuration: {
      reviewed: true,
      reviewedAt: new Date().toISOString(),
      reviewPriority: "normal",
    },
  },
};

const intel = buildVehicleIntelligence(baseCar);
assert("bundle v3", intel?.version === 3);
assert("freshness on bundle", intel?.freshness?.state != null);
assert("transparency on bundle", intel?.transparency != null);

const freshness = buildFreshnessMetadata(baseCar);
assert("fresh state when verified", freshness.state === FRESHNESS_STATE.FRESH);

const score = computeFreshnessScore(freshness);
assert("freshness score category", score.category === "high" || score.score >= 65);

const adjusted = adjustConfidenceForFreshness("medium", freshness);
assert("confidence adjusted", adjusted != null);

const snap = buildCatalogSnapshot(baseCar);
assert("snapshot price", snap.price === 1499000);

const updatedCar = {
  ...baseCar,
  startingPrice: 1599000,
  specifications: { ...baseCar.specifications, range: 489 },
};
const changes = detectCatalogChanges(baseCar, updatedCar);
assert("detect price/range change", changes.hasChanges && changes.changeCount >= 1);
assert(
  "has pricing or major change",
  changes.changes.some(
    (c) =>
      c.severity === CHANGE_SEVERITY.PRICING_UPDATE ||
      c.severity === CHANGE_SEVERITY.MAJOR_SPEC
  )
);

const curation = extractCurationMetadata(baseCar);
assert("curation reviewed", curation.reviewed);
assert("review priority", curation.reviewPriority === "normal");

const transparency = buildChangeTransparency(baseCar);
assert(
  "transparency notes or badges",
  transparency.hasTransparency || transparency.notes?.length >= 0
);

const audit = auditVehicleCatalog(baseCar);
assert("audit summary", audit.summary != null);

const ops = buildCatalogOpsSummary([baseCar, { ...baseCar, _id: "2", slug: "mg-zs-ev", name: "MG ZS EV" }]);
assert("ops summary totals", ops.totalVehicles === 2);

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll catalog-ops smoke checks passed.");
