/**
 * Audit Agent v1 validation — simulated integrity scenarios.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadAllGoldenDossiers } from "../../src/catalogAcquisition/benchmark/goldenLoaderNode.js";
import {
  runAuditScan,
  buildScoreAuditRecords,
  resetFindingCounter,
} from "../../src/agents/audit/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const DOCS_DIR = path.join(ROOT, "docs", "agents");

function baseSnapshot(vehicles) {
  const scoreRecords = buildScoreAuditRecords(vehicles);
  return {
    registry: [],
    seoJobs: [],
    vehicleCreationJobs: [],
    changeDetectionJobs: [],
    orchestratorExecutions: [],
    monitoringScans: [],
    vehicles,
    scoreRecords,
    now: new Date().toISOString(),
  };
}

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

function runScenario(name, snapshot, expectedCodes, forbiddenCodes = []) {
  resetFindingCounter();
  const result = runAuditScan(snapshot);
  const detected = (result.run?.findings || []).map((f) => f.code);
  const expectedHit = expectedCodes.every((c) => detected.includes(c));
  const noFalsePositives = forbiddenCodes.every((c) => !detected.includes(c));
  const autonomous = result.run?.autonomousActionsTaken === 0;

  return {
    name,
    ok: result.ok && expectedHit && noFalsePositives && autonomous,
    expectedCodes,
    detectedCodes: [...new Set(detected)],
    expectedHit,
    noFalsePositives,
    autonomousActionsTaken: result.run?.autonomousActionsTaken ?? 0,
    recommendation: result.run?.recommendation?.code,
    findingCount: result.run?.findings?.length ?? 0,
  };
}

function main() {
  const golden = loadAllGoldenDossiers().map((g) => g.dossier);
  const base = baseSnapshot(golden);

  const scenarios = [];

  const dupVehicle = {
    ...golden[0],
    variants: [
      ...(golden[0].variants || []).slice(0, 2),
      ...(golden[0].variants || []).slice(0, 2),
    ],
  };
  scenarios.push(
    runScenario(
      "duplicate_variant",
      {
        ...base,
        vehicles: [dupVehicle],
        scoreRecords: buildScoreAuditRecords([dupVehicle]),
      },
      ["catalog_duplicate_variant"],
      []
    )
  );

  const noScoreVehicle = cleanVehicle("test-no-score", "Test EV");
  scenarios.push(
    runScenario(
      "missing_score",
      {
        ...base,
        vehicles: [noScoreVehicle],
        scoreRecords: [
          {
            familySlug: "test-no-score",
            displayName: "Test EV",
            overallScore: null,
            grade: null,
            breakdown: {},
          },
        ],
      },
      ["catalog_missing_score"],
      []
    )
  );

  scenarios.push(
    runScenario(
      "broken_seo_metadata",
      {
        ...base,
        seoJobs: [
          {
            id: "seo_bad",
            status: "review_required",
            seoPage: {
              slug: "broken-meta-test",
              title: "x",
              metaDescription: "short",
            },
          },
        ],
      },
      ["seo_missing_metadata"],
      []
    )
  );

  scenarios.push(
    runScenario(
      "missing_approval",
      {
        ...base,
        orchestratorExecutions: [
          {
            id: "exec_no_approval",
            agentId: "vehicleCreation",
            status: "completed",
            requiresApproval: true,
          },
        ],
      },
      ["governance_missing_approval"],
      []
    )
  );

  scenarios.push(
    runScenario(
      "registry_failure",
      {
        ...base,
        registry: [
          {
            id: "broken-ev",
            familySlug: "broken-ev",
            status: "broken",
            flags: { unreachableUrl: true },
            officialUrl: "https://example.com/broken",
          },
        ],
      },
      ["registry_broken_url"],
      []
    )
  );

  scenarios.push(
    runScenario(
      "critical_monitoring_alert",
      {
        ...base,
        monitoringScans: [
          {
            id: "mon_1",
            status: "waiting_for_review",
            alerts: [
              {
                id: "alert_crit",
                level: "CRITICAL",
                code: "oem_unreachable",
                message: "OEM URL returned 404",
              },
            ],
          },
        ],
      },
      ["monitoring_unresolved_critical"],
      []
    )
  );

  const healthyVehicle = cleanVehicle("healthy-ev", "Healthy EV");
  scenarios.push(
    runScenario(
      "healthy_baseline",
      {
        ...baseSnapshot([healthyVehicle]),
        registry: [
          {
            id: "healthy-ev",
            familySlug: "healthy-ev",
            status: "verified",
            officialUrl: "https://example.com/ev",
            brochureUrl: "https://example.com/brochure.pdf",
            lastVerifiedAt: new Date().toISOString(),
            flags: { missingBrochure: false, unreachableUrl: false },
          },
        ],
        seoJobs: [],
        orchestratorExecutions: [],
        monitoringScans: [],
      },
      [],
      [
        "catalog_duplicate_variant",
        "catalog_missing_score",
        "seo_missing_metadata",
        "governance_missing_approval",
        "registry_broken_url",
        "monitoring_unresolved_critical",
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
  const falsePositiveRate =
    healthyScenario && !healthyScenario.noFalsePositives
      ? 100
      : healthyScenario?.findingCount > 0
        ? Math.min(
            100,
            Math.round(
              (healthyScenario.detectedCodes.filter((c) =>
                [
                  "catalog_duplicate_variant",
                  "catalog_missing_score",
                  "seo_missing_metadata",
                  "governance_missing_approval",
                  "registry_broken_url",
                  "monitoring_unresolved_critical",
                ].includes(c)
              ).length /
                Math.max(healthyScenario.findingCount, 1)) *
                1000
            ) / 10
          )
        : 0;

  const allAutonomousZero = scenarios.every((s) => s.autonomousActionsTaken === 0);

  const ready =
    passed === scenarios.length &&
    detectionAccuracy >= 95 &&
    falsePositiveRate < 5 &&
    allAutonomousZero;

  const recommendation = ready
    ? "READY FOR ANALYTICS AGENT"
    : "NEEDS ITERATION";

  const payload = {
    generatedAt: new Date().toISOString(),
    agentVersion: 1,
    methodology: "Simulated platform snapshots — finding detection only",
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
    path.join(DOCS_DIR, "audit-agent-v1-validation.json"),
    JSON.stringify(payload, null, 2)
  );

  const md = `# Audit Agent v1 — Validation

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

See [\`audit-agent-v1-validation.json\`](./audit-agent-v1-validation.json).
`;

  fs.writeFileSync(path.join(DOCS_DIR, "audit-agent-v1-validation.md"), md);

  console.log(`Validation: ${passed}/${scenarios.length} scenarios passed`);
  console.log(`Detection accuracy: ${detectionAccuracy}%`);
  console.log(`False positive rate: ${falsePositiveRate}%`);
  console.log(`Recommendation: ${recommendation}`);

  if (!ready) process.exit(1);
}

main();
