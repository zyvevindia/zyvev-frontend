/**
 * AI Buyer Assistant validation engine (read-only audit helpers).
 */

import { ASSISTANT_QUESTIONS } from "../../src/aiAssistant/constants.js";
import { getAssistantResponse } from "../../src/aiAssistant/assistantRegistry.js";
import { TIER1_MODEL_FAMILY_SLUGS } from "../../src/data/tier1ModelFamilies.js";
import { BUYER_ARCHETYPE_IDS } from "../../src/recommendations/constants.js";
import { BUYER_ARCHETYPES } from "../../src/recommendations/archetypes.js";
import { getArchetypeFit } from "../../src/recommendations/fitRegistry.js";
import { FIT_TIERS } from "../../src/recommendations/fitConstants.js";
import { tierRank } from "../../src/score2/scoreTierMapping.js";
import { getVehicleScoreProfile } from "../../src/score2/scoreRegistry.js";
import { resolveVehicleName } from "../../src/compareIntelligence/resolveVehicleName.js";

export const VALIDATION_VERSION = "1.0.0-alpha";

const BUDGET_OPTION_IDS = ["under_15l", "range_15_20l", "range_20_30l", "range_30l_plus"];

const BUDGET_LABELS = Object.freeze({
  under_15l: "<15L",
  range_15_20l: "15–20L",
  range_20_30l: "20–30L",
  range_30l_plus: "30L+",
});

const ARCHETYPE_SCENARIOS = Object.freeze({
  [BUYER_ARCHETYPE_IDS.CITY_COMMUTER]: {
    budget: "under_15l",
    usage: "city",
    family: "single",
    charging: "home",
    priority: "running_cost",
  },
  [BUYER_ARCHETYPE_IDS.FAMILY_BUYER]: {
    budget: "range_20_30l",
    usage: "mixed",
    family: "family",
    charging: "home",
    priority: "family_practicality",
  },
  [BUYER_ARCHETYPE_IDS.HIGHWAY_TRAVELLER]: {
    budget: "range_20_30l",
    usage: "highway",
    family: "couple",
    charging: "public",
    priority: "highway_capability",
  },
  [BUYER_ARCHETYPE_IDS.APARTMENT_OWNER]: {
    budget: "range_15_20l",
    usage: "city",
    family: "couple",
    charging: "apartment",
    priority: "running_cost",
  },
  [BUYER_ARCHETYPE_IDS.BUDGET_BUYER]: {
    budget: "under_15l",
    usage: "city",
    family: "single",
    charging: "public",
    priority: "value",
  },
  [BUYER_ARCHETYPE_IDS.PREMIUM_BUYER]: {
    budget: "range_30l_plus",
    usage: "highway",
    family: "single",
    charging: "home",
    priority: "premium_experience",
  },
  [BUYER_ARCHETYPE_IDS.FIRST_TIME_EV_BUYER]: {
    budget: "range_15_20l",
    usage: "mixed",
    family: "couple",
    charging: "home",
    priority: "value",
  },
});

/**
 * @param {Record<string, { optionId: string, label?: string }>} partial
 * @returns {Record<string, { questionId: string, optionId: string, label: string }>}
 */
export function buildAnswersFromPartial(partial = {}) {
  /** @type {Record<string, { questionId: string, optionId: string, label: string }>} */
  const answers = {};

  for (const question of ASSISTANT_QUESTIONS) {
    const raw = partial[question.stage] ?? partial[question.id];
    if (!raw) continue;

    const optionId = typeof raw === "string" ? raw : raw.optionId;
    if (!optionId) continue;

    const option = question.options.find((row) => row.id === optionId);
    answers[question.stage] = {
      questionId: question.id,
      optionId,
      label:
        (typeof raw === "object" && raw.label) ||
        option?.label ||
        optionId,
    };
  }

  return answers;
}

/**
 * @returns {Array<{ id: string, answers: Record<string, { questionId: string, optionId: string, label: string }> }>}
 */
export function generateFullValidationMatrix() {
  const stages = ASSISTANT_QUESTIONS.map((question) => ({
    stage: question.stage,
    questionId: question.id,
    options: question.options,
  }));

  /** @type {Array<{ id: string, answers: Record<string, { questionId: string, optionId: string, label: string }> }>} */
  const scenarios = [];
  let index = 0;

  function walk(stageIndex, partial = {}) {
    if (stageIndex >= stages.length) {
      index += 1;
      scenarios.push({
        id: `matrix-${String(index).padStart(4, "0")}`,
        answers: buildAnswersFromPartial(partial),
      });
      return;
    }

    const { stage, questionId, options } = stages[stageIndex];
    for (const option of options) {
      walk(stageIndex + 1, {
        ...partial,
        [stage]: { optionId: option.id, label: option.label, questionId },
      });
    }
  }

  walk(0);
  return scenarios;
}

