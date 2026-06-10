/**
 * LLM provider cost estimation for catalog extraction benchmarking.
 * Prices in USD per 1M tokens — update when provider pricing changes.
 */

export const PROVIDER_PRICING_USD = Object.freeze({
  openai: {
    "gpt-4o-mini": { inputPer1M: 0.15, outputPer1M: 0.6 },
    "gpt-4o": { inputPer1M: 2.5, outputPer1M: 10 },
  },
  anthropic: {
    "claude-3-5-haiku-latest": { inputPer1M: 0.25, outputPer1M: 1.25 },
    "claude-3-5-sonnet-latest": { inputPer1M: 3, outputPer1M: 15 },
  },
  heuristic: { default: { inputPer1M: 0, outputPer1M: 0 } },
});

/** Assumed catalog scale for monthly refresh cost projection. */
export const COST_PROJECTION_DEFAULTS = Object.freeze({
  vehiclesPerMonthRefresh: 25,
  usdToInr: 84,
});

export function estimateTokenCostUsd(provider, model, usage = {}) {
  if (provider === "heuristic") {
    return { inputTokens: 0, outputTokens: 0, totalUsd: 0 };
  }

  const inputTokens = usage.inputTokens ?? usage.promptTokens ?? 0;
  const outputTokens = usage.outputTokens ?? usage.completionTokens ?? 0;
  const table = PROVIDER_PRICING_USD[provider] || {};
  const rates = table[model] || table[Object.keys(table)[0]] || { inputPer1M: 0, outputPer1M: 0 };

  const inputUsd = (inputTokens / 1_000_000) * rates.inputPer1M;
  const outputUsd = (outputTokens / 1_000_000) * rates.outputPer1M;

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    inputUsd,
    outputUsd,
    totalUsd: inputUsd + outputUsd,
    model,
    provider,
  };
}

export function buildCostReport(providerSummaries = [], options = {}) {
  const opts = { ...COST_PROJECTION_DEFAULTS, ...options };
  const byProvider = {};

  for (const summary of providerSummaries) {
    const id = summary.providerId;
    if (id === "heuristic") {
      byProvider[id] = {
        providerId: id,
        costPerVehicleUsd: 0,
        costPerVehicleInr: 0,
        costPer100VehiclesUsd: 0,
        costPer100VehiclesInr: 0,
        monthlyRefreshUsd: 0,
        monthlyRefreshInr: 0,
        avgInputTokens: 0,
        avgOutputTokens: 0,
        vehicleCount: summary.vehicleCount || 0,
      };
      continue;
    }

    const runs = summary.runs || [];
    const costs = runs.map((r) => r.costUsd || 0).filter(Number.isFinite);
    const avgCost = costs.length ? costs.reduce((a, b) => a + b, 0) / costs.length : 0;
    const avgInput =
      runs.length ?
        runs.reduce((a, r) => a + (r.usage?.inputTokens || 0), 0) / runs.length
      : 0;
    const avgOutput =
      runs.length ?
        runs.reduce((a, r) => a + (r.usage?.outputTokens || 0), 0) / runs.length
      : 0;

    byProvider[id] = {
      providerId: id,
      model: summary.model,
      costPerVehicleUsd: Math.round(avgCost * 10000) / 10000,
      costPerVehicleInr: Math.round(avgCost * opts.usdToInr * 100) / 100,
      costPer100VehiclesUsd: Math.round(avgCost * 100 * 100) / 100,
      costPer100VehiclesInr: Math.round(avgCost * 100 * opts.usdToInr * 100) / 100,
      monthlyRefreshUsd:
        Math.round(avgCost * opts.vehiclesPerMonthRefresh * 100) / 100,
      monthlyRefreshInr:
        Math.round(avgCost * opts.vehiclesPerMonthRefresh * opts.usdToInr * 100) / 100,
      avgInputTokens: Math.round(avgInput),
      avgOutputTokens: Math.round(avgOutput),
      vehicleCount: summary.vehicleCount || runs.length,
    };
  }

  return {
    generatedAt: new Date().toISOString(),
    currency: { usd: "USD", inr: "INR", usdToInr: opts.usdToInr },
    projections: {
      vehiclesPerMonthRefresh: opts.vehiclesPerMonthRefresh,
    },
    byProvider,
  };
}
