import { useCallback, useMemo, useState } from "react";

import { loadPostLaunchOpsContext } from "../../ops/postLaunchOpsContext";
import { buildFreshnessAutomationReport } from "../../ops/catalogFreshnessAutomation";
import OpsExportActions from "../../components/admin/OpsExportActions";
import PostLaunchAdminShell, { MetricGrid, OpsTable, adminCard } from "./PostLaunchAdminShell";
import { adminBadge } from "./adminOpsStyles";

export default function CatalogFreshnessPage() {
  const [ctx, setCtx] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCtx(await loadPostLaunchOpsContext());
    } catch (err) {
      setError(err?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const report = useMemo(
    () => (ctx ? buildFreshnessAutomationReport(ctx) : null),
    [ctx]
  );

  return (
    <PostLaunchAdminShell
      title="Catalog freshness"
      description="Automated stale-data detection — price, verification, charging, media — with priority queue and high-traffic escalation."
      loading={loading}
      error={error}
      onRefresh={load}
      lastLoaded={report?.generatedAt}
      extraActions={
        report ? (
          <OpsExportActions
            reportType="catalog-freshness"
            rows={report.queue}
            fullReport={report}
            filenamePrefix="catalog-freshness"
            mapCsvRow={(r) => ({
              slug: r.slug,
              reviewUrgency: r.reviewUrgency,
              freshnessConfidence: r.freshnessConfidence,
              lastVerifiedAgeDays: r.lastVerifiedAgeDays,
              flags: r.flags.join("; "),
              escalated: r.escalated,
            })}
          />
        ) : null
      }
    >
      {report ? (
        <>
          <div style={adminCard}>
            <MetricGrid
              metrics={[
                { label: "Catalog size", value: report.summary.total },
                { label: "Flagged", value: report.summary.flagged },
                { label: "High risk", value: report.summary.highRisk },
                {
                  label: "Stale price alerts",
                  value: report.alerts.stalePriceCount,
                },
                {
                  label: "Charging alerts",
                  value: report.alerts.outdatedChargingCount,
                },
                {
                  label: "Escalated (high traffic)",
                  value: report.staleHighTraffic.length,
                },
              ]}
            />
          </div>
          <OpsTable
            columns={[
              { key: "ev", label: "EV", render: (r) => r.name },
              {
                key: "urgency",
                label: "Urgency",
                render: (r) => (
                  <span
                    style={adminBadge(
                      r.reviewUrgency === "immediate" ? "red" : "yellow"
                    )}
                  >
                    {r.reviewUrgency}
                  </span>
                ),
              },
              {
                key: "days",
                label: "Verified age (days)",
                render: (r) => r.lastVerifiedAgeDays ?? "—",
              },
              {
                key: "conf",
                label: "Confidence",
                render: (r) => r.freshnessConfidence,
              },
              {
                key: "esc",
                label: "Escalated",
                render: (r) => (r.escalated ? "Yes" : "—"),
              },
              {
                key: "flags",
                label: "Flags",
                render: (r) => r.flags.join(", "),
              },
            ]}
            rows={report.queue.map((r) => ({ ...r, _key: r.slug }))}
          />
        </>
      ) : (
        <p style={{ color: "#64748b" }}>Refresh to run freshness automation.</p>
      )}
    </PostLaunchAdminShell>
  );
}
