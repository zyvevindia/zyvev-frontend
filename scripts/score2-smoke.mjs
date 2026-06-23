/**
 * Score 2.0 profile layer smoke checks (no browser).
 */
import "./lib/bootstrapEnv.mjs";

import { getVehicleScoreProfile } from "../src/score2/scoreRegistry.js";
import {
  CONFIDENCE_LEVELS,
  RECOMMENDATION_PERSONAS,
  SCORE_DIMENSIONS,
  SCORE_TIERS,
} from "../src/score2/constants.js";

const VALIDATION_SLUGS = [
  "tata-nexon-ev",
  "mg-comet-ev",
  "byd-seal",
  "mahindra-be-6",
];

/** @type {Record<string, import("../src/score2/constants.js").ScoreTier>} */
const EXPECTED_OVERALL = {
  "mg-comet-ev": SCORE_TIERS.MODERATE,
  "tata-nexon-ev": SCORE_TIERS.GOOD,
  "byd-seal": SCORE_TIERS.GOOD,
  "mahindra-be-6": SCORE_TIERS.GOOD,
};

const SCORE_TIER_SET = new Set(Object.values(SCORE_TIERS));
const CONFIDENCE_SET = new Set(Object.values(CONFIDENCE_LEVELS));

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

function printProfile(slug, profile) {
  const explanation = profile.explanation;

  console.log(`\n=== ${slug} ===`);
  console.log(`Vehicle: ${profile.vehicleSlug}`);
  console.log(`Overall tier: ${profile.score.overall}`);
  console.log(`Summary: ${explanation.summary}`);

  printList("Strengths:", explanation.strengths);
  printList("Weaknesses:", explanation.weaknesses);
  printList("Best for:", explanation.bestFor);
  printList("Avoid if:", explanation.avoidIf);

  console.log("Persona narratives:");
  console.log(`  cityBuyer: ${explanation.cityNarrative}`);
  console.log(`  familyBuyer: ${explanation.familyNarrative}`);
  console.log(`  highwayBuyer: ${explanation.highwayNarrative}`);
  console.log(`  budgetBuyer: ${explanation.budgetNarrative}`);
  console.log(`  premiumBuyer: ${explanation.premiumNarrative}`);

  console.log("Confidence narratives:");
  for (const dimension of SCORE_DIMENSIONS) {
    console.log(
      `  ${dimension}: ${explanation.confidenceNarratives[dimension]}`
    );
  }
}

for (const slug of VALIDATION_SLUGS) {
  const profile = getVehicleScoreProfile(slug);

  assert(`${slug} profile loads`, profile != null);
  if (!profile) continue;

  assert(`${slug} vehicleSlug matches`, profile.vehicleSlug === slug);
  assert(
    `${slug} overall tier valid`,
    SCORE_TIER_SET.has(profile.score.overall)
  );

  if (EXPECTED_OVERALL[slug]) {
    assert(
      `${slug} overall matches editorial expectation (${EXPECTED_OVERALL[slug]})`,
      profile.score.overall === EXPECTED_OVERALL[slug]
    );
  }

  if (slug !== "mg-comet-ev") {
    assert(
      `${slug} mainstream overall is not limited`,
      profile.score.overall !== SCORE_TIERS.LIMITED &&
        profile.score.overall !== SCORE_TIERS.INSUFFICIENT
    );
  }

  for (const persona of RECOMMENDATION_PERSONAS) {
    assert(
      `${slug} recommendation.${persona} valid`,
      SCORE_TIER_SET.has(profile.recommendation[persona])
    );
  }

  for (const dimension of SCORE_DIMENSIONS) {
    assert(
      `${slug} confidence.${dimension} valid`,
      CONFIDENCE_SET.has(profile.confidence[dimension])
    );
    assert(
      `${slug} score.${dimension} valid`,
      SCORE_TIER_SET.has(profile.score[dimension])
    );
  }

  const explanation = profile.explanation;

  assert(
    `${slug} explanation summary present`,
    typeof explanation.summary === "string" && explanation.summary.trim().length > 0
  );

  for (const field of [
    "strengths",
    "weaknesses",
    "bestFor",
    "avoidIf",
  ]) {
    assert(
      `${slug} explanation.${field} is array`,
      Array.isArray(explanation[field])
    );
  }

  for (const field of [
    "cityNarrative",
    "familyNarrative",
    "highwayNarrative",
    "budgetNarrative",
    "premiumNarrative",
  ]) {
    assert(
      `${slug} explanation.${field} present`,
      typeof explanation[field] === "string" && explanation[field].trim().length > 0
    );
  }

  assert(
    `${slug} explanation.confidenceNarratives present`,
    explanation.confidenceNarratives != null &&
      typeof explanation.confidenceNarratives === "object"
  );

  for (const dimension of SCORE_DIMENSIONS) {
    assert(
      `${slug} confidence narrative.${dimension} present`,
      typeof explanation.confidenceNarratives[dimension] === "string" &&
        explanation.confidenceNarratives[dimension].trim().length > 0
    );
  }

  printProfile(slug, profile);
}

console.log(`\nScore2 smoke: ${failed === 0 ? "PASS" : "FAIL"}`);
process.exit(failed === 0 ? 0 : 1);
