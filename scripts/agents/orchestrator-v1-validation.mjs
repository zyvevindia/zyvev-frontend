/**
 * Orchestrator v1 validation — simulates VC, CD, and Score Engine flows.
 * Generates docs/agents/orchestrator-v1-validation.md and .json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  setLogBackend,
  clearLogBackend,
  setAgentRunners,
  setAgentExecutors,
  clearAgentRunners,
  clearAgentExecutors,
  runAgent,
  approveExecution,
  rejectExecution,
  executeApproved,
  auditHumanGovernance,
  computeAgentMetrics,
  ORCHESTRATOR_STATUS,
  AGENT_IDS,
} from "../../src/agents/orchestrator/index.js";
import {
  createSimulatedRunners,
  createSimulatedExecutors,
} from "../../src/agents/orchestrator/orchestratorSimulatedRunners.js";
import { findGoldenDossierByFamilySlug } from "../../src/catalogAcquisition/benchmark/goldenLoaderNode.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const DOCS_DIR = path.join(ROOT, "docs", "agents");

const SIM_SLUGS = [
  "tata-nexon-ev",
  "tata-punch-ev",
  "mahindra-be-6",
];

function setup() {
  setLogBackend({ logs: [] });
  setAgentRunners(createSimulatedRunners());
  setAgentExecutors(createSimulatedExecutors());
}

function teardown() {
  clearLogBackend();
  clearAgentRunners();
  clearAgentExecutors();
}

async function runScenario(name, fn) {
  const started = Date.now();
  try {
    const result = await fn();
    return {
      name,
      ok: result.ok !== false,
      durationMs: Date.now() - started,
      ...result,
    };
  } catch (err) {
    return {
      name,
      ok: false,
      durationMs: Date.now() - started,
      error: err?.message || String(err),
    };
  }
}

async function main() {
  setup();
  const scenarios = [];
  const executionIds = [];

  // 1. Score generation (no approval required)
  for (const slug of SIM_SLUGS) {
    scenarios.push(
      await runScenario(`score_engine:${slug}`, async () => {
        const run = await runAgent(AGENT_IDS.SCORE_ENGINE, { familySlug: slug });
        executionIds.push(run.executionId);
        return {
          ok: run.ok,
          executionId: run.executionId,
          status: run.status,
          approvalRequired: run.approvalRequired,
          score: run.data?.scored?.overall?.score,
        };
      })
    );
  }

  // 2. Vehicle creation → waiting_for_review → approve → execute
  scenarios.push(
    await runScenario("vehicle_creation:workflow", async () => {
      const run = await runAgent(AGENT_IDS.VEHICLE_CREATION, {
        familySlug: "tata-nexon-ev",
      });
      executionIds.push(run.executionId);

      const blockedExecute = await executeApproved(run.executionId, {
        executedBy: "test",
      });

      const approved = approveExecution(run.executionId, {
        approvedBy: "human-reviewer",
      });
      const executed = await executeApproved(run.executionId, {
        executedBy: "human-reviewer",
      });

      return {
        ok: run.ok && approved.ok && executed.ok && !blockedExecute.ok,
        initialStatus: run.status,
        blockedWithoutApproval: !blockedExecute.ok,
        approved: approved.ok,
        executed: executed.ok,
        recommendation: run.recommendation?.code,
      };
    })
  );

  // 3. Change detection with mutation
  scenarios.push(
    await runScenario("change_detection:price_mutation", async () => {
      const golden = findGoldenDossierByFamilySlug("tata-punch-ev");
      const run = await runAgent(AGENT_IDS.CHANGE_DETECTION, {
        familySlug: "tata-punch-ev",
        dossier: golden,
        mutation: { startingPrice: (golden?.fields?.startingPrice || 0) + 75000 },
      });
      executionIds.push(run.executionId);

      const approved = approveExecution(run.executionId, {
        approvedBy: "human-reviewer",
      });
      const executed = await executeApproved(run.executionId, {
        executedBy: "human-reviewer",
      });

      return {
        ok: run.ok && run.status === ORCHESTRATOR_STATUS.WAITING_FOR_REVIEW,
        changeCount: run.data?.job?.changeCount,
        approved: approved.ok,
        executed: executed.ok,
      };
    })
  );

  // 4. Change detection no-change
  scenarios.push(
    await runScenario("change_detection:no_change", async () => {
      const run = await runAgent(AGENT_IDS.CHANGE_DETECTION, {
        familySlug: "byd-atto-3",
        simulateNoChange: true,
      });
      executionIds.push(run.executionId);
      return {
        ok: run.ok && run.status === ORCHESTRATOR_STATUS.COMPLETED,
        status: run.status,
        recommendation: run.recommendation?.code,
        completedWithoutReview:
          run.status === ORCHESTRATOR_STATUS.COMPLETED &&
          run.recommendation?.code === "NO_CHANGE",
      };
    })
  );

  // 5. Rejection flow
  scenarios.push(
    await runScenario("rejection:human_reject", async () => {
      const run = await runAgent(AGENT_IDS.VEHICLE_CREATION, {
        familySlug: "tata-curvv-ev",
      });
      executionIds.push(run.executionId);
      const rejected = rejectExecution(run.executionId, {
        rejectedBy: "human-reviewer",
        reason: "Validation test rejection",
      });
      const blockedExecute = await executeApproved(run.executionId, {
        executedBy: "test",
      });
      return {
        ok: rejected.ok && !blockedExecute.ok,
        status: rejected.data?.status,
      };
    })
  );

  // 6. Failure recovery — invalid golden
  scenarios.push(
    await runScenario("failure_recovery:missing_golden", async () => {
      const run = await runAgent(AGENT_IDS.SCORE_ENGINE, {
        familySlug: "nonexistent-ev-slug-xyz",
      });
      executionIds.push(run.executionId);
      const retry = await runAgent(AGENT_IDS.SCORE_ENGINE, {
        familySlug: "tata-nexon-ev",
      });
      executionIds.push(retry.executionId);
      return {
        ok: !run.ok && retry.ok,
        failedStatus: run.status,
        recovered: retry.ok,
      };
    })
  );

  // 7. Ranking stability — same input twice
  scenarios.push(
    await runScenario("stability:score_repeat", async () => {
      const a = await runAgent(AGENT_IDS.SCORE_ENGINE, {
        familySlug: "tata-nexon-ev",
      });
      const b = await runAgent(AGENT_IDS.SCORE_ENGINE, {
        familySlug: "tata-nexon-ev",
      });
      executionIds.push(a.executionId, b.executionId);
      const scoreA = a.data?.scored?.overall?.score;
      const scoreB = b.data?.scored?.overall?.score;
      return {
        ok: a.ok && b.ok && scoreA === scoreB,
        scoreA,
        scoreB,
        stable: scoreA === scoreB,
      };
    })
  );

  const governance = auditHumanGovernance();
  const metrics = computeAgentMetrics();

  const passedScenarios = scenarios.filter((s) => s.ok).length;
  const totalScenarios = scenarios.length;

  const ready =
    passedScenarios === totalScenarios &&
    governance.passed &&
    governance.autonomousViolations === 0 &&
    metrics.humanApprovals >= 2;

  const recommendation = ready
    ? "READY FOR SEO AGENT"
    : "NEEDS ITERATION";

  const payload = {
    generatedAt: new Date().toISOString(),
    orchestratorVersion: 1,
    methodology:
      "Simulated agent runs via golden dossiers — approval workflow enforced",
    aggregate: {
      scenariosTotal: totalScenarios,
      scenariosPassed: passedScenarios,
      scenarioPassRatePct: Math.round((passedScenarios / totalScenarios) * 1000) / 10,
      autonomousViolations: governance.autonomousViolations,
      humanApprovalRatePct: governance.humanApprovalRatePct,
      humanApprovals: metrics.humanApprovals,
      rejectedActions: metrics.rejectedActions,
      successRatePct: metrics.successRatePct,
      failureRatePct: metrics.failureRatePct,
      averageDurationMs: metrics.averageDurationMs,
      executionCount: metrics.totalExecutions,
    },
    governance,
    recommendation,
    scenarios,
  };

  fs.mkdirSync(DOCS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(DOCS_DIR, "orchestrator-v1-validation.json"),
    JSON.stringify(payload, null, 2)
  );

  const md = `# Orchestrator v1 — Validation

Generated: ${payload.generatedAt}

## Summary

| Metric | Result |
|--------|--------|
| Scenarios passed | ${passedScenarios}/${totalScenarios} |
| Autonomous violations | ${governance.autonomousViolations} |
| Human approval rate | ${governance.humanApprovalRatePct}% |
| Human approvals | ${metrics.humanApprovals} |
| Rejected actions | ${metrics.rejectedActions} |
| Avg execution time | ${metrics.averageDurationMs ?? "N/A"} ms |

## Recommendation

**${recommendation}**

## Governance audit

- No execution without approval when approval required: **${governance.passed ? "PASS" : "FAIL"}**
- Execution model: Agent → Recommendation → Human Review → Approve → Execute

## Scenarios

${scenarios
  .map(
    (s) =>
      `### ${s.name}\n- **Pass:** ${s.ok ? "Yes" : "No"}\n- **Duration:** ${s.durationMs} ms${s.error ? `\n- **Error:** ${s.error}` : ""}`
  )
  .join("\n\n")}

See [\`orchestrator-v1-validation.json\`](./orchestrator-v1-validation.json).
`;

  fs.writeFileSync(path.join(DOCS_DIR, "orchestrator-v1-validation.md"), md);

  console.log(`Validation: ${passedScenarios}/${totalScenarios} scenarios passed`);
  console.log(`Recommendation: ${recommendation}`);
  console.log(`Wrote ${DOCS_DIR}/orchestrator-v1-validation.{md,json}`);

  teardown();

  if (!ready) process.exit(1);
}

main();
