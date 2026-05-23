import { useMemo } from "react";

import { buildFeedbackPrioritizationReport } from "../../ops/feedbackPrioritizationOps";
import OpsExportActions from "../../components/admin/OpsExportActions";
import PostLaunchAdminShell, { MetricGrid, OpsTable, adminCard } from "./PostLaunchAdminShell";
import { adminBadge } from "./adminOpsStyles";

export default function FeedbackLearningPage() {
  const report = useMemo(() => buildFeedbackPrioritizationReport(), []);

  return (
    <PostLaunchAdminShell
      title="Feedback learning"
      description="Prioritized clusters with trust/compare/mobile weighting and high-impact issue detection."
      lastLoaded={report.generatedAt}
      extraActions={
        <OpsExportActions
          reportType="feedback-learning"
          rows={report.prioritized}
          fullReport={report}
          filenamePrefix="feedback-learning"
          mapCsvRow={(r) => ({
            category: r.categoryLabel,
            cluster: r.cluster,
            severity: r.severity,
            impactScore: r.impactScore,
            highImpact: r.highImpact,
          })}
        />
      }
    >
      <div style={adminCard}>
        <MetricGrid
          metrics={[
            { label: "Issue reports", value: report.summary.issueCount },
            {
              label: "High impact",
              value: report.highImpactIssues.length,
            },
            { label: "Trust-weighted", value: report.trustWeightedCount },
            { label: "Compare-weighted", value: report.compareWeightedCount },
            { label: "Mobile UX", value: report.mobileWeightedCount },
          ]}
        />
      </div>

      <div style={adminCard}>
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>High impact issues</h2>
        <OpsTable
          columns={[
            { key: "cat", label: "Category", render: (r) => r.categoryLabel },
            { key: "cluster", label: "Cluster", render: (r) => r.weightLabel },
            {
              key: "impact",
              label: "Impact score",
              render: (r) => r.impactScore,
            },
            {
              key: "hi",
              label: "High impact",
              render: (r) => (
                <span style={adminBadge(r.highImpact ? "red" : "neutral")}>
                  {r.highImpact ? "Yes" : "No"}
                </span>
              ),
            },
          ]}
          rows={report.highImpactIssues.map((r) => ({ ...r, _key: r.id }))}
        />
      </div>

      <div style={adminCard}>
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>All prioritized</h2>
        <OpsTable
          columns={[
            { key: "cat", label: "Category", render: (r) => r.categoryLabel },
            { key: "cluster", label: "Cluster", render: (r) => r.cluster },
            {
              key: "sev",
              label: "Severity",
              render: (r) => (
                <span style={adminBadge(r.severity === "high" ? "red" : "yellow")}>
                  {r.severity}
                </span>
              ),
            },
            { key: "score", label: "Impact", render: (r) => r.impactScore },
            {
              key: "note",
              label: "Note",
              render: (r) => (r.description || "").slice(0, 80),
            },
          ]}
          rows={report.prioritized.map((r) => ({ ...r, _key: r.id }))}
        />
      </div>
    </PostLaunchAdminShell>
  );
}