/**
 * @returns {Array<{ id: string, title: string, answers: Record<string, { questionId: string, optionId: string, label: string }> }>}
 */
export function generateContradictoryScenarios() {
  const seeds = [
    {
      title: "Budget <15L + Large Family + Highway + Public + Premium",
      partial: {
        budget: { optionId: "under_15l" },
        family: { optionId: "large_family" },
        usage: { optionId: "highway" },
        charging: { optionId: "public" },
        priority: { optionId: "premium_experience" },
      },
    },
    {
      title: "Budget 30L+ + Single + City + Home + Running Cost",
      partial: {
        budget: { optionId: "range_30l_plus" },
        family: { optionId: "single" },
        usage: { optionId: "city" },
        charging: { optionId: "home" },
        priority: { optionId: "running_cost" },
      },
    },
    {
      title: "Apartment + Highway + Family + <15L",
      partial: {
        budget: { optionId: "under_15l" },
        family: { optionId: "family" },
        usage: { optionId: "highway" },
        charging: { optionId: "apartment" },
        priority: { optionId: "family_practicality" },
      },
    },
    {
      title: "Premium priority on budget band <15L",
      partial: {
        budget: { optionId: "under_15l" },
        family: { optionId: "single" },
        usage: { optionId: "city" },
        charging: { optionId: "home" },
        priority: { optionId: "premium_experience" },
      },
    },
    {
      title: "Large family on 30L+ with running-cost priority",
      partial: {
        budget: { optionId: "range_30l_plus" },
        family: { optionId: "large_family" },
        usage: { optionId: "mixed" },
        charging: { optionId: "home" },
        priority: { optionId: "running_cost" },
      },
    },
    {
      title: "Highway usage with apartment charging and value focus",
      partial: {
        budget: { optionId: "range_15_20l" },
        family: { optionId: "couple" },
        usage: { optionId: "highway" },
        charging: { optionId: "apartment" },
        priority: { optionId: "value" },
      },
    },
    {
      title: "City commuter profile with 30L+ budget",
      partial: {
        budget: { optionId: "range_30l_plus" },
        family: { optionId: "single" },
        usage: { optionId: "city" },
        charging: { optionId: "apartment" },
        priority: { optionId: "value" },
      },
    },
    {
      title: "Public charging + premium + large family + 20–30L",
      partial: {
        budget: { optionId: "range_20_30l" },
        family: { optionId: "large_family" },
        usage: { optionId: "mixed" },
        charging: { optionId: "public" },
        priority: { optionId: "premium_experience" },
      },
    },
    {
      title: "Highway capability on <15L with single buyer",
      partial: {
        budget: { optionId: "under_15l" },
        family: { optionId: "single" },
        usage: { optionId: "highway" },
        charging: { optionId: "public" },
        priority: { optionId: "highway_capability" },
      },
    },
    {
      title: "Running cost priority with premium budget and highway",
      partial: {
        budget: { optionId: "range_30l_plus" },
        family: { optionId: "couple" },
        usage: { optionId: "highway" },
        charging: { optionId: "home" },
        priority: { optionId: "running_cost" },
      },
    },
    {
      title: "Value focus with large family and 30L+ budget",
      partial: {
        budget: { optionId: "range_30l_plus" },
        family: { optionId: "large_family" },
        usage: { optionId: "mixed" },
        charging: { optionId: "home" },
        priority: { optionId: "value" },
      },
    },
    {
      title: "Family practicality on <15L with city usage",
      partial: {
        budget: { optionId: "under_15l" },
        family: { optionId: "family" },
        usage: { optionId: "city" },
        charging: { optionId: "apartment" },
        priority: { optionId: "family_practicality" },
      },
    },
    {
      title: "Highway capability with 30L+ and apartment charging",
      partial: {
        budget: { optionId: "range_30l_plus" },
        family: { optionId: "single" },
        usage: { optionId: "highway" },
        charging: { optionId: "apartment" },
        priority: { optionId: "highway_capability" },
      },
    },
    {
      title: "Premium experience on 20–30L with public charging",
      partial: {
        budget: { optionId: "range_20_30l" },
        family: { optionId: "single" },
        usage: { optionId: "highway" },
        charging: { optionId: "public" },
        priority: { optionId: "premium_experience" },
      },
    },
    {
      title: "Large family value seeker on 15–20L",
      partial: {
        budget: { optionId: "range_15_20l" },
        family: { optionId: "large_family" },
        usage: { optionId: "mixed" },
        charging: { optionId: "public" },
        priority: { optionId: "value" },
      },
    },
    {
      title: "Single city buyer with 30L+ and family practicality",
      partial: {
        budget: { optionId: "range_30l_plus" },
        family: { optionId: "single" },
        usage: { optionId: "city" },
        charging: { optionId: "home" },
        priority: { optionId: "family_practicality" },
      },
    },
    {
      title: "Couple highway traveller on <15L budget",
      partial: {
        budget: { optionId: "under_15l" },
        family: { optionId: "couple" },
        usage: { optionId: "highway" },
        charging: { optionId: "home" },
        priority: { optionId: "highway_capability" },
      },
    },
    {
      title: "Apartment + premium + <15L",
      partial: {
        budget: { optionId: "under_15l" },
        family: { optionId: "couple" },
        usage: { optionId: "city" },
        charging: { optionId: "apartment" },
        priority: { optionId: "premium_experience" },
      },
    },
    {
      title: "Public charging running-cost buyer on 30L+",
      partial: {
        budget: { optionId: "range_30l_plus" },
        family: { optionId: "family" },
        usage: { optionId: "city" },
        charging: { optionId: "public" },
        priority: { optionId: "running_cost" },
      },
    },
    {
      title: "Mixed usage large family on 30L+ with value priority",
      partial: {
        budget: { optionId: "range_30l_plus" },
        family: { optionId: "large_family" },
        usage: { optionId: "mixed" },
        charging: { optionId: "public" },
        priority: { optionId: "value" },
      },
    },
    {
      title: "Highway premium on 15–20L with home charging",
      partial: {
        budget: { optionId: "range_15_20l" },
        family: { optionId: "single" },
        usage: { optionId: "highway" },
        charging: { optionId: "home" },
        priority: { optionId: "premium_experience" },
      },
    },
    {
      title: "City large family on 20–30L with running cost",
      partial: {
        budget: { optionId: "range_20_30l" },
        family: { optionId: "large_family" },
        usage: { optionId: "city" },
        charging: { optionId: "apartment" },
        priority: { optionId: "running_cost" },
      },
    },
    {
      title: "Couple mixed usage premium on <15L",
      partial: {
        budget: { optionId: "under_15l" },
        family: { optionId: "couple" },
        usage: { optionId: "mixed" },
        charging: { optionId: "public" },
        priority: { optionId: "premium_experience" },
      },
    },
    {
      title: "Mixed usage with premium priority on 20–30L",
      partial: {
        budget: { optionId: "range_20_30l" },
        family: { optionId: "couple" },
        usage: { optionId: "mixed" },
        charging: { optionId: "home" },
        priority: { optionId: "premium_experience" },
      },
    },
    {
      title: "Single highway on 20–30L with apartment charging",
      partial: {
        budget: { optionId: "range_20_30l" },
        family: { optionId: "single" },
        usage: { optionId: "highway" },
        charging: { optionId: "apartment" },
        priority: { optionId: "highway_capability" },
      },
    },
  ];

  const generated = [];
  const budgetIds = ["under_15l", "range_30l_plus"];
  const usageIds = ["city", "highway"];
  const familyIds = ["single", "large_family"];
  const chargingIds = ["home", "apartment", "public"];
  const priorityIds = ["running_cost", "premium_experience", "family_practicality"];

  let autoIndex = 0;
  for (const budget of budgetIds) {
    for (const usage of usageIds) {
      for (const family of familyIds) {
        for (const charging of chargingIds) {
          for (const priority of priorityIds) {
            if (generated.length + seeds.length >= 25) break;
            const conflictScore =
              (budget === "under_15l" && priority === "premium_experience" ? 2 : 0) +
              (budget === "range_30l_plus" && priority === "running_cost" ? 2 : 0) +
              (usage === "highway" && charging === "apartment" ? 1 : 0) +
              (family === "large_family" && budget === "under_15l" ? 1 : 0);

            if (conflictScore < 2) continue;

            autoIndex += 1;
            generated.push({
              id: `contradiction-auto-${autoIndex}`,
              title: `Auto conflict ${autoIndex}: ${BUDGET_LABELS[budget]}, ${usage}, ${family}, ${charging}, ${priority}`,
              answers: buildAnswersFromPartial({
                budget: { optionId: budget },
                usage: { optionId: usage },
                family: { optionId: family },
                charging: { optionId: charging },
                priority: { optionId: priority },
              }),
            });
          }
        }
      }
    }
  }

  const manual = seeds.map((seed, index) => ({
    id: `contradiction-${index + 1}`,
    title: seed.title,
    answers: buildAnswersFromPartial(seed.partial),
  }));

  const combined = [...manual];
  for (const item of generated) {
    if (combined.length >= 30) break;
    if (!combined.some((row) => JSON.stringify(row.answers) === JSON.stringify(item.answers))) {
      combined.push(item);
    }
  }

  return combined;
}

