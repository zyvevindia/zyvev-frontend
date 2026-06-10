/**
 * EVSavari Score Engine v1 — validation against 10 vehicles.
 * Generates docs/scoring/score-engine-v1-validation.md and .json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  loadAllGoldenDossiers,
  findGoldenDossierByFamilySlug,
} from "../../src/catalogAcquisition/benchmark/goldenLoaderNode.js";
import {
  scoreVehicle,
  scoreAndRankVehicles,
} from "../../src/scoring/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const DOCS_DIR = path.join(ROOT, "docs", "scoring");

/** Two catalog vehicles without golden dossiers (representative public specs). */
const CATALOG_FIXTURES = [
  {
    id: "mg-zs-ev",
    displayName: "MG ZS EV",
    familySlug: "mg-zs-ev",
    fields: {
      brand: "MG",
      model: "ZS EV",
      startingPrice: 1899000,
      claimedRangeKm: 461,
      batteryCapacityKwh: 50.3,
      acChargingKw: 7.4,
      dcChargingKw: 76,
      dcChargingTimeMinutes: 45,
      powerPs: 176,
      torqueNm: 280,
      airbags: 6,
      ncapRating: 5,
      adas: true,
      lengthMm: 4323,
      widthMm: 1809,
      heightMm: 1649,
    },
    features: {
      adas: true,
      sunroof: true,
      ventilatedSeats: false,
      camera360: true,
      connectedCar: true,
      v2l: false,
      v2v: false,
    },
    variants: [
      {
        variantName: "Excite",
        priceInr: 1899000,
        batteryKwh: 50.3,
        rangeKm: 461,
        dcChargingKw: 76,
        acChargingKw: 7.4,
        features: { adas: true, camera360: true },
      },
      {
        variantName: "Exclusive",
        priceInr: 2249000,
        batteryKwh: 50.3,
        rangeKm: 461,
        dcChargingKw: 76,
        acChargingKw: 7.4,
        features: { adas: true, camera360: true, sunroof: true },
      },
    ],
  },
  {
    id: "citroen-ec3",
    displayName: "Citroen eC3",
    familySlug: "citroen-ec3",
    fields: {
      brand: "Citroen",
      model: "eC3",
      startingPrice: 1190000,
      claimedRangeKm: 320,
      batteryCapacityKwh: 29.2,
      acChargingKw: 3.3,
      dcChargingKw: 30,
      dcChargingTimeMinutes: 57,
      powerPs: 57,
      torqueNm: 143,
      airbags: 2,
      ncapRating: null,
      adas: false,
      lengthMm: 3981,
      widthMm: 1733,
      heightMm: 1586,
    },
    features: {
      adas: false,
      sunroof: false,
      ventilatedSeats: false,
      camera360: false,
      connectedCar: true,
      v2l: false,
      v2v: false,
    },
    variants: [
      {
        variantName: "Live",
        priceInr: 1190000,
        batteryKwh: 29.2,
        rangeKm: 320,
        dcChargingKw: 30,
        acChargingKw: 3.3,
        features: { connectedCar: true },
      },
      {
        variantName: "Feel",
        priceInr: 1290000,
        batteryKwh: 29.2,
        rangeKm: 320,
        dcChargingKw: 30,
        acChargingKw: 3.3,
        features: { connectedCar: true },
      },
    ],
  },
];

const VALIDATION_SET = [
  "tata-nexon-ev",
  "tata-punch-ev",
  "tata-curvv-ev",
  "mahindra-be-6",
  "mahindra-xev-9e",
  "mg-windsor-ev",
  "hyundai-creta-electric",
  "byd-atto-3",
  "mg-zs-ev",
  "citroen-ec3",
];

