import { listExecutionLogs } from "./agentExecutionLog.js";
import { ORCHESTRATOR_STATUS } from "./agentStatus.js";
import { listAgents } from "./agentRegistry.js";

/**
 * Compute orchestrator metrics from execution logs.
 * @param {object} options
 * @returns {object}
 */
export function computeAgentMetrics(options = {}) {
  const logs = listExecutionLogs({ limit: options.limit ?? MAX_SAMPLE });
  const agents = listAgents({ includePlaceholders: options.includePlaceholders });

  const total = logs.length;
  const completed = logs.filter(
    (l) => l.status === ORCHESTRATOR_STATUS.COMPLETED
  ).length;
  const failed = logs.filter(
    (l) => l.status === ORCHESTRATOR_STATUS.FAILED
  ).length;
  const waiting = logs.filter(
    (l) => l.status === ORCHESTRATOR_STATUS.WAITING_FOR_REVIEW
  ).length;
  const approved = logs.filter(
    (l) => l.status === ORCHESTRATOR_STATUS.APPROVED
  ).length;
  const rejected = logs.filter(
    (l) => l.status === ORCHESTRATOR_STATUS.REJECTED
  ).length;
  const executed = logs.filter((l) => l.executedAt != null).length;

  const durations = logs
    .map((l) => l.durationMs)
    .filter((d) => d != null && Number.isFinite(d));
  const avgDurationMs = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : null;

  const finished = completed + failed + approved + rejected;
  const successRate =
    finished > 0
      ? Math.round(((completed + approved) / finished) * 1000) / 10
      : null;
  const failureRate =
    finished > 0 ? Math.round((failed / finished) * 1000) / 10 : null;

  const humanApprovals = logs.filter((l) => l.approval?.approvedBy).length;

  const perAgent = {};
  for (const agent of agents) {
    const agentLogs = logs.filter((l) => l.agentId === agent.id);
    const last = agentLogs[0] || null;
    perAgent[agent.id] = {
      agentId: agent.id,
      name: agent.name,
      label: agent.label,
      runCount: agentLogs.length,
      lastRunAt: last?.createdAt ?? null,
      lastStatus: last?.status ?? ORCHESTRATOR_STATUS.IDLE,
      lastRecommendation: last?.recommendation ?? null,
      approvalRequired: agent.approvalRequired,
      placeholder: agent.placeholder,
    };
  }

  return {
    totalExecutions: total,
    completed,
    failed,
    waitingForReview: waiting,
    approved,
    rejected,
    executedActions: executed,
    humanApprovals,
    rejectedActions: rejected,
    successRatePct: successRate,
    failureRatePct: failureRate,
    averageDurationMs: avgDurationMs,
    perAgent,
  };
}

const MAX_SAMPLE = 200;

/**
 * Dashboard row for each registered agent.
 * @returns {object[]}
 */
export function buildAgentDashboardRows() {
  const metrics = computeAgentMetrics();
  const agents = listAgents();

  return agents.map((agent) => {
    const row = metrics.perAgent[agent.id] || {};
    return {
      ...agent,
      lastRun: row.lastRunAt,
      status: row.placeholder
        ? ORCHESTRATOR_STATUS.IDLE
        : row.lastStatus || ORCHESTRATOR_STATUS.IDLE,
      recommendation: row.lastRecommendation,
      runCount: row.runCount ?? 0,
      approvalRequired: agent.approvalRequired,
    };
  });
}