/**
 * @param {import("../src/score2/scoreTierMapping.js").ScoreTier|null|undefined} tier
 * @param {import("../src/score2/scoreTierMapping.js").ScoreTier} floor
 */
function isTierAtLeast(tier, floor) {
  return tierRank(tier || FIT_TIERS.INSUFFICIENT) >= tierRank(floor);
}

/**
 * @param {string} slug
 * @param {string} budgetOptionId
 * @returns {boolean}
 */
export function isBudgetMisalignedStrongMatch(slug, budgetOptionId) {
  const budgetFit = getArchetypeFit(BUYER_ARCHETYPE_IDS.BUDGET_BUYER, slug);
  const premiumFit = getArchetypeFit(BUYER_ARCHETYPE_IDS.PREMIUM_BUYER, slug);

  if (budgetOptionId === "under_15l") {
    return (
      isTierAtLeast(premiumFit?.fitTier, FIT_TIERS.GOOD) &&
      !isTierAtLeast(budgetFit?.fitTier, FIT_TIERS.MODERATE)
    );
  }

  if (budgetOptionId === "range_30l_plus") {
    return (
      isTierAtLeast(budgetFit?.fitTier, FIT_TIERS.GOOD) &&
      !isTierAtLeast(premiumFit?.fitTier, FIT_TIERS.MODERATE)
    );
  }

  return false;
}