function loadValidationVehicles() {
  const vehicles = [];

  for (const slug of VALIDATION_SET) {
    if (slug === "mg-zs-ev" || slug === "citroen-ec3") {
      const fixture = CATALOG_FIXTURES.find((f) => f.familySlug === slug);
      if (fixture) vehicles.push(fixture);
      continue;
    }

    const dossier = findGoldenDossierByFamilySlug(slug);
    if (dossier) {
      vehicles.push(dossier);
    }
  }

  return vehicles;
}

function scoreKey(scored) {
  return JSON.stringify({
    overall: scored.overall,
    breakdown: Object.fromEntries(
      Object.entries(scored.breakdown || {}).map(([k, v]) => [k, v?.score ?? null])
    ),
    recommended: scored.variants?.recommended?.variantName ?? null,
  });
}

function runValidation() {
  const vehicles = loadValidationVehicles();
  const results = [];
  let missingOverall = 0;
  let missingVariantRec = 0;
  let missingBreakdown = 0;

  const scoredEntries = vehicles.map((vehicle) => {
    const scored = scoreVehicle(vehicle);
    return {
      vehicle: {
        id: vehicle.id || vehicle.familySlug,
        displayName: vehicle.displayName || vehicle.fields?.model,
        familySlug: vehicle.familySlug || vehicle.fields?.familySlug,
      },
      scored,
    };
  });

  for (const entry of scoredEntries) {
    const { vehicle, scored } = entry;
    const breakdownCount = Object.values(scored.breakdown || {}).filter(
      (r) => r?.score != null
    ).length;

    if (scored.overall?.score == null) missingOverall += 1;
    if (!scored.variants?.recommended) missingVariantRec += 1;
    if (breakdownCount < 3) missingBreakdown += 1;

    results.push({
      vehicle: vehicle.displayName,
      familySlug: vehicle.familySlug,
      overallScore: scored.overall?.score ?? null,
      grade: scored.overall?.grade ?? null,
      breakdownDimensions: breakdownCount,
      breakdown: Object.fromEntries(
        Object.entries(scored.breakdown || {}).map(([k, v]) => [k, v?.score ?? null])
      ),
      recommendedVariant: scored.variants?.recommended?.variantName ?? null,
      bestValueVariant: scored.variants?.bestValue?.variantName ?? null,
      longestRangeVariant: scored.variants?.longestRange?.variantName ?? null,
      fastestChargingVariant: scored.variants?.fastestCharging?.variantName ?? null,
      strengths: (scored.explanation?.strengths || []).map((s) => s.label),
      weaknesses: (scored.explanation?.weaknesses || []).map((w) => w.label),
      hasData: scored.hasData,
    });
  }

  const run1 = scoredEntries.map((e) => scoreKey(e.scored));
  const run2 = scoredEntries.map((e) => scoreKey(scoreVehicle(vehicles.find(
    (v) => (v.familySlug || v.id) === e.vehicle.familySlug
  ))));
  const rankingStable = JSON.stringify(run1) === JSON.stringify(run2);

  const { categoryRankings } = scoreAndRankVehicles(vehicles);
  const categorySummary = Object.fromEntries(
    Object.entries(categoryRankings).map(([cat, rows]) => [
      cat,
      rows.slice(0, 3).map((r) => ({
        rank: r.rank,
        vehicle: r.vehicle.displayName || r.vehicle.fields?.model,
        score: r.score,
      })),
    ])
  );

  const goldenCount = loadAllGoldenDossiers().length;

  const aggregate = {
    vehiclesTested: results.length,
    goldenDossiersAvailable: goldenCount,
    allHaveOverallScore: missingOverall === 0,
    allHaveRecommendedVariant: missingVariantRec === 0,
    allHaveBreakdown: missingBreakdown === 0,
    rankingStability: rankingStable,
    averageOverallScore:
      results.filter((r) => r.overallScore != null).length > 0
        ? Math.round(
            results
              .filter((r) => r.overallScore != null)
              .reduce((a, b) => a + b.overallScore, 0) /
              results.filter((r) => r.overallScore != null).length
          )
        : null,
    scoreSpread: {
      min: Math.min(...results.map((r) => r.overallScore ?? 100)),
      max: Math.max(...results.map((r) => r.overallScore ?? 0)),
    },
  };

  const ready =
    aggregate.vehiclesTested >= 10 &&
    aggregate.allHaveOverallScore &&
    aggregate.allHaveRecommendedVariant &&
    aggregate.rankingStability &&
    missingBreakdown === 0;

  const recommendation = ready
    ? "READY FOR SEMI-AUTONOMOUS EVSAVARI"
    : "NEEDS ANOTHER ITERATION";

  const payload = {
    generatedAt: new Date().toISOString(),
    engineVersion: 1,
    methodology:
      "Deterministic score engine v1 on golden dossiers (8) + catalog fixtures (2)",
    validationSet: VALIDATION_SET,
    aggregate,
    recommendation,
    categoryRankings: categorySummary,
    results,
  };

  fs.mkdirSync(DOCS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(DOCS_DIR, "score-engine-v1-validation.json"),
    JSON.stringify(payload, null, 2)
  );

  const md = `# EVSavari Score Engine v1 — Validation

Generated: ${payload.generatedAt}

## Summary

| Metric | Result |
|--------|--------|
| Vehicles tested | ${aggregate.vehiclesTested} |
| All have overall score | ${aggregate.allHaveOverallScore ? "Yes" : "No"} |
| All have recommended variant | ${aggregate.allHaveRecommendedVariant ? "Yes" : "No"} |
| Ranking stability (2 runs) | ${aggregate.rankingStability ? "Stable" : "Unstable"} |
| Average overall score | ${aggregate.averageOverallScore ?? "N/A"} |
| Score spread | ${aggregate.scoreSpread.min}–${aggregate.scoreSpread.max} |

## Recommendation

**${recommendation}**

## Category rankings (top 3)

${Object.entries(categorySummary)
  .map(
    ([cat, rows]) =>
      `### ${cat}\n${rows.map((r) => `${r.rank}. ${r.vehicle} (${r.score}/100)`).join("\n") || "_No data_"}`
  )
  .join("\n\n")}

