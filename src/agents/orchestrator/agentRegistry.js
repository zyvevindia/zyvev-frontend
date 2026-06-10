/**
 * Registered agents for the EVSavari semi-autonomous platform.
 * Orchestrator coordinates these — no agent file modifications required.
 */
export const AGENT_IDS = Object.freeze({
  VEHICLE_CREATION: "vehicleCreation",
  CHANGE_DETECTION: "changeDetection",
  SCORE_ENGINE: "scoreEngine",
  SEO: "seo",
  AUDIT: "audit",
  MONITORING: "monitoring",
  CONTENT: "content",
  ANALYTICS: "analytics",
});

export const AGENT_REGISTRY = Object.freeze([
  {
    id: AGENT_IDS.VEHICLE_CREATION,
    name: "VehicleCreationAgent",
    label: "Vehicle Creation",
    version: "1.1",
    description:
      "Acquire OEM sources, extract evidence, and produce a human review dossier. Publish only after approval.",
    adminRoute: "/admin/vehicle-creation",
    approvalRequired: true,
    placeholder: false,
    category: "catalog",
  },
  {
    id: AGENT_IDS.CHANGE_DETECTION,
    name: "ChangeDetectionAgent",
    label: "Change Detection",
    version: "1",
    description:
      "Monitor published snapshots vs latest acquisition and surface diffs for human review.",
    adminRoute: "/admin/change-detection",
    approvalRequired: true,
    placeholder: false,
    category: "catalog",
  },
  {
    id: AGENT_IDS.SCORE_ENGINE,
    name: "ScoreEngineAgent",
    label: "Score Engine",
    version: "1",
    description:
      "Deterministic EVSavari scores and variant recommendations. Read-only — no catalog writes.",
    adminRoute: null,
    approvalRequired: false,
    placeholder: false,
    category: "intelligence",
  },
  {
    id: AGENT_IDS.SEO,
    name: "SeoAgent",
    label: "SEO Agent",
    version: null,
    description: "Future: SEO content generation and sitemap optimization.",
    adminRoute: null,
    approvalRequired: true,
    placeholder: true,
    category: "content",
  },
  {
    id: AGENT_IDS.AUDIT,
    name: "AuditAgent",
    label: "Audit Agent",
    version: null,
    description: "Future: catalog quality and trust audits.",
    adminRoute: null,
    approvalRequired: true,
    placeholder: true,
    category: "ops",
  },
  {
    id: AGENT_IDS.MONITORING,
    name: "MonitoringAgent",
    label: "Monitoring Agent",
    version: null,
    description: "Future: uptime and data freshness monitoring.",
    adminRoute: null,
    approvalRequired: true,
    placeholder: true,
    category: "ops",
  },
  {
    id: AGENT_IDS.CONTENT,
    name: "ContentAgent",
    label: "Content Agent",
    version: null,
    description: "Future: editorial content drafts for human review.",
    adminRoute: null,
    approvalRequired: true,
    placeholder: true,
    category: "content",
  },
  {
    id: AGENT_IDS.ANALYTICS,
    name: "AnalyticsAgent",
    label: "Analytics Agent",
    version: null,
    description: "Future: usage insights and conversion analytics.",
    adminRoute: null,
    approvalRequired: true,
    placeholder: true,
    category: "ops",
  },
]);

export function getAgent(agentId) {
  return AGENT_REGISTRY.find((a) => a.id === agentId) || null;
}

export function listAgents({ includePlaceholders = true } = {}) {
  return AGENT_REGISTRY.filter(
    (a) => includePlaceholders || !a.placeholder
  );
}

export function listActiveAgents() {
  return AGENT_REGISTRY.filter((a) => !a.placeholder);
}