/**
 * @param {ReturnType<typeof getAssistantResponse>} response
 * @param {string} budgetOptionId
 */
export function findBudgetAnomalies(response, budgetOptionId) {
  const strong = response.buckets?.strongMatches || [];
  return strong
    .filter((match) => isBudgetMisalignedStrongMatch(match.vehicleSlug, budgetOptionId))
    .map((match) => ({
      vehicleSlug: match.vehicleSlug,
      vehicleName: match.vehicleName,
      budgetBand: BUDGET_LABELS[budgetOptionId] || budgetOptionId,
      reason:
        budgetOptionId === "under_15l"
          ? "Premium-tier fit dominates budget-tier fit for a <15L brief"
          : "Budget-tier fit dominates premium-tier fit for a 30L+ brief",
    }));
}

/**
 * @param {Array<{ id: string, answers: Record<string, unknown> }>} scenarios
 */
export function runValidationScenarios(scenarios) {
  return scenarios.map((scenario) => {
    const response = getAssistantResponse(scenario.answers);
    return {
      ...scenario,
      response,
    };
  });
}

function initVehicleCoverage() {
  return Object.fromEntries(
    TIER1_MODEL_FAMILY_SLUGS.map((slug) => [
      slug,
      { strong: 0, good: 0, worth: 0, weak: 0, insufficient: 0 },
    ])
  );
}

/**
 * @param {Array<{ response: ReturnType<typeof getAssistantResponse> }>} results
 */
export function buildVehicleCoverageTable(results) {
  const coverage = initVehicleCoverage();

  for (const { response } of results) {
    if (!response?.buckets) continue;

    for (const match of response.buckets.strongMatches || []) {
      if (coverage[match.vehicleSlug]) coverage[match.vehicleSlug].strong += 1;
    }
    for (const match of response.buckets.goodAlternatives || []) {
      if (coverage[match.vehicleSlug]) coverage[match.vehicleSlug].good += 1;
    }
    for (const match of response.buckets.worthConsidering || []) {
      if (coverage[match.vehicleSlug]) coverage[match.vehicleSlug].worth += 1;
    }
    for (const match of response.buckets.weakFits || []) {
      if (!coverage[match.vehicleSlug]) continue;
      coverage[match.vehicleSlug].weak += 1;
      if (match.anchorFitTier === FIT_TIERS.INSUFFICIENT) {
        coverage[match.vehicleSlug].insufficient += 1;
      }
    }
  }

  return coverage;
}

/**
 * @param {Array<{ response: ReturnType<typeof getAssistantResponse> }>} results
 */
export function auditNarrativeQuality(results) {
  const headlineCounts = new Map();
  const summaryCounts = new Map();
  /** @type {Array<{ vehicleName: string, issue: string }>} */
  const issues = [];

  for (const { response } of results) {
    if (!response.state.complete) continue;

    for (const recommendation of response.recommendations) {
      headlineCounts.set(
        recommendation.headline,
        (headlineCounts.get(recommendation.headline) || 0) + 1
      );
      summaryCounts.set(
        recommendation.summary,
        (summaryCounts.get(recommendation.summary) || 0) + 1
      );

      if (!recommendation.whyMatches?.length) {
        issues.push({
          vehicleName: recommendation.vehicleName,
          issue: "Missing why-matches strengths",
        });
      }
      if (!recommendation.tradeOffs?.length) {
        issues.push({
          vehicleName: recommendation.vehicleName,
          issue: "Missing trade-offs",
        });
      }
    }
  }

  const repetitiveHeadlines = [...headlineCounts.entries()]
    .filter(([, count]) => count >= 12)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 8)
    .map(([headline, count]) => ({ headline, count }));

  const repetitiveSummaries = [...summaryCounts.entries()]
    .filter(([, count]) => count >= 8)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 8)
    .map(([summary, count]) => ({ summary, count }));

  return {
    repetitiveHeadlines,
    repetitiveSummaries,
    issues: issues.slice(0, 40),
    missingStrengths: issues.filter((row) => row.issue.includes("why-matches")).length,
    missingTradeOffs: issues.filter((row) => row.issue.includes("trade-offs")).length,
  };
}

