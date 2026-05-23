import { useCallback, useMemo, useState } from "react";

import { buildPerformanceLearningReport } from "../../ops/performanceLearningOps";
import { buildOperationalConfidenceReport } from "../../ops/operationalConfidenceOps";
import OpsExportActions from "../../components/admin/OpsExportActions";
import PostLaunchAdminShell, { MetricGrid, OpsTable, adminCard } from "./PostLaunchAdminShell";
import { adminBadge } from "./adminOpsStyles";

export default function PerformanceLearningPage() {
  const staticReport = useMemo(() => buildPerformanceLearningReport(), []);
  const [confidence, setConfidence] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadConfidence = useCallback(async () => {
    setLoading(true);
    try {
      setConfidence(await buildOperationalConfidenceReport());
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <PostLaunchAdminShell
      title="Performance learning"
      description="Route paint proxies, compare load signals, regression alerts, and operational confidence index."
      lastLoaded={confidence?.generatedAt || staticReport.generatedAt}
      onRefresh={loadConfidence}
      loading={loading}
      extraActions={
        <OpsExportActions
          reportType="performance-learning"
          rows={staticReport.regressionAlerts}
          fullReport={{ perf: staticReport, confidence }}
          filenamePrefix="performance-learning"
        />
      }
    >
      <div style={adminCard}>
        <MetricGrid
          metrics={[
            {
              label: "Performance confidence",
              value: staticReport.performanceConfidence,
            },
            {
              label: "Ops confidence index",
              value: confidence?.operationalConfidenceIndex ?? "—",
            },
            {
              label: "Home route proxy (ms)",
              value: staticReport.homepageLcpProxy ?? "—",
            },
            {
              label: "Compare slow events",
              value: staticReport.compareLoadEvents,
            },
          ]}
        />
        <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 12 }}>
          {staticReport.note}
        </p>
      </div>

      {confidence?.historicalSnapshots?.length > 0 ? (
        <div style={adminCard}>
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Confidence trend</h2>
          <ul style={{ fontSize: "0.85rem" }}>
            {confidence.historicalSnapshots.map((s) => (
              <li key={s.day}>
                {s.day}: {s.index}/100
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {staticReport.regressionAlerts.length > 0 ? (
        <div style={adminCard}>
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Regression alerts</h2>
          <OpsTable
            columns={[
              { key: "code", label: "Code", render: (r) => r.code },
              {
                key: "sev",
                label: "Severity",
                render: (r) => (
                  <span style={adminBadge(r.severity === "high" ? "red" : "yellow")}>
                    {r.severity}
                  </span>
                ),
              },
              { key: "msg", label: "Message", render: (r) => r.message },
            ]}
            rows={staticReport.regressionAlerts.map((r, i) => ({
              ...r,
              _key: r.code || i,
            }))}
          />
        </div>
      ) : (
        <p style={{ color: "#64748b" }}>No regression alerts in current buffer.</p>
      )}
    </PostLaunchAdminShell>
  );
}
