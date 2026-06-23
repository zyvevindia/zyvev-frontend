/**
 * Buyer Journey Engine smoke checks (no browser).
 */
import "./lib/bootstrapEnv.mjs";

import {
  BUDGET_RANGES,
  BUYER_PRIORITIES,
  CHARGING_ACCESS,
  DAILY_DISTANCE_RANGES,
  FAMILY_SIZES,
  USAGE_PATTERNS,
} from "../src/buyerJourney/constants.js";
import { getBuyerJourney } from "../src/buyerJourney/buyerJourneyRegistry.js";

/** @type {ReadonlyArray<{
 *   title: string,
 *   input: import("../src/buyerJourney/types.js").BuyerJourneyInput,
 *   expectedStrongIncludes?: string[],
 *   expectedArchetypesInclude?: string[],
 * }>} */
const SCENARIOS = [
  {
    title: "Scenario 1 — family, mixed usage, value focus",
    input: {
      budgetRange: BUDGET_RANGES.RANGE_15_20L,
      dailyDistanceRange: DAILY_DISTANCE_RANGES.RANGE_30_60,
      familySize: FAMILY_SIZES.FAMILY,
      chargingAccess: CHARGING_ACCESS.HOME_CHARGING,
      usagePattern: USAGE_PATTERNS.MIXED,
      priority: BUYER_PRIORITIES.VALUE,
    },
    expectedStrongIncludes: ["Nexon EV", "Curvv EV", "BE 6"],
    expectedArchetypesInclude: ["family-buyer", "budget-buyer"],
  },
  {
    title: "Scenario 2 — city commuter, apartment charging, running cost",
    input: {
      budgetRange: BUDGET_RANGES.RANGE_10_15L,
      dailyDistanceRange: DAILY_DISTANCE_RANGES.UNDER_30,
      familySize: FAMILY_SIZES.SINGLE,
      chargingAccess: CHARGING_ACCESS.APARTMENT_CHARGING,
      usagePattern: USAGE_PATTERNS.CITY,
      priority: BUYER_PRIORITIES.RUNNING_COST,
    },
    expectedStrongIncludes: ["Comet EV", "Tiago EV"],
    expectedArchetypesInclude: ["city-commuter", "budget-buyer"],
  },
  {
    title: "Scenario 3 — premium highway buyer",
    input: {
      budgetRange: BUDGET_RANGES.RANGE_30L_PLUS,
      dailyDistanceRange: DAILY_DISTANCE_RANGES.RANGE_60_100,
      familySize: FAMILY_SIZES.SINGLE,
      chargingAccess: CHARGING_ACCESS.HOME_CHARGING,
      usagePattern: USAGE_PATTERNS.HIGHWAY,
      priority: BUYER_PRIORITIES.PREMIUM_EXPERIENCE,
    },
    expectedStrongIncludes: ["BYD Seal", "Ioniq 5"],
    expectedArchetypesInclude: ["premium-buyer", "highway-traveller"],
  },
];

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

function includesVehicle(matches, needle) {
  return matches.some((match) =>
    String(match.vehicleName || "").includes(needle.replace(" EV", ""))
  );
}

function printScenario(title, journey) {
  console.log(`\n${"=".repeat(72)}`);
  console.log(title);
  console.log("=".repeat(72));

  assert(`${title}: journey exists`, Boolean(journey));

  if (!journey) return;

  console.log("\nResolved archetypes:");
  printList("  Primary:", journey.resolvedArchetypes.primaryArchetypes);
  printList("  Secondary:", journey.resolvedArchetypes.secondaryArchetypes);

  console.log("\nStrong matches:");
  for (const match of journey.recommendations.strongMatches) {
    console.log(`  - ${match.vehicleName} (${match.anchorFitTier})`);
  }

  console.log("\nGood alternatives:");
  for (const match of journey.recommendations.goodAlternatives) {
    console.log(`  - ${match.vehicleName} (${match.anchorFitTier})`);
  }

  console.log("\nWorth considering:");
  for (const match of journey.recommendations.worthConsidering) {
    console.log(`  - ${match.vehicleName} (${match.anchorFitTier})`);
  }

  const explainedSlugs = [
    ...journey.recommendations.strongMatches,
    ...journey.recommendations.goodAlternatives,
  ]
    .slice(0, 2)
    .map((match) => match.vehicleSlug);

  console.log("\nSample explanations:");
  for (const slug of explainedSlugs) {
    const explanation = journey.explanations[slug];
    if (!explanation) continue;
    console.log(`\n  ${explanation.vehicleName}`);
    console.log(`    Headline: ${explanation.headline}`);
    console.log(`    Summary: ${explanation.summary}`);
    printList("    Strengths:", explanation.strengths);
    printList("    Trade-offs:", explanation.tradeOffs);
    console.log(`    Confidence: ${explanation.confidence}`);
  }

  console.log("\nGuidance:");
  printList("  Focus on:", journey.guidance.whoShouldFocus);
  printList("  Consider alternatives if:", journey.guidance.whoMayWantAlternatives);
  printList("  Key considerations:", journey.guidance.keyConsiderations);
}

function validateScenario(title, journey, expectations = {}) {
  if (!journey) return;

  assert(`${title}: has recommendation buckets`, Boolean(journey.recommendations));
  assert(`${title}: no ranking field`, !("rankings" in journey));
  assert(`${title}: no overall winner field`, !("overallWinner" in journey));

  for (const needle of expectations.expectedStrongIncludes || []) {
    assert(
      `${title}: strong matches include ${needle}`,
      includesVehicle(journey.recommendations.strongMatches, needle)
    );
  }

  for (const archetypeId of expectations.expectedArchetypesInclude || []) {
    assert(
      `${title}: primary archetypes include ${archetypeId}`,
      journey.resolvedArchetypes.primaryArchetypes.includes(archetypeId)
    );
  }

  const strongNames = journey.recommendations.strongMatches.map(
    (match) => match.vehicleName
  );
  const sorted = [...strongNames].sort((left, right) =>
    left.localeCompare(right, "en", { sensitivity: "base" })
  );
  assert(
    `${title}: strong matches are alphabetically ordered`,
    JSON.stringify(strongNames) === JSON.stringify(sorted)
  );
}

console.log("Buyer Journey Engine smoke\n");

for (const scenario of SCENARIOS) {
  const journey = getBuyerJourney(scenario.input);
  printScenario(scenario.title, journey);
  validateScenario(scenario.title, journey, scenario);
}

console.log(`\n${"=".repeat(72)}`);
if (failed) {
  console.error(`\nBuyer journey smoke: ${failed} failure(s)`);
  process.exit(1);
}

console.log("\nBuyer journey smoke: PASS");