/**
 * @param {Array<{ response: ReturnType<typeof getAssistantResponse> }>} matrixResults
 */
export function auditArchetypeCoverage(matrixResults) {
  /** @type {Record<string, { scenarios: number, strong: Map<string, number>, good: Map<string, number>, worth: Map<string, number>, weak: Map<string, number>, insufficient: Map<string, number>, emptyStrong: number }>} */
  const byArchetype = Object.fromEntries(
    BUYER_ARCHETYPES.map((archetype) => [
      archetype.id,
      {
        scenarios: 0,
        strong: new Map(),
        good: new Map(),
        worth: new Map(),
        weak: new Map(),
        insufficient: new Map(),
        emptyStrong: 0,
      },
    ])
  );

  for (const { response } of matrixResults) {
    const primaries = response.journey?.resolvedArchetypes?.primaryArchetypes || [];
    if (!primaries.length || !response.buckets) continue;

    for (const archetypeId of primaries) {
      const bucket = byArchetype[archetypeId];
      if (!bucket) continue;
      bucket.scenarios += 1;

      if (!response.buckets.strongMatches.length) {
        bucket.emptyStrong += 1;
      }

      const add = (map, matches) => {
        for (const match of matches) {
          map.set(match.vehicleSlug, (map.get(match.vehicleSlug) || 0) + 1);
        }
      };

      add(bucket.strong, response.buckets.strongMatches);
      add(bucket.good, response.buckets.goodAlternatives);
      add(bucket.worth, response.buckets.worthConsidering);
      add(bucket.weak, response.buckets.weakFits);
      add(
        bucket.insufficient,
        response.buckets.weakFits.filter(
          (match) => match.anchorFitTier === FIT_TIERS.INSUFFICIENT
        )
      );
    }
  }

  const focused = {};
  for (const archetype of BUYER_ARCHETYPES) {
    const answers = buildAnswersFromPartial(ARCHETYPE_SCENARIOS[archetype.id]);
    const response = getAssistantResponse(answers);
    focused[archetype.id] = {
      title: archetype.title,
      scenario: answers,
      response,
      emptyBuckets: {
        strong: !(response.buckets?.strongMatches || []).length,
        good: !(response.buckets?.goodAlternatives || []).length,
        worth: !(response.buckets?.worthConsidering || []).length,
        weak: !(response.buckets?.weakFits || []).length,
      },
    };
  }

  return { aggregate: byArchetype, focused };
}

/**
 * @param {Array<{ response: ReturnType<typeof getAssistantResponse>, answers: Record<string, { optionId: string }> }>} matrixResults
 */
export function auditBudgetBands(matrixResults) {
  /** @type {Record<string, { scenarios: number, anomalies: Array<{ vehicleName: string, vehicleSlug: string, reason: string }>, emptyStrong: number, avgStrongCount: number }>} */
  const bands = Object.fromEntries(
    BUDGET_OPTION_IDS.map((id) => [
      id,
      { scenarios: 0, anomalies: [], emptyStrong: 0, avgStrongCount: 0 },
    ])
  );

  for (const row of matrixResults) {
    const budgetId = row.answers.budget?.optionId;
    if (!budgetId || !bands[budgetId]) continue;

    bands[budgetId].scenarios += 1;
    const strongCount = row.response.buckets?.strongMatches?.length || 0;
    bands[budgetId].avgStrongCount += strongCount;
    if (!strongCount) bands[budgetId].emptyStrong += 1;

    for (const anomaly of findBudgetAnomalies(row.response, budgetId)) {
      bands[budgetId].anomalies.push(anomaly);
    }
  }

  for (const band of Object.values(bands)) {
    band.avgStrongCount =
      band.scenarios > 0 ? Number((band.avgStrongCount / band.scenarios).toFixed(2)) : 0;
    band.anomalies = band.anomalies.slice(0, 20);
  }

  return bands;
}

/**
 * @param {Array<{ title?: string, response: ReturnType<typeof getAssistantResponse> }>} contradictoryResults
 */
