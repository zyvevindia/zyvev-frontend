/**
 * EV Intelligence Layer Phase 2 smoke checks.
 */
import "./lib/bootstrapEnv.mjs";

import { INTELLIGENCE_DISCOVERY_PRESETS } from "../src/data/intelligenceDiscoveryPresets.js";
import { INTELLIGENCE_FILTER_DEFINITIONS } from "../src/intelligence/filterDefinitions.js";
import { buildEvsavariScores } from "../src/intelligence/scoringEngine.js";
import { buildCompareAdvantages } from "../src/intelligence/compareAdvantages.js";
import { recommendFamilies } from "../src/intelligence/recommendations.js";
import { enrichFamiliesWithIntelligence } from "../src/intelligence/familyIntelligence.js";
import { filterEnrichedFamilies } from "../src/intelligence/filterMatcher.js";
import { buildIntelligenceDiscoverySitemapEntries } from "../src/seo/sitemap.js";
import { withVehicleIntelligence } from "../src/intelligence/buildVehicleIntelligence.js";

let failed = 0;

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    failed += 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

const sampleFamily = {
  familySlug: "tata-nexon-ev",
  familyName: "Tata Nexon EV",
  brand: "Tata",
  startingPrice: 1499000,
  maxRange: 465,
  specifications: {
    range: 465,
    batteryPack: "40.5 kWh",
    chargingTime: "40 min DC",
  },
  catalogMeta: {
    suitabilityScores: { city: 85, highway: 70, family: 78 },
    compareValueScore: 82,
    ownershipWarranty: { batteryYears: 8, batteryKm: 160000 },
    pros: ["V2L", "OTA updates", "ADAS"],
  },
  variants: [],
};

const enriched = enrichFamiliesWithIntelligence([sampleFamily])[0];
assert("family enrichment", enriched.evIntelligence != null);
assert("family scores", enriched.evScores?.composite != null);
assert("taxonomy tags", enriched.taxonomyTags?.rangeCategory != null);

const filtered = filterEnrichedFamilies([sampleFamily], {
  intelligenceFilterIds: ["city_friendly"],
});
assert("city filter matches", filtered.length === 1);

const recs = recommendFamilies([sampleFamily], {
  city: 5,
  budget: 3,
});
assert("recommendations", recs.length >= 1);

const car = withVehicleIntelligence({
  _id: "1",
  slug: "tata-nexon-ev",
  startingPrice: 1499000,
  specifications: { range: 465, batteryPack: "40.5 kWh" },
  catalogMeta: sampleFamily.catalogMeta,
});
const compareAdv = buildCompareAdvantages([
  car,
  withVehicleIntelligence({
    ...car,
    _id: "2",
    slug: "mg-zs-ev",
    name: "MG ZS EV",
    startingPrice: 1899000,
    specifications: { range: 461, batteryPack: "50.3 kWh" },
  }),
]);
assert("compare advantages", compareAdv.highlights.length >= 0);

assert(
  "discovery presets",
  Object.keys(INTELLIGENCE_DISCOVERY_PRESETS).length >= 8
);
assert(
  "filter definitions",
  INTELLIGENCE_FILTER_DEFINITIONS.length >= 12
);

const sitemap = buildIntelligenceDiscoverySitemapEntries();
assert("sitemap entries", sitemap.length >= 8);

const scores = buildEvsavariScores(car, car.evIntelligence);
assert("sub-scores", scores.subScores.chargingConvenience != null);

if (failed > 0) {
  console.error(`\n${failed} phase-2 smoke check(s) failed.`);
  process.exit(1);
}

console.log("\nIntelligence Phase 2 smoke passed.");
