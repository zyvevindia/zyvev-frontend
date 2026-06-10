/**
 * Recommend default extraction provider from benchmark comparison.
 */

const WEIGHTS = Object.freeze({
  accuracy: 0.4,
  variantHandling: 0.25,
  cost: 0.2,
  latency: 0.15,
});

function avgAccuracy(metrics = {}) {
  const vals = [
    metrics.fieldAccuracy,
    metrics.priceAccuracy,
    metrics.variantAccuracy,
    metrics.featureAccuracy,
  ].filter((n) => Number.isFinite(n));
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
}

function normalizeInverse(value, max) {
  if (!Number.isFinite(value) || max <= 0) return 0;
  return 1 - Math.min(value / max, 1);
}

/**
 * @param {object[]} providerAggregates — from aggregateLlmProviderResults
 * @param {object} costReport — from buildCostReport
 */
export function recommendProvider(providerAggregates = [], costReport = {}) {
  const eligible = providerAggregates.filter((p) => p.ran && p.metrics);
  if (!eligible.length) {
    return {
      recommended: "heuristic",
      reason: "No provider benchmark data available",
      scores: [],
    };
  }

  const maxCost = Math.max(
    ...eligible.map((p) => costReport.byProvider?.[p.providerId]?.costPerVehicleUsd ?? 0),
    0.001
  );
  const maxLatency = Math.max(...eligible.map((p) => p.avgLatencyMs || 0), 1);

  const scores = eligible.map((p) => {
    const m = p.metrics;
    const accuracyScore = avgAccuracy(m);
    const variantScore = m.variantAccuracy ?? 0;
    const costUsd = costReport.byProvider?.[p.providerId]?.costPerVehicleUsd ?? 0;
    const costScore = normalizeInverse(costUsd, maxCost);
    const latencyScore = normalizeInverse(p.avgLatencyMs || 0, maxLatency);
    const gateBonus = (p.gatePassRate ?? 0) * 0.05;
    const hallucinationPenalty = (m.hallucinationRate ?? 0) * 0.1;

    const composite =
      accuracyScore * WEIGHTS.accuracy +
      variantScore * WEIGHTS.variantHandling +
      costScore * WEIGHTS.cost +
      latencyScore * WEIGHTS.latency +
      gateBonus -
      hallucinationPenalty;

    return {
      providerId: p.providerId,
      model: p.model,
      compositeScore: Math.round(composite * 1000) / 1000,
      breakdown: {
        accuracy: Math.round(accuracyScore * 1000) / 1000,
        variantHandling: Math.round(variantScore * 1000) / 1000,
        cost: Math.round(costScore * 1000) / 1000,
        latency: Math.round(latencyScore * 1000) / 1000,
        gatePassRate: p.gatePassRate,
        hallucinationRate: m.hallucinationRate,
      },
      metrics: m,
      avgLatencyMs: p.avgLatencyMs,
      costPerVehicleUsd: costUsd,
    };
  });

  scores.sort((a, b) => b.compositeScore - a.compositeScore);
  const winner = scores[0];

  const reasons = [];
  if (winner.breakdown.accuracy >= 0.85) reasons.push("highest composite accuracy");
  if (winner.breakdown.variantHandling >= 0.5) reasons.push("strong variant extraction");
  if (winner.providerId === "heuristic") reasons.push("no LLM cost (fallback only)");
  else if (winner.costPerVehicleUsd < 0.02) reasons.push("low per-vehicle API cost");

  return {
    recommended: winner.providerId,
    recommendedModel: winner.model,
    reason: `Best balance of accuracy (${Math.round(winner.breakdown.accuracy * 100)}%), variant handling (${Math.round(winner.breakdown.variantHandling * 100)}%), cost, and latency. ${reasons.join("; ")}.`,
    criteria: WEIGHTS,
    scores,
    runnerUp: scores[1]?.providerId ?? null,
  };
}