export function auditContradictoryScenarios(contradictoryResults) {
  return contradictoryResults.map((row) => {
    const strong = row.response.buckets?.strongMatches || [];
    const good = row.response.buckets?.goodAlternatives || [];
    const budgetId = row.response.state.answers.budget?.optionId || "";
    const anomalies = findBudgetAnomalies(row.response, budgetId);

    /** @type {string[]} */
    const flags = [];
    if (!row.response.state.complete) flags.push("incomplete_conversation");
    if (!strong.length && !good.length) flags.push("no_recommendations");
    if (!strong.length && good.length) flags.push("no_strong_matches");
    if (anomalies.length) flags.push("budget_misalignment");

    return {
      id: row.id,
      title: row.title,
      answers: row.response.state.answers,
      strongCount: strong.length,
      goodCount: good.length,
      followUpCount: row.response.followUpQuestions.length,
      flags,
      anomalies,
      topStrong: strong.slice(0, 5).map((match) => match.vehicleName),
    };
  });
}

function topEntries(map, limit = 5) {
  return [...map.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([slug, count]) => ({ slug, count }));
}

/**
 * @param {object} audit
 */
export function computeReadinessScores(audit) {
  const archetypeEmptyStrongRate =
    audit.archetypes.focused
      ? Object.values(audit.archetypes.focused).filter((row) => row.emptyBuckets.strong)
          .length / BUYER_ARCHETYPES.length
      : 0;

  const budgetAnomalyCount = Object.values(audit.budgetBands).reduce(
    (sum, band) => sum + band.anomalies.length,
    0
  );

  const contradictoryFailures = audit.contradictory.filter((row) =>
    row.flags.includes("no_recommendations")
  ).length;

  const neverRecommended = audit.diversity.neverRecommended.length;
  const overRecommended = audit.diversity.overRecommended.length;

  const narrativeIssues =
    audit.quality.missingStrengths + audit.quality.missingTradeOffs;

  return {
    archetypeCoverage: archetypeEmptyStrongRate === 0 ? "PASS" : archetypeEmptyStrongRate <= 0.15 ? "WARNING" : "FAIL",
    budgetAlignment:
      budgetAnomalyCount === 0 ? "PASS" : budgetAnomalyCount <= 10 ? "WARNING" : "FAIL",
    contradictoryHandling:
      contradictoryFailures === 0 ? "PASS" : contradictoryFailures <= 2 ? "WARNING" : "FAIL",
    recommendationDiversity:
      neverRecommended === 0 && overRecommended <= 2
        ? "PASS"
        : neverRecommended <= 2
          ? "WARNING"
          : "FAIL",
    narrativeQuality:
      narrativeIssues === 0 ? "PASS" : narrativeIssues <= 25 ? "WARNING" : "FAIL",
    overall:
      budgetAnomalyCount === 0 &&
      contradictoryFailures === 0 &&
      archetypeEmptyStrongRate === 0 &&
      neverRecommended === 0
        ? "PASS"
        : contradictoryFailures > 2 || archetypeEmptyStrongRate > 0.3
          ? "FAIL"
          : "WARNING",
  };
}

/**
 * @param {object} audit
 * @returns {string}
 */
