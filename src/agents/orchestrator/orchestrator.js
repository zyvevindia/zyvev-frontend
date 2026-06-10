import { AGENT_IDS, getAgent } from "./agentRegistry.js";
import {
  buildRecommendation,
  requiresHumanApproval,
} from "./agentRecommendation.js";
import {
  createExecutionLog,
  updateExecutionLog,
  getExecutionLog,
  listExecutionLogs,
} from "./agentExecutionLog.js";
import { ORCHESTRATOR_STATUS } from "./agentStatus.js";

/**
 * Agent runners — injected by API layer or validation scripts.
 * Frozen agent modules are never modified; orchestrator wraps them.
 */
let customRunners = null;
let customExecutors = null;

export function setAgentRunners(runners) {
  customRunners = runners;
}

export function clearAgentRunners() {
  customRunners = null;
}

export function setAgentExecutors(executors) {
  customExecutors = executors;
}

export function clearAgentExecutors() {
  customExecutors = null;
}

function getRunner(agentId, context) {
  return customRunners?.[agentId] || context?.runner || null;
}

function getExecutor(agentId, options) {
  return options?.executor || customExecutors?.[agentId] || null;
}

/**
 * Run an agent and log execution. Never auto-approves or auto-publishes.
 */
export async function runAgent(agentId, input = {}, context = {}) {
  const agent = getAgent(agentId);
  if (!agent) {
    return { ok: false, errors: [`Unknown agent: ${agentId}`] };
  }
  if (agent.placeholder) {
    return {
      ok: false,
      errors: [`${agent.name} is not implemented yet (placeholder).`],
    };
  }

  const runner = getRunner(agentId, context);
  if (!runner) {
    return {
      ok: false,
      errors: [`No runner registered for ${agentId}. Use setAgentRunners().`],
    };
  }

  const started = Date.now();
  const log = createExecutionLog({
    agentId,
    agentName: agent.name,
    status: ORCHESTRATOR_STATUS.RUNNING,
    input,
    approvalRequired: agent.approvalRequired,
  });

  try {
    const result = await runner(input, context);
    const recommendation = buildRecommendation(agentId, result);
    const approvalRequired = requiresHumanApproval(agentId, recommendation);

    let status = ORCHESTRATOR_STATUS.COMPLETED;
    if (!result.ok) {
      status = ORCHESTRATOR_STATUS.FAILED;
    } else if (approvalRequired) {
      status = ORCHESTRATOR_STATUS.WAITING_FOR_REVIEW;
    }

    const durationMs = Date.now() - started;
    updateExecutionLog(log.id, {
      status,
      output: result.data ?? result.output ?? result,
      recommendation,
      approvalRequired,
      durationMs,
      linkedJobId: result.data?.job?.id || result.linkedJobId || null,
      error: result.ok ? null : result.errors?.join("; ") || "Failed",
    });

    return {
      ok: result.ok,
      executionId: log.id,
      status,
      recommendation,
      approvalRequired,
      data: result.data,
      errors: result.errors,
      durationMs,
    };
  } catch (err) {
    const durationMs = Date.now() - started;
    const message = err?.message || String(err);
    updateExecutionLog(log.id, {
      status: ORCHESTRATOR_STATUS.FAILED,
      error: message,
      durationMs,
      recommendation: buildRecommendation(agentId, {
        ok: false,
        errors: [message],
      }),
    });
    return {
      ok: false,
      executionId: log.id,
      status: ORCHESTRATOR_STATUS.FAILED,
      errors: [message],
      durationMs,
    };
  }
}

/** Human approval — records approval only. Does NOT execute side effects. */
export function approveExecution(executionId, options = {}) {
  const log = getExecutionLog(executionId);
  if (!log) return { ok: false, errors: ["Execution not found"] };
  if (log.status !== ORCHESTRATOR_STATUS.WAITING_FOR_REVIEW) {
    return {
      ok: false,
      errors: [`Cannot approve execution in status: ${log.status}`],
    };
  }

  const updated = updateExecutionLog(executionId, {
    status: ORCHESTRATOR_STATUS.APPROVED,
    approval: {
      approvedBy: options.approvedBy || "human-reviewer",
      approvedAt: new Date().toISOString(),
      note: options.note || null,
    },
  });

  return { ok: true, data: updated };
}

/** Human rejection — no side effects. */
export function rejectExecution(executionId, options = {}) {
  const log = getExecutionLog(executionId);
  if (!log) return { ok: false, errors: ["Execution not found"] };
  if (log.status !== ORCHESTRATOR_STATUS.WAITING_FOR_REVIEW) {
    return {
      ok: false,
      errors: [`Cannot reject execution in status: ${log.status}`],
    };
  }

  const updated = updateExecutionLog(executionId, {
    status: ORCHESTRATOR_STATUS.REJECTED,
    approval: {
      rejectedBy: options.rejectedBy || "human-reviewer",
      rejectedAt: new Date().toISOString(),
      reason: options.reason || "Rejected by reviewer",
    },
  });

  return { ok: true, data: updated };
}

/**
 * Execute approved action — only after explicit human approval.
 * Never called automatically by runAgent.
 */
export async function executeApproved(executionId, options = {}) {
  const log = getExecutionLog(executionId);
  if (!log) return { ok: false, errors: ["Execution not found"] };
  if (log.status !== ORCHESTRATOR_STATUS.APPROVED) {
    return {
      ok: false,
      errors: [
        `Execute requires approved status (current: ${log.status}). Human approval is mandatory.`,
      ],
    };
  }

  const executor = getExecutor(log.agentId, options);
  if (!executor) {
    return {
      ok: false,
      errors: [`No executor registered for agent ${log.agentId}`],
    };
  }

  try {
    const result = await executor(log, options);
    updateExecutionLog(executionId, {
      executedAt: new Date().toISOString(),
      executedBy: options.executedBy || log.approval?.approvedBy || "human",
      output: {
        ...(typeof log.output === "object" ? log.output : {}),
        executionResult: result.data ?? result,
      },
      status: result.ok
        ? ORCHESTRATOR_STATUS.COMPLETED
        : ORCHESTRATOR_STATUS.FAILED,
      error: result.ok ? null : result.errors?.join("; "),
    });
    return { ok: result.ok, data: result.data, errors: result.errors };
  } catch (err) {
    const message = err?.message || String(err);
    updateExecutionLog(executionId, {
      status: ORCHESTRATOR_STATUS.FAILED,
      error: message,
    });
    return { ok: false, errors: [message] };
  }
}

/** Audit: verify no autonomous execution without human approval. */
export function auditHumanGovernance() {
  const logs = listExecutionLogs({ limit: 500 });
  const violations = logs.filter(
    (l) => l.executedAt && l.approvalRequired && !l.approval?.approvedBy
  );

  const requiringApproval = logs.filter((l) => l.approvalRequired);
  const reviewed = requiringApproval.filter(
    (l) =>
      l.approval?.approvedBy ||
      l.approval?.rejectedBy ||
      l.status === ORCHESTRATOR_STATUS.APPROVED ||
      l.status === ORCHESTRATOR_STATUS.REJECTED ||
      (l.status === ORCHESTRATOR_STATUS.COMPLETED && l.approval?.approvedBy)
  );

  return {
    autonomousViolations: violations.length,
    humanApprovalRatePct:
      requiringApproval.length > 0
        ? Math.round((reviewed.length / requiringApproval.length) * 1000) / 10
        : 100,
    passed: violations.length === 0,
  };
}

export { AGENT_IDS };
