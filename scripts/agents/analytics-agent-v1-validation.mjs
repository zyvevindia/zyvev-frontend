/**
 * Analytics Agent v1 validation — simulated BI scenarios.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadAllGoldenDossiers } from "../../src/catalogAcquisition/benchmark/goldenLoaderNode.js";
import {
  runAnalyticsReport,
  buildAnalyticsScoreRecords,
  resetInsightCounter,
} from "../../src/agents/analytics/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const DOCS_DIR = path.join(ROOT, "docs", "agents");

function cleanVehicle(slug, displayName) {
  return {
    familySlug: slug,
    displayName,
    fields: { familySlug: slug, model: displayName },
    variants: [
      {
        variantName: "Base",
        priceInr: 1500000,
        batteryKwh: 40,
        rangeKm: 400,
      },
    ],
  };
}

function baseSnapshot(vehicles) {
  return {
    registry: [],
    seoJobs: [],
    vehicleCreationJobs: [],
    changeDetectionJobs: [],
    orchestratorExecutions: [],
    monitoringScans: [],
    auditRuns: [],
    vehicles,
    scoreRecords: buildAnalyticsScoreRecords(vehicles),
    scoreSnapshots: { categoryRankShifts: [] },
    previousSnapshot: { vehicleCount: vehicles.length, scoreRecords: [] },
    freshness: {
      lastCatalogUpdate: new Date().toISOString(),
      lastAcquisitionAt: new Date().toISOString(),
      lastScoreGenerationAt: new Date().toISOString(),
      lastSeoGenerationAt: new Date().toISOString(),
    },
    now: new Date().toISOString(),
  };
}

function runScenario(name, snapshot, expectedCodes, forbiddenCodes = []) {
  resetInsightCounter();
  const result = runAnalyticsReport(snapshot);
  const detected = (result.report?.insights || []).map((i) => i.code);
  const expectedHit = expectedCodes.every((c) => detected.includes(c));
  const noFalsePositives = forbiddenCodes.every((c) => !detected.includes(c));
  const autonomous = result.report?.autonomousActionsTaken === 0;

  return {
    name,
    ok: result.ok && expectedHit && noFalsePositives && autonomous,
    expectedCodes,
    detectedCodes: [...new Set(detected)],
    expectedHit,
    noFalsePositives,
    autonomousActionsTaken: result.report?.autonomousActionsTaken ?? 0,
    recommendation: result.report?.recommendation?.code,
    insightCount: result.report?.insights?.length ?? 0,
  };
}

function main() {
  const golden = loadAllGoldenDossiers().map((g) => g.dossier);
  const base = baseSnapshot(golden);
  const scenarios = [];

  scenarios.push(
    runScenario(
      "catalog_growth",
      {
        ...base,
        previousSnapshot: { vehicleCount: 3, scoreRecords: [] },
        vehicles: golden,
      },
      ["catalog_growth_detected"],
      []
    )
  );

  const draftJobs = Array.from({ length: 6 }, (_, i) => ({
    id: `seo_draft_${i}`,
    status: "draft",
    seoPage: {
      slug: `draft-page-${i}`,
      title: `Draft Page ${i} Title Here`,
      metaDescription:
        "A sufficiently long meta description for SEO analytics validation testing purposes.",
      contentType: "buying_guide",
    },
  }));

  scenarios.push(
    runScenario(
      "seo_backlog",
      {
        ...baseSnapshot([cleanVehicle("seo-test", "SEO Test EV")]),
        seoJobs: draftJobs,
      },
      ["seo_draft_backlog"],
      []
    )
  );

  scenarios.push(
    runScenario(
      "ranking_shifts",
      {
        ...base,
        scoreSnapshots: {
          categoryRankShifts: [
            {
              category: "value",
              familySlug: "tata-nexon-ev",
              rankDelta: 3,
              previousRank: 5,
              currentRank: 2,
            },
          ],
        },
      },
      ["score_ranking_shift"],
      []
    )
  );

  scenarios.push(
    runScenario(
      "agent_failures",
      {
        ...baseSnapshot([cleanVehicle("agent-test", "Agent Test EV")]),
        orchestratorExecutions: [
          { id: "e1", agentId: "vehicleCreation", status: "failed" },
          { id: "e2", agentId: "vehicleCreation", status: "failed" },
          { id: "e3", agentId: "vehicleCreation", status: "failed" },
          { id: "e4", agentId: "vehicleCreation", status: "completed" },
        ],
      },
      ["agent_failure_trend"],
      []
    )
  );

  const alerts = Array.from({ length: 18 }, (_, i) => ({
    id: `alert_${i}`,
    level: i % 3 === 0 ? "CRITICAL" : "WARNING",
    code: "test_alert",
    message: `Test alert ${i}`,
  }));

  scenarios.push(
    runScenario(
      "alert_spikes",
      {
        ...baseSnapshot([cleanVehicle("mon-test", "Monitoring Test EV")]),
        monitoringScans: [
          { id: "mon_spike", status: "waiting_for_review", alerts },
        ],
      },
      ["monitoring_alert_spike"],
      []
    )
  );

  scenarios.push(
    runScenario(
      "audit_findings",
      {
        ...baseSnapshot([cleanVehicle("audit-test", "Audit Test EV")]),
        auditRuns: [
          {
            id: "audit_1",
            status: "waiting_for_review",
            metrics: {
              findingCount: 12,
              criticalCount: 2,
              trustScore: 65,
            },
            findings: Array.from({ length: 12 }, (_, i) => ({
              id: `f_${i}`,
              severity: i < 2 ? "CRITICAL" : "WARNING",
            })),
          },
        ],
      },
      ["audit_finding_trend"],
      []
    )
  );

  const healthyVehicle = cleanVehicle("healthy-ev", "Healthy EV");
  scenarios.push(
    runScenario(
      "healthy_baseline",
      {
        ...baseSnapshot([healthyVehicle]),
        seoJobs: [],
        orchestratorExecutions: [],
        monitoringScans: [],
        auditRuns: [],
        previousSnapshot: { vehicleCount: 1, scoreRecords: [] },
      },
      [],
      [
        "catalog_growth_detected",
        "seo_draft_backlog",
        "score_ranking_shift",
        "agent_failure_trend",
        "monitoring_alert_spike",
        "audit_critical_trend",
      ]
    )
  );

  const passed = scenarios.filter((s) => s.ok).length;
  const detectionTests = scenarios.filter((s) => s.name !== "healthy_baseline");
  const detectionAccuracy =
    detectionTests.length > 0
      ? Math.round(
          (detectionTests.filter((s) => s.expectedHit).length /
            detectionTests.length) *
            1000
        ) / 10
      : 100;

  const healthyScenario = scenarios.find((s) => s.name === "healthy_baseline");
  const forbiddenHits = healthyScenario
    ? healthyScenario.detectedCodes.filter((c) =>
        [
          "catalog_growth_detected",
          "seo_draft_backlog",
          "score_ranking_shift",
          "agent_failure_trend",
          "monitoring_alert_spike",
          "audit_critical_trend",
        ].includes(c)
      ).length
    : 0;
  const falsePositiveRate =
    healthyScenario && healthyScenario.insightCount > 0
      ? Math.round((forbiddenHits / healthyScenario.insightCount) * 1000) / 10
      : 0;

  const allAutonomousZero = scenarios.every((s) => s.autonomousActionsTaken === 0);

  const ready =
    passed === scenarios.length &&
    detectionAccuracy >= 95 &&
    falsePositiveRate < 5 &&
    allAutonomousZero;

  const recommendation = ready
    ? "PLATFORM FOUNDATION COMPLETE"
    : "NEEDS ITERATION";

  const payload = {
    generatedAt: new Date().toISOString(),
    agentVersion: 1,
    methodology: "Simulated platform snapshots — insight detection only",
    aggregate: {
      scenariosTotal: scenarios.length,
      scenariosPassed: passed,
      detectionAccuracyPct: detectionAccuracy,
      falsePositiveRatePct: falsePositiveRate,
      autonomousActions: allAutonomousZero ? 0 : "VIOLATION",
      humanApprovalRequired: true,
    },
    recommendation,
    scenarios,
  };

  fs.mkdirSync(DOCS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(DOCS_DIR, "analytics-agent-v1-validation.json"),
    JSON.stringify(payload, null, 2)
  );

  const md = `# Analytics Agent v1 — Validation

Generated: ${payload.generatedAt}

## Summary

| Metric | Result |
|--------|--------|
| Scenarios passed | ${passed}/${scenarios.length} |
| Detection accuracy | ${detectionAccuracy}% |
| False positive rate (healthy baseline) | ${falsePositiveRate}% |
| Autonomous actions | ${allAutonomousZero ? "0" : "VIOLATION"} |

## Recommendation

**${recommendation}**

## Scenarios

${scenarios
  .map(
    (s) =>
      `### ${s.name}\n- **Pass:** ${s.ok ? "Yes" : "No"}\n- **Expected:** ${s.expectedCodes.join(", ") || "none"}\n- **Detected:** ${s.detectedCodes.join(", ")}\n- **Recommendation:** ${s.recommendation}`
  )
  .join("\n\n")}

See [\`analytics-agent-v1-validation.json\`](./analytics-agent-v1-validation.json).
`;

  fs.writeFileSync(
    path.join(DOCS_DIR, "analytics-agent-v1-validation.md"),
    md
  );

  console.log(`Validation: ${passed}/${scenarios.length} scenarios passed`);
  console.log(`Detection accuracy: ${detectionAccuracy}%`);
  console.log(`False positive rate: ${falsePositiveRate}%`);
  console.log(`Recommendation: ${recommendation}`);

  if (!ready) process.exit(1);
}

main();
