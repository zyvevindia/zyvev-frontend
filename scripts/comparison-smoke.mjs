/**
 * Compare Intelligence smoke checks (no browser).
 */
import "./lib/bootstrapEnv.mjs";

import { getVehicleComparisonProfile } from "../src/compareIntelligence/comparisonRegistry.js";
import { DIMENSION_OUTCOMES } from "../src/compareIntelligence/constants.js";

/** @type {ReadonlyArray<[string, string, {
 *   valueAdvantage?: string,
 *   familyOutcome?: string,
 *   budgetPreferred?: string,
 *   familyPreferred?: string,
 *   cityPreferred?: string,
 * }?]>} */
const VALIDATION_PAIRS = [
  [
    "tata-nexon-ev",
    "tata-curvv-ev",
    {
      valueAdvantage: "Nexon EV",
      familyOutcome: DIMENSION_OUTCOMES.TIE,
      budgetPreferred: "Nexon EV",
      familyPreferred: "tie",
    },
  ],
  ["tata-nexon-ev", "mahindra-be-6"],
  ["byd-seal", "hyundai-ioniq-5"],
  [
    "mg-comet-ev",
    "tata-tiago-ev",
    {
      cityPreferred: "Comet EV",
    },
  ],
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

function printPair(label, profile) {
  console.log(`\n${"=".repeat(72)}`);
  console.log(label);
  console.log("=".repeat(72));

  assert(`${label}: profile exists`, Boolean(profile));
  if (!profile) return;

  console.log(`\nVehicles: ${profile.primaryVehicle.name} vs ${profile.secondaryVehicle.name}`);

  console.log(`\nHeadline:\n  ${profile.narrative.headline}`);
  console.log(`\nSummary:\n  ${profile.narrative.summary}`);

  console.log("\nDimension comparisons:");
  for (const dimension of profile.dimensionComparisons.dimensions) {
    const suffix =
      dimension.outcome === DIMENSION_OUTCOMES.ADVANTAGE
        ? ` → ${dimension.advantagedVehicleName} advantage`
        : ` → ${dimension.outcome}`;
    console.log(`  - ${dimension.label}${suffix}`);
  }
  console.log(`\nDimension summary:\n  ${profile.dimensionComparisons.dimensionSummary}`);

  printList("\nTrade-offs — primary advantages:", profile.tradeOffAnalysis.advantagesPrimary);
  printList("Trade-offs — secondary advantages:", profile.tradeOffAnalysis.advantagesSecondary);
  printList("Trade-offs:", profile.tradeOffAnalysis.tradeOffs);

  printList("\nShared strengths:", profile.narrative.sharedStrengths);
  printList("Key differences:", profile.narrative.keyDifferences);

  printList(
    `\nTop fits (${profile.primaryVehicle.name}):`,
    profile.topFitsPrimary.map((fit) => `${fit.title} (${fit.fitTier})`)
  );
  printList(
    `Top fits (${profile.secondaryVehicle.name}):`,
    profile.topFitsSecondary.map((fit) => `${fit.title} (${fit.fitTier})`)
  );

  console.log("\nArchetype outcomes:");
  for (const outcome of profile.archetypeComparisons) {
    console.log(
      `  - ${outcome.title}: ${outcome.preferredVehicle}${outcome.preferredVehicle === "tie" ? "" : " preferred"}`
    );
  }
}

function validateEditorialExpectations(label, profile, expectations = {}) {
  if (!profile || !expectations) return;

  if (expectations.valueAdvantage) {
    const valueDimension = profile.dimensionComparisons.dimensions.find(
      (dimension) => dimension.key === "value"
    );
    assert(
      `${label}: value advantage → ${expectations.valueAdvantage}`,
      valueDimension?.outcome === DIMENSION_OUTCOMES.ADVANTAGE &&
        String(valueDimension.advantagedVehicleName || "").includes(
          expectations.valueAdvantage.replace(" EV", "")
        )
    );
  }

  if (expectations.familyOutcome) {
    const familyDimension = profile.dimensionComparisons.dimensions.find(
      (dimension) => dimension.key === "family"
    );
    assert(
      `${label}: family outcome → ${expectations.familyOutcome}`,
      familyDimension?.outcome === expectations.familyOutcome
    );
  }

  if (expectations.budgetPreferred) {
    const budgetOutcome = profile.archetypeComparisons.find(
      (outcome) => outcome.title === "Budget Buyer"
    );
    assert(
      `${label}: budget buyer → ${expectations.budgetPreferred}`,
      String(budgetOutcome?.preferredVehicle || "").includes(
        expectations.budgetPreferred.replace(" EV", "")
      )
    );
  }

  if (expectations.cityPreferred) {
    const cityOutcome = profile.archetypeComparisons.find(
      (outcome) => outcome.title === "City Commuter"
    );
    assert(
      `${label}: city commuter → ${expectations.cityPreferred}`,
      String(cityOutcome?.preferredVehicle || "").includes(
        expectations.cityPreferred.replace(" EV", "")
      )
    );
  }

  if (expectations.familyPreferred) {
    const familyOutcome = profile.archetypeComparisons.find(
      (outcome) => outcome.title === "Family Buyer"
    );
    assert(
      `${label}: family buyer → ${expectations.familyPreferred}`,
      familyOutcome?.preferredVehicle === expectations.familyPreferred
    );
  }
}

function validateStructure(label, profile) {
  assert(`${label}: has vehicles`, Boolean(profile?.primaryVehicle?.name && profile?.secondaryVehicle?.name));
  assert(`${label}: has headline`, Boolean(profile?.narrative?.headline));
  assert(`${label}: has summary`, Boolean(profile?.narrative?.summary));
  assert(`${label}: has 8 dimensions`, profile?.dimensionComparisons?.dimensions?.length === 8);
  assert(`${label}: has dimension summary`, Boolean(profile?.dimensionComparisons?.dimensionSummary));
  assert(`${label}: has trade-off analysis`, Boolean(profile?.tradeOffAnalysis));
  assert(`${label}: has 7 archetype outcomes`, profile?.archetypeComparisons?.length === 7);
  assert(`${label}: no overall winner field`, !("overallWinner" in (profile || {})));

  for (const dimension of profile?.dimensionComparisons?.dimensions || []) {
    assert(
      `${label}: dimension ${dimension.key} has valid outcome`,
      Object.values(DIMENSION_OUTCOMES).includes(dimension.outcome)
    );
  }
}

console.log("Compare Intelligence smoke\n");

for (const [primary, secondary, expectations] of VALIDATION_PAIRS) {
  const profile = getVehicleComparisonProfile(primary, secondary);
  const label = `${profile?.primaryVehicle?.name || primary} vs ${profile?.secondaryVehicle?.name || secondary}`;
  printPair(label, profile);
  validateStructure(label, profile);
  validateEditorialExpectations(label, profile, expectations);
}

console.log(`\n${"=".repeat(72)}`);
if (failed) {
  console.error(`\nComparison smoke: ${failed} failure(s)`);
  process.exit(1);
}

console.log("\nComparison smoke: PASS");
