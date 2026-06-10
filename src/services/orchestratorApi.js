/**
 * Orchestrator client API — human-governed agent coordination.
 * Default runners use golden-dossier simulation (no autonomous publish).
 */

import { AGENT_IDS } from "../agents/orchestrator/agentRegistry.js";
import {
  runAgent,
  approveExecution,
  rejectExecution,
  executeApproved,
  setAgentRunners,
  setAgentExecutors,
  listExecutionLogs,
  getExecutionLog,
  computeAgentMetrics,
  buildAgentDashboardRows,
  auditHumanGovernance,
} from "../agents/orchestrator/index.js";
import {
  runScoreEngineWithDossier,
  runVehicleCreationWithGolden,
  runChangeDetectionWithGolden,
  simulatedExecutor,
} from "../agents/orchestrator/orchestratorSimulatedCore.js";
import { fetchGoldenDossier } from "../catalogAcquisition/benchmark/goldenLoader.js";

let initialized = false;

async function loadGoldenBrowser(familySlug) {
  try {
    return await fetchGoldenDossier(familySlug);
  } catch {
    return null;
  }
}

function ensureRunners() {
  if (initialized) return;
  initialized = true;

  setAgentRunners({
    [AGENT_IDS.SCORE_ENGINE]: async (input) => {
      const familySlug = input.familySlug || "tata-nexon-ev";
      const dossier = input.dossier || (await loadGoldenBrowser(familySlug));
      return runScoreEngineWithDossier(dossier);
    },

    [AGENT_IDS.VEHICLE_CREATION]: async (input) => {
      const familySlug = input.familySlug || "tata-nexon-ev";
      const golden = input.dossier || (await loadGoldenBrowser(familySlug));
      if (!golden) {
        return { ok: false, errors: [`No golden dossier for ${familySlug}`] };
      }
      return runVehicleCreationWithGolden(golden, input);
    },

    [AGENT_IDS.CHANGE_DETECTION]: async (input) => {
      const familySlug = input.familySlug || "tata-nexon-ev";
      const golden = input.dossier || (await loadGoldenBrowser(familySlug));
      if (!golden) {
        return { ok: false, errors: [`No golden dossier for ${familySlug}`] };
      }
      return runChangeDetectionWithGolden(golden, input);
    },
  });

  setAgentExecutors({
    [AGENT_IDS.VEHICLE_CREATION]: simulatedExecutor,
    [AGENT_IDS.CHANGE_DETECTION]: simulatedExecutor,
    [AGENT_IDS.SCORE_ENGINE]: simulatedExecutor,
  });
}

export async function apiRunOrchestratorAgent(agentId, input = {}) {
  ensureRunners();
  return runAgent(agentId, input);
}

export function apiApproveOrchestratorExecution(executionId, options = {}) {
  ensureRunners();
  return approveExecution(executionId, options);
}

export function apiRejectOrchestratorExecution(executionId, options = {}) {
  ensureRunners();
  return rejectExecution(executionId, options);
}

export async function apiExecuteOrchestratorApproved(executionId, options = {}) {
  ensureRunners();
  return executeApproved(executionId, options);
}

export function apiListOrchestratorExecutions(filters = {}) {
  return listExecutionLogs(filters);
}

export function apiGetOrchestratorExecution(id) {
  return getExecutionLog(id);
}

export function apiGetOrchestratorMetrics() {
  return computeAgentMetrics();
}

export function apiGetOrchestratorDashboard() {
  ensureRunners();
  return {
    agents: buildAgentDashboardRows(),
    metrics: computeAgentMetrics(),
    governance: auditHumanGovernance(),
    recentExecutions: listExecutionLogs({ limit: 25 }),
  };
}