export function buildValidationMarkdown(audit) {
  const lines = [
    "# AI Buyer Assistant Validation Report",
    "",
    `Generated: ${audit.generatedAt}`,
    `Validation version: ${audit.version}`,
    `Matrix scenarios: ${audit.stats.matrixCount}`,
    `Contradictory scenarios: ${audit.stats.contradictoryCount}`,
    "",
    "## Executive Summary",
    "",
    `Overall readiness: **${audit.readiness.overall}**`,
    "",
    "| Category | Score |",
    "| --- | --- |",
    `| Archetype Coverage | ${audit.readiness.archetypeCoverage} |`,
    `| Budget Alignment | ${audit.readiness.budgetAlignment} |`,
    `| Contradictory Handling | ${audit.readiness.contradictoryHandling} |`,
    `| Recommendation Diversity | ${audit.readiness.recommendationDiversity} |`,
    `| Narrative Quality | ${audit.readiness.narrativeQuality} |`,
    "",
    `- Total budget anomalies flagged: ${audit.stats.budgetAnomalyCount}`,
    `- Vehicles never in strong matches: ${audit.diversity.neverRecommended.length}`,
    `- Contradictory scenarios with no recommendations: ${audit.stats.contradictoryNoRecs}`,
    "",
    "## Archetype Coverage",
    "",
  ];

  for (const archetype of BUYER_ARCHETYPES) {
    const focused = audit.archetypes.focused[archetype.id];
    const aggregate = audit.archetypes.aggregate[archetype.id];
    lines.push(`### ${archetype.title}`);
    lines.push("");
    lines.push(
      `Focused scenario strong matches: ${focused.response.buckets?.strongMatches?.length || 0}`
    );
    lines.push(
      `Focused scenario good alternatives: ${focused.response.buckets?.goodAlternatives?.length || 0}`
    );
    lines.push(
      `Focused scenario weak fits: ${focused.response.buckets?.weakFits?.length || 0}`
    );
    lines.push(
      `Aggregate scenarios touching archetype: ${aggregate.scenarios} (empty strong: ${aggregate.emptyStrong})`
    );
    lines.push("");
    lines.push("Top strong matches (aggregate):");
    for (const row of topEntries(aggregate.strong, 6)) {
      lines.push(`- ${row.slug} (${row.count})`);
    }
    lines.push("");
    if (focused.emptyBuckets.strong) {
      lines.push("⚠ Empty strong bucket in focused scenario.");
      lines.push("");
    }
  }

  lines.push("## Budget Coverage", "");
  for (const budgetId of BUDGET_OPTION_IDS) {
    const band = audit.budgetBands[budgetId];
    lines.push(`### ${BUDGET_LABELS[budgetId]}`);
    lines.push("");
    lines.push(`- Scenarios: ${band.scenarios}`);
    lines.push(`- Avg strong matches: ${band.avgStrongCount}`);
    lines.push(`- Empty strong buckets: ${band.emptyStrong}`);
    lines.push(`- Budget anomalies flagged: ${band.anomalies.length}`);
    if (band.anomalies.length) {
      lines.push("");
      lines.push("Sample anomalies:");
      for (const anomaly of band.anomalies.slice(0, 5)) {
        lines.push(`- ${anomaly.vehicleName}: ${anomaly.reason}`);
      }
    }
    lines.push("");
  }

  lines.push("## Contradictory Scenario Results", "");
  lines.push("| Scenario | Strong | Good | Flags | Top strong |");
  lines.push("| --- | ---: | ---: | --- | --- |");
  for (const row of audit.contradictory) {
    lines.push(
      `| ${row.title} | ${row.strongCount} | ${row.goodCount} | ${row.flags.join(", ") || "—"} | ${row.topStrong.join(", ") || "—"} |`
    );
  }
  lines.push("");

  lines.push("## Recommendation Diversity", "");
  lines.push("");
  lines.push("| Vehicle | Strong | Good | Worth | Weak | Insufficient |");
  lines.push("| --- | ---: | ---: | ---: | ---: | ---: |");
  for (const row of audit.diversity.table) {
    lines.push(
      `| ${row.name} | ${row.strong} | ${row.good} | ${row.worth} | ${row.weak} | ${row.insufficient} |`
    );
  }
  lines.push("");
  if (audit.diversity.neverRecommended.length) {
    lines.push("Never in strong matches:");
    for (const slug of audit.diversity.neverRecommended) {
      lines.push(`- ${slug}`);
    }
    lines.push("");
  }
  if (audit.diversity.overRecommended.length) {
    lines.push("Potentially over-recommended in strong matches:");
    for (const row of audit.diversity.overRecommended) {
      lines.push(`- ${row.name}: ${row.strong} appearances (${row.share}% of matrix)`);
    }
    lines.push("");
  }

  lines.push("## Narrative Quality Findings", "");
  lines.push(
    `- Missing strengths: ${audit.quality.missingStrengths} recommendation rows`
  );
  lines.push(
    `- Missing trade-offs: ${audit.quality.missingTradeOffs} recommendation rows`
  );
  lines.push("");
  if (audit.quality.repetitiveHeadlines.length) {
    lines.push("Repetitive headlines:");
    for (const row of audit.quality.repetitiveHeadlines) {
      lines.push(`- (${row.count}×) ${row.headline}`);
    }
    lines.push("");
  }
  if (audit.quality.repetitiveSummaries.length) {
    lines.push("Repetitive summaries:");
    for (const row of audit.quality.repetitiveSummaries) {
      lines.push(`- (${row.count}×) ${row.summary.slice(0, 120)}…`);
    }
    lines.push("");
  }
  if (audit.quality.issues.length) {
    lines.push("Sample quality issues:");
    for (const issue of audit.quality.issues.slice(0, 10)) {
      lines.push(`- ${issue.vehicleName}: ${issue.issue}`);
    }
    lines.push("");
  }

  lines.push("## Anomalies Found", "");
  if (!audit.anomalies.length) {
    lines.push("No critical anomalies detected beyond flagged budget misalignments.");
  } else {
    for (const anomaly of audit.anomalies.slice(0, 25)) {
      lines.push(`- ${anomaly}`);
    }
  }
  lines.push("");

  lines.push("## Suggested Improvements", "");
  for (const item of audit.suggestions) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  lines.push("## Recommendation Readiness Score", "");
  lines.push("");
  lines.push(`**${audit.readiness.overall}** — ready for Phase 15B when overall is PASS or bounded WARNING with no FAIL categories.`);
  lines.push("");

  return lines.join("\n");
}

/**
 * Run the full validation audit.
 */
