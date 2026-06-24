/**
 * AI Buyer Assistant smoke checks (no browser).
 */
import "./lib/bootstrapEnv.mjs";

import {
  buildQuestionFlow,
  getAssistantResponse,
  getConversationState,
  listAssistantQuestions,
} from "../src/aiAssistant/index.js";

/** @type {ReadonlyArray<{
 *   title: string,
 *   answers: Record<string, { questionId: string, optionId: string, label?: string }>,
 *   expectedStrongIncludes?: string[],
 * }>} */
const SCENARIOS = [
  {
    title: "Scenario 1 — family, mixed usage, value focus",
    answers: {
      budget: { questionId: "budget", optionId: "range_15_20l", label: "15–20L" },
      usage: { questionId: "usage", optionId: "mixed", label: "Mixed" },
      family: { questionId: "family", optionId: "family", label: "Family" },
      charging: { questionId: "charging", optionId: "home", label: "Home" },
      priority: { questionId: "priority", optionId: "value", label: "Value" },
    },
    expectedStrongIncludes: ["Nexon EV", "Curvv EV", "BE 6"],
  },
  {
    title: "Scenario 2 — city commuter, apartment charging, running cost",
    answers: {
      budget: { questionId: "budget", optionId: "under_15l", label: "<15L" },
      usage: { questionId: "usage", optionId: "city", label: "City" },
      family: { questionId: "family", optionId: "single", label: "Single" },
      charging: {
        questionId: "charging",
        optionId: "apartment",
        label: "Apartment",
      },
      priority: {
        questionId: "priority",
        optionId: "running_cost",
        label: "Running Cost",
      },
    },
    expectedStrongIncludes: ["Comet EV", "Tiago EV"],
  },
  {
    title: "Scenario 3 — premium highway buyer",
    answers: {
      budget: { questionId: "budget", optionId: "range_30l_plus", label: "30L+" },
      usage: { questionId: "usage", optionId: "highway", label: "Highway" },
      family: { questionId: "family", optionId: "single", label: "Single" },
      charging: { questionId: "charging", optionId: "home", label: "Home" },
      priority: {
        questionId: "priority",
        optionId: "premium_experience",
        label: "Premium Experience",
      },
    },
    expectedStrongIncludes: ["BYD Seal", "Ioniq 5"],
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

function includesVehicle(matches, needle) {
  return matches.some((match) =>
    String(match.vehicleName || "").includes(needle.replace(" EV", ""))
  );
}

function printScenario(title, response) {
  console.log(`\n${"=".repeat(72)}`);
  console.log(title);
  console.log("=".repeat(72));

  assert(`${title}: conversation complete`, response.state.complete);
  assert(`${title}: journey generated`, Boolean(response.journey));
  assert(`${title}: recommendations generated`, response.recommendations.length > 0);
  assert(`${title}: follow-up questions generated`, response.followUpQuestions.length > 0);

  if (!response.journey) return;

  console.log("\nStrong matches:");
  for (const match of response.buckets?.strongMatches || []) {
    console.log(`  - ${match.vehicleName} (${match.anchorFitTier})`);
  }

  console.log("\nPrimary recommendation:");
  const primary = response.recommendations[0];
  if (primary) {
    console.log(`  ${primary.vehicleName}`);
    console.log(`  Headline: ${primary.headline}`);
    console.log(`  Summary: ${primary.summary}`);
    console.log(`  Confidence: ${primary.confidence}`);
  }

  console.log("\nFollow-up questions:");
  for (const item of response.followUpQuestions.slice(0, 4)) {
    console.log(`  - ${item.prompt}`);
  }
}

function validateScenario(title, response, expectations = {}) {
  if (!response.journey) return;

  for (const needle of expectations.expectedStrongIncludes || []) {
    assert(
      `${title}: strong matches include ${needle}`,
      includesVehicle(response.buckets?.strongMatches || [], needle)
    );
  }

  assert(`${title}: no ranking field`, !("rankings" in response.journey));
  assert(`${title}: no overall winner field`, !("overallWinner" in response.journey));
}

console.log("AI Buyer Assistant smoke\n");

assert("lists assistant questions", listAssistantQuestions().length === 5);

const emptyState = getConversationState({});
const emptyFlow = buildQuestionFlow(emptyState);
assert("empty state starts at budget", emptyState.currentStage === "budget");
assert("empty flow has next question", Boolean(emptyFlow.nextQuestion));
assert("empty flow progress is zero", emptyFlow.completionProgress === 0);

for (const scenario of SCENARIOS) {
  const response = getAssistantResponse(scenario.answers);
  printScenario(scenario.title, response);
  validateScenario(scenario.title, response, scenario);
}

console.log(`\n${"=".repeat(72)}`);
if (failed) {
  console.error(`\nAssistant smoke: ${failed} failure(s)`);
  process.exit(1);
}

console.log("\nAssistant smoke: PASS");