## Per-vehicle results

${results
  .map(
    (r) => `### ${r.vehicle}

- **Overall:** ${r.overallScore}/100 (${r.grade})
- **Recommended variant:** ${r.recommendedVariant ?? "—"}
- **Best value:** ${r.bestValueVariant ?? "—"}
- **Longest range:** ${r.longestRangeVariant ?? "—"}
- **Fastest charging:** ${r.fastestChargingVariant ?? "—"}
- **Strengths:** ${r.strengths.join(", ") || "—"}
- **Weaknesses:** ${r.weaknesses.join(", ") || "—"}
- **Breakdown:** range ${r.breakdown.range ?? "—"}, charging ${r.breakdown.charging ?? "—"}, performance ${r.breakdown.performance ?? "—"}, feature ${r.breakdown.feature ?? "—"}, safety ${r.breakdown.safety ?? "—"}, value ${r.breakdown.value ?? "—"}, family ${r.breakdown.family ?? "—"}, city ${r.breakdown.city ?? "—"}, highway ${r.breakdown.highway ?? "—"}
`
  )
  .join("\n")}

## Methodology

- No LLM — all scores from normalized catalog/golden signals
- Golden dossiers: \`docs/catalog/golden-dataset/\` (${goldenCount} available)
- Fixtures for MG ZS EV and Citroen eC3 (no golden dossier yet)

See [\`score-engine-v1-validation.json\`](./score-engine-v1-validation.json) for machine-readable output.
`;

  fs.writeFileSync(path.join(DOCS_DIR, "score-engine-v1-validation.md"), md);

  console.log(`Validation complete: ${results.length} vehicles`);
  console.log(`Recommendation: ${recommendation}`);
  console.log(`Wrote ${DOCS_DIR}/score-engine-v1-validation.{md,json}`);

  if (!ready) process.exit(1);
}

runValidation();
