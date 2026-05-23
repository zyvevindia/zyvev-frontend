import { useCallback, useState } from "react";

import { buildSoftLaunchMonitorReport } from "../../ops/softLaunchMonitorOps";
import { buildOperationalConfidenceReport } from "../../ops/operationalConfidenceOps";
import OpsExportActions from "../../components/admin/OpsExportActions";
import PostLaunchAdminShell, { MetricGrid, adminCard } from "./PostLaunchAdminShell";
import { adminBadge } from "./adminOpsStyles";

export default function SoftLaunchMonitorPage() {
  const [report, setReport] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [mon, conf] = await Promise.all([
        buildSoftLaunchMonitorReport(),
        buildOperationalConfidenceReport(),
      ]);
      setReport(mon);
      setConfidence(conf);
    } catch (err) {
      setError(err?.message || "Probe failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <PostLaunchAdminShell
      title="Soft launch monitor"
      description="API uptime proxy, slow endpoints, image fallbacks, cold-start frequency — from live probe + client metrics buffer."
      loading={loading}
      error={error}
      onRefresh={load}
      lastLoaded={report?.generatedAt}
      extraActions={
        report ? (
          <OpsExportActions
            reportType="soft-launch-monitor"
            rows={[]}
            fullReport={{ monitor: report, confidence }}
            filenamePrefix="launch-monitor"
          />
        ) : null
      }
    >
      {report ? (
        <>
          <div style={adminCard}>
            <p style={{ marginTop: 0 }}>
              <span style={adminBadge(report.opsState)}>
                {report.opsStateLabel}
              </span>
              {" · "}
              API latency {report.health.api.latencyMs}ms
            </p>
            <MetricGrid
              metrics={[
                { label: "Slow API (24h buf.)", value: report.metrics.apiSlowCount },
                {
                  label: "Slow routes (24h)",
                  value: report.metrics.routeSlowCount,
                },
                {
                  label: "Image fallbacks",
                  value: report.metrics.imageFallbackCount,
                },
                {
                  label: "Cold-start probes",
                  value: report.metrics.coldStartCount,
                },
              ]}
            />
          </div>
          <div style={adminCard}>
            <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Daily ops checklist</h2>
            <ul style={{ lineHeight: 1.7, fontSize: "0.9rem" }}>
              {report.checklistSummary.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: 0 }}>
              Incident notes: use Launch checklist blockers + ops discipline hub.
            </p>
          </div>
          {confidence ? (
            <div style={adminCard}>
              <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>
                Operational confidence index
              </h2>
              <p style={{ margin: "0 0 8px" }}>
                <strong>{confidence.operationalConfidenceIndex}</strong>/100 ·
                trend: {confidence.trend}
              </p>
              <MetricGrid
                metrics={[
                  { label: "API confidence", value: confidence.apiHealthConfidence },
                  {
                    label: "Compare perf.",
                    value: confidence.comparePerformanceConfidence,
                  },
                  {
                    label: "Image reliability",
                    value: confidence.imageReliabilityConfidence,
                  },
                  { label: "Route confidence", value: confidence.routeConfidence },
                ]}
              />
            </div>
          ) : null}

          {report.metrics.slowPages?.length > 0 ? (
            <div style={adminCard}>
              <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Top slow routes</h2>
              <ul>
                {report.metrics.slowPages.map((p) => (
                  <li key={p.pathname}>
                    <code>{p.pathname}</code> — {p.count} events
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : (
        <p style={{ color: "#64748b" }}>Refresh to run operational probe.</p>
      )}
    </PostLaunchAdminShell>
  );
}
