/**
 * Buyer fit engine smoke checks (no browser).
 */
import "./lib/bootstrapEnv.mjs";

import { FIT_TIERS } from "../src/recommendations/fitConstants.js";
import { BUYER_ARCHETYPE_IDS } from "../src/recommendations/constants.js";
import { listBuyerArchetypes } from "../src/recommendations/archetypeRegistry.js";
import { getArchetypeFit } from "../src/recommendations/fitRegistry.js";

const VALIDATION_SLUGS = [
  "tata-nexon-ev",
  "mg-comet-ev",
  "byd-seal",
  "mahindra-be-6",
];

/** @type {Record<string, Partial<Record<string, string>>>} */
const EXPECTED_FIT_TIERS = {
  "tata-nexon-ev": {
    [BUYER_ARCHETYPE_IDS.FAMILY_BUYER]: FIT_TIERS.GOOD,
    [BUYER_ARCHETYPE_IDS.CITY_COMMUTER]: FIT_TIERS.GOOD,
    [BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER]: FIT_TIERS.GOOD,
    [BUYER_ARCHETYPE_IDS.BUDGET_BUYER]: FIT_TIERS.MODERATE,
    [BUYER_ARCHETYPE_IDS.PREMIUM_BUYER]: FIT_TIERS.LIMITED,
  },
  "mg-comet-ev": {
    [BUYER_ARCHETYPE_IDS.CITY_COMMUTER]: FIT_TIERS.EXCELLENT,
    [BUYER_ARCHETYPE_IDS.BUDGET_BUYER]: FIT_TIERS.EXCELLENT,
    [BUYER_ARCHETYPE_IDS.FAMILY_BUYER]: FIT_TIERS.LIMITED,
    [BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER]: FIT_TIERS.INSUFFICIENT,
  },
  "byd-seal": {
    [BUYER_ARCHETYPE_IDS.PREMIUM_BUYER]: FIT_TIERS.EXCELLENT,
    [BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER]: FIT_TIERS.GOOD,
    [BUYER_ARCHETYPE_IDS.BUDGET_BUYER]: FIT_TIERS.LIMITED,
  },
};

const FIT_TIER_SET = new Set(Object.values(FIT_TIERS));
const FIT_CONFIDENCE_SET = new Set(["high", "medium", "low"]);

let failed = 0;

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    failed += 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

function printList(title, items = []) {
  console.log(title);
  if (!items.length) {
    console.log("  (none)");
    return;
  }
  for (const item of items) {
    console.log(`  - ${item}`);
  }
}

const archetypes = listBuyerArchetypes();

for (const slug of VALIDATION_SLUGS) {
  console.log(`\n=== ${slug} ===\n`);

  for (const archetype of archetypes) {
    const fit = getArchetypeFit(archetype.id, slug);

    assert(`${slug} + ${archetype.id} fit loads`, fit != null);
    if (!fit) continue;

    assert(
      `${slug} + ${archetype.id} fit tier valid`,
      FIT_TIER_SET.has(fit.fitTier)
    );
    assert(
      `${slug} + ${archetype.id} confidence valid`,
      FIT_CONFIDENCE_SET.has(fit.confidence)
    );
    assert(
      `${slug} + ${archetype.id} has 2-4 reasons`,
      fit.reasons.length >= 2 && fit.reasons.length <= 4
    );
    assert(
      `${slug} + ${archetype.id} cautions within limit`,
      fit.cautions.length <= 2
    );

    const expected = EXPECTED_FIT_TIERS[slug]?.[archetype.id];
    if (expected) {
      assert(
        `${slug} + ${archetype.id} matches editorial expectation (${expected})`,
        fit.fitTier === expected
      );
    }

    console.log(`Archetype: ${archetype.title}`);
    console.log(`Fit tier: ${fit.fitTier}`);
    printList("Reasons:", fit.reasons);
    printList("Cautions:", fit.cautions);
    console.log(`Confidence: ${fit.confidence}`);
    console.log("");
  }
}

console.log(`\nFit engine smoke: ${failed === 0 ? "PASS" : "FAIL"}`);
process.exit(failed === 0 ? 0 : 1);
