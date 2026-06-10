/**
 * Monitoring Agent v1 validation — simulated health scenarios.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadAllGoldenDossiers } from "../../src/catalogAcquisition/benchmark/goldenLoaderNode.js";
import {
  runMonitoringScan,
  buildScoreSnapshot,
  resetAlertCounter,
} from "../../src/agents/monitoring/index.js";
import { scoreVehicle } from "../../src/scoring/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const DOCS_DIR = path.join(ROOT, "docs", "agents");

function loadRegistrySample() {
  const raw = fs.readFileSync(
    path.join(ROOT, "public/catalog/source-registry.json"),
    "utf8"
  );
  return JSON.parse(raw);
}

function baseSnapshot(registry, vehicles) {
  const scoreRows = buildScoreSnapshot(vehicles);
  return {
    registry,
    seoJobs: [],
    vehicleCreationJobs: [],
    changeDetectionJobs: [],
    orchestratorExecutions: [],
    contentManifest: { entries: [] },
    oemProbeResults: [],
    scoreSnapshots: {
      current: scoreRows,
      previous: scoreRows.map((r) => ({
        ...r,
        overallScore: r.overallScore,
      })),
      lastGeneratedAt: new Date().toISOString(),
      categoryRankShifts: [],
    },
    freshness: {
      lastCatalogUpdate: new Date().toISOString(),
      lastAcquisitionAt: new Date().toISOString(),
      lastScoreGenerationAt: new Date().toISOString(),
      lastSeoGenerationAt: new Date().toISOString(),
    },
    now: new Date().toISOString(),
  };
}

function hasAlertCode(scan, code) {
  return (scan.alerts || []).some((a) => a.code === code);
}

function runScenario(name, snapshot, expectedCodes, forbiddenCodes = []) {
  resetAlertCounter();
  const result = runMonitoringScan(snapshot);
  const detected = (result.scan?.alerts || []).map((a) => a.code);
  const expectedHit = expectedCodes.every((c) => detected.includes(c));
  const noFalsePositives = forbiddenCodes.every((c) => !detected.includes(c));
  const autonomous = result.scan?.autonomousActionsTaken === 0;

  return {
    name,
    ok: result.ok && expectedHit && noFalsePositives && autonomous,
    expectedCodes,
    detectedCodes: [...new Set(detected)],
    expectedHit,
    noFalsePositives,
    autonomousActionsTaken: result.scan?.autonomousActionsTaken ?? 0,
    recommendation: result.scan?.recommendation?.code,
    alertCount: result.scan?.alerts?.length ?? 0,
  };
}

function main() {
  const golden = loadAllGoldenDossiers().map((g) => g.dossier);
  const registry = loadRegistrySample();
  const base = baseSnapshot(registry, golden);

  const scenarios = [];

  scenarios.push(
    runScenario(
      "broken_oem_url",
      {
        ...base,
        oemProbeResults: [
          {
            familySlug: "tata-nexon-ev",
            url: "https://example.com/broken",
            status: 404,
            notFound: true,
          },
        ],
      },
      ["oem_unreachable"],
      []
    )
  );

  scenarios.push(
    runScenario(
      "missing_brochure",
      {
        ...base,
        registry: registry.map((r) =>
          r.id === "tata-nexon-ev"
            ? { ...r, brochureUrl: null, flags: { ...r.flags, missingBrochure: true } }
            : r
        ),
      },
      ["registry_missing_brochure"],
      ["oem_unreachable"]
    )
  );

  const staleDate = new Date();
  staleDate.setDate(staleDate.getDate() - 30);

  scenarios.push(
    runScenario(
      "stale_score",
      {
        ...base,
        freshness: {
          ...base.freshness,
          lastScoreGenerationAt: staleDate.toISOString(),
        },
      },
      ["score_generation_stale"],
      []
    )
  );

  scenarios.push(
    runScenario(
      "duplicate_seo_slug",
      {
        ...base,
        seoJobs: [
          {
            id: "seo_1",
            status: "review_required",
            seoPage: {
              slug: "duplicate-slug-test",
              title: "Test A",
              metaDescription: "A long enough meta description for SEO validation testing purposes here.",
            },
          },
          {
            id: "seo_2",
            status: "draft",
            seoPage: {
              slug: "duplicate-slug-test",
              title: "Test B",
              metaDescription: "Another long enough meta description for duplicate slug detection validation.",
            },
          },
        ],
      },
      ["seo_duplicate_slug"],
      []
    )
  );

  scenarios.push(
    runScenario(
      "agent_failure",
      {
        ...base,
        orchestratorExecutions: [
          { id: "e1", agentId: "vehicleCreation", status: "failed", error: "Pipeline failed" },
          { id: "e2", agentId: "vehicleCreation", status: "failed", error: "Pipeline failed" },
          { id: "e3", agentId: "vehicleCreation", status: "completed" },
          { id: "e4", agentId: "vehicleCreation", status: "failed", error: "Pipeline failed" },
        ],
      },
      ["agent_recent_failure"],
      []
    )
  );

  scenarios.push(
    runScenario(
      "score_drift",
      {
        ...base,
        scoreSnapshots: {
          current: [
            { familySlug: "tata-nexon-ev", overallScore: 80, displayName: "Nexon" },
          ],
          previous: [{ familySlug: "tata-nexon-ev", overallScore: 50 }],
          categoryRankShifts: [],
        },
      },
      ["score_large_drift"],
      []
    )
  );

  scenarios.push(
    runScenario(
      "healthy_baseline",
      {
        ...base,
        registry: [
          {
            id: "test-ev",
            familySlug: "test-ev",
            brand: "Test",
            model: "EV",
            officialUrl: "https://example.com/ev",
            brochureUrl: "https://example.com/brochure.pdf",
            status: "verified",
            lastVerifiedAt: new Date().toISOString(),
            flags: {
              missingBrochure: false,
              unreachableUrl: false,
              redirectingUrl: false,
            },
          },
        ],
        seoJobs: [],
        oemProbeResults: [],
      },
      [],
      ["oem_unreachable", "seo_duplicate_slug", "score_large_drift"]
    )
  );

  const passed = scenarios.filter((s) => s.ok).length;
  const detectionTests = scenarios.filter((s) => s.name !== "healthy_baseline");
  const detectionAccuracy =
    detectionTests.length > 0
      ? Math.round((detectionTests.filter((s) => s.expectedHit).length / detectionTests.length) * 1000) / 10
      : 100;

  const falsePositives = scenarios.filter(
    (s) => s.name === "healthy_baseline" && !s.noFalsePositives
  ).length;

  const allAutonomousZero = scenarios.every((s) => s.autonomousActionsTaken === 0);

  const ready =
    passed === scenarios.length &&
    detectionAccuracy >= 95 &&
    falsePositives === 0 &&
    allAutonomousZero;

  const recommendation = ready
    ? "READY FOR AUDIT AGENT"
    : "NEEDS ITERATION";

  const payload = {
    generatedAt: new Date().toISOString(),
    agentVersion: 1,
    methodology: "Simulated platform snapshots — alert detection only",
    aggregate: {
      scenariosTotal: scenarios.length,
      scenariosPassed: passed,
      detectionAccuracyPct: detectionAccuracy,
      falsePositiveScenarios: falsePositives,
      autonomousActions: allAutonomousZero ? 0 : "VIOLATION",
      humanApprovalRequired: true,
    },
    recommendation,
    scenarios,
  };

  fs.mkdirSync(DOCS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(DOCS_DIR, "monitoring-agent-v1-validation.json"),
    JSON.stringify(payload, null, 2)
  );

  const md = `# Monitoring Agent v1 — Validation

Generated: ${payload.generatedAt}

## Summary

| Metric | Result |
|--------|--------|
| Scenarios passed | ${passed}/${scenarios.length} |
| Detection accuracy | ${detectionAccuracy}% |
| False positives (healthy baseline) | ${falsePositives} |
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

See [\`monitoring-agent-v1-validation.json\`](./monitoring-agent-v1-validation.json).
`;

  fs.writeFileSync(
    path.join(DOCS_DIR, "monitoring-agent-v1-validation.md"),
    md
  );

  console.log(`Validation: ${passed}/${scenarios.length} scenarios passed`);
  console.log(`Detection accuracy: ${detectionAccuracy}%`);
  console.log(`Recommendation: ${recommendation}`);

  if (!ready) process.exit(1);
}

main();
