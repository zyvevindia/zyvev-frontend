import { useCallback, useMemo, useState } from "react";

import { loadPostLaunchOpsContext } from "../../ops/postLaunchOpsContext";
import { buildUserInsightsReport } from "../../ops/userInsightsOps";
import PostLaunchAdminShell, {
  MetricGrid,
  OpsTable,
  adminCard,
} from "./PostLaunchAdminShell";
import { adminBadge } from "./adminOpsStyles";

export default function UserInsightsPage() {
  const [ctx, setCtx] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCtx(await loadPostLaunchOpsContext({ days: 7 }));
    } catch (err) {
      setError(err?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const report = useMemo(
    () => (ctx ? buildUserInsightsReport(ctx.traffic, ctx.liveOps) : null),
    [ctx]
  );

  return (
    <PostLaunchAdminShell
      title="User insights"
      description="Compare journeys, viewed EVs, abandonment, and conversion heuristics from traffic-ops + behavioral aggregates. Deterministic — no speculative AI."
      loading={loading}
      error={error}
      onRefresh={load}
      lastLoaded={ctx?.generatedAt}
    >
      {report ? (
        <>
          <div style={adminCard}>
            <MetricGrid
              metrics={[
                {
                  label: "Compare sessions started",
                  value: report.leadFunnel.compareStarted,
                },
                {
                  label: "Completion rate",
                  value:
                    report.leadFunnel.completionRate != null
                      ? `${report.leadFunnel.completionRate}%`
                      : "—",
                },
                { label: "Leads (period)", value: report.leadFunnel.leadsTotal },
                {
                  label: "Abandon hotspots",
                  value: report.compareAbandonment.length,
                },
              ]}
            />
            <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: 12 }}>
              {report.mobileNote}
            </p>
          </div>

          <div style={adminCard}>
            <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Needs editorial improvement</h2>
            <OpsTable
              emptyLabel="No hints — load traffic data or enable behavioral intelligence."
              columns={[
                {
                  key: "path",
                  label: "Path",
                  render: (r) => <code>{r.path}</code>,
                },
                {
                  key: "hint",
                  label: "Hint",
                  render: (r) => r.hint,
                },
                {
                  key: "sev",
                  label: "Severity",
                  render: (r) => (
                    <span style={adminBadge(r.severity === "high" ? "red" : "yellow")}>
                      {r.severity}
                    </span>
                  ),
                },
              ]}
              rows={report.editorialHints.map((r, i) => ({
                ...r,
                _key: r.key || i,
              }))}
            />
          </div>

          <div style={adminCard}>
            <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Top compare pairs</h2>
            <OpsTable
              columns={[
                { key: "slug", label: "Pair", render: (r) => r.slug },
                { key: "views", label: "Signal", render: (r) => r.views },
              ]}
              rows={report.topComparePairs.map((r, i) => ({
                ...r,
                _key: r.slug || i,
              }))}
            />
          </div>
        </>
      ) : (
        <p style={{ color: "#64748b" }}>Click Refresh to load traffic intelligence.</p>
      )}
    </PostLaunchAdminShell>
  );
}