export function runAssistantValidationAudit() {
  const matrix = generateFullValidationMatrix();
  const contradictory = generateContradictoryScenarios();

  const matrixResults = runValidationScenarios(matrix);
  const contradictoryResults = contradictory.map((scenario) => ({
    ...scenario,
    response: getAssistantResponse(scenario.answers),
  }));

  const coverage = buildVehicleCoverageTable(matrixResults);
  const archetypes = auditArchetypeCoverage(matrixResults);
  const budgetBands = auditBudgetBands(matrixResults);
  const contradictoryAudit = auditContradictoryScenarios(contradictoryResults);
  const quality = auditNarrativeQuality(matrixResults);

  const table = TIER1_MODEL_FAMILY_SLUGS.map((slug) => {
    const counts = coverage[slug];
    const sampleName = resolveVehicleName(slug, getVehicleScoreProfile(slug), null);

    return {
      slug,
      name: sampleName,
      strong: counts.strong,
      good: counts.good,
      worth: counts.worth,
      weak: counts.weak,
      insufficient: counts.insufficient,
    };
  }).sort((left, right) => right.strong - left.strong || left.name.localeCompare(right.name));

  const matrixCount = matrix.length;
  const neverRecommended = table.filter((row) => row.strong === 0).map((row) => row.slug);
  const overRecommended = table
    .filter((row) => row.strong >= Math.ceil(matrixCount * 0.45))
    .map((row) => ({
      slug: row.slug,
      name: row.name,
      strong: row.strong,
      share: Number(((row.strong / matrixCount) * 100).toFixed(1)),
    }));

  const budgetAnomalyCount = Object.values(budgetBands).reduce(
    (sum, band) => sum + band.anomalies.length,
    0
  );

  /** @type {string[]} */
  const anomalies = [];
  for (const [budgetId, band] of Object.entries(budgetBands)) {
    for (const anomaly of band.anomalies.slice(0, 8)) {
      anomalies.push(
        `${BUDGET_LABELS[budgetId]} strong match anomaly: ${anomaly.vehicleName} — ${anomaly.reason}`
      );
    }
  }
  for (const row of contradictoryAudit.filter((item) => item.flags.length)) {
    anomalies.push(`${row.title}: ${row.flags.join(", ")}`);
  }

  const contradictoryNoRecs = contradictoryAudit.filter((row) =>
    row.flags.includes("no_recommendations")
  ).length;

  const audit = {
    generatedAt: new Date().toISOString(),
    version: VALIDATION_VERSION,
    stats: {
      matrixCount,
      contradictoryCount: contradictory.length,
      budgetAnomalyCount,
      contradictoryNoRecs,
    },
    archetypes,
    budgetBands,
    contradictory: contradictoryAudit,
    diversity: {
      table,
      neverRecommended,
      overRecommended,
    },
    quality,
    anomalies,
    suggestions: buildSuggestions({
      neverRecommended,
      overRecommended,
      budgetAnomalyCount,
      quality,
      contradictoryNoRecs,
      archetypes,
    }),
  };

  audit.readiness = computeReadinessScores(audit);
  audit.markdown = buildValidationMarkdown(audit);

  return audit;
}

function buildSuggestions({
  neverRecommended,
  overRecommended,
  budgetAnomalyCount,
  quality,
  contradictoryNoRecs,
  archetypes,
}) {
  /** @type {string[]} */
  const suggestions = [];

  if (neverRecommended.length) {
    suggestions.push(
      `Review ${neverRecommended.length} tier-1 vehicle(s) that never appear in strong matches across the full matrix.`
    );
  }
  if (overRecommended.length) {
    suggestions.push(
      "Investigate over-represented strong-match vehicles for archetype gate tuning before 15B."
    );
  }
  if (budgetAnomalyCount) {
    suggestions.push(
      "Tighten budget-band validation messaging in 15B when anomalies appear, without changing engine logic in 15A.5P."
    );
  }
  if (quality.missingTradeOffs) {
    suggestions.push(
      "Expand trade-off coverage in buyer journey explanations for vehicles with thin narrative output."
    );
  }
  if (quality.repetitiveHeadlines.length) {
    suggestions.push(
      "Add headline variation or scenario-aware phrasing in a future narrative polish pass."
    );
  }
  if (contradictoryNoRecs) {
    suggestions.push(
      "Add fallback guidance copy in 15B when contradictory inputs produce empty recommendation buckets."
    );
  }

  const emptyFocused = Object.values(archetypes.focused).filter(
    (row) => row.emptyBuckets.strong
  );
  if (emptyFocused.length) {
    suggestions.push(
      `${emptyFocused.length} archetype-focused scenario(s) returned empty strong buckets — validate anchor archetype resolution.`
    );
  }

  if (!suggestions.length) {
    suggestions.push(
      "Coverage looks healthy for Phase 15B conversational UI; proceed with presentation-layer work."
    );
  }

  return suggestions;
}
