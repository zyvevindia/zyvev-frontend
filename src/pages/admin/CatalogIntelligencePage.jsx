import { useCallback, useMemo, useState } from "react";

import { loadPostLaunchOpsContext } from "../../ops/postLaunchOpsContext";
import { buildCatalogIntelligenceReport } from "../../ops/catalogIntelligenceOps";
import OpsExportActions from "../../components/admin/OpsExportActions";
import PostLaunchAdminShell, { MetricGrid, OpsTable, adminCard } from "./PostLaunchAdminShell";
import { adminBadge, statusTone } from "./adminOpsStyles";

export default function CatalogIntelligencePage() {
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
    () => (ctx ? buildCatalogIntelligenceReport(ctx) : null),
    [ctx]
  );

  return (
    <PostLaunchAdminShell
      title="Catalog intelligence"
      description="Ownership realism, charging practicality, recommendation maturity, and estimate transparency — TRUSTED / GOOD / NEEDS_REVIEW / LOW_CONFIDENCE."
      loading={loading}
      error={error}
      onRefresh={load}
      lastLoaded={report?.generatedAt}
      extraActions={
        report ? (
          <OpsExportActions
            reportType="catalog-intelligence"
            rows={report.rows}
            fullReport={report}
            filenamePrefix="catalog-intelligence"
            mapCsvRow={(r) => ({
              slug: r.slug,
              status: r.status,
              ownershipConfidence: r.ownershipConfidence,
              chargingPracticalityConfidence: r.chargingPracticalityConfidence,
              recommendationMaturity: r.recommendationMaturity,
              estimateTransparency: r.estimateTransparency,
              flags: r.flags.join("; "),
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
                { label: "TRUSTED", value: report.statusCounts.TRUSTED },
                { label: "GOOD", value: report.statusCounts.GOOD },
                {
                  label: "NEEDS_REVIEW",
                  value: report.statusCounts.NEEDS_REVIEW,
                },
                {
                  label: "LOW_CONFIDENCE",
                  value: report.statusCounts.LOW_CONFIDENCE,
                },
                { label: "Trusted %", value: `${report.trustedPct}%` },
                {
                  label: "Avg ownership",
                  value: report.avgOwnershipConfidence,
                },
                {
                  label: "Avg charging",
                  value: report.avgChargingPracticality,
                },
              ]}
            />
          </div>

          <OpsTable
            columns={[
              {
                key: "slug",
                label: "Vehicle",
                render: (r) => <code>{r.slug}</code>,
              },
              {
                key: "status",
                label: "Status",
                render: (r) => (
                  <span style={adminBadge(statusTone[r.status] || "neutral")}>
                    {r.status}
                  </span>
                ),
              },
              {
                key: "own",
                label: "Ownership",
                render: (r) => r.ownershipConfidence,
              },
              {
                key: "chg",
                label: "Charging",
                render: (r) => r.chargingPracticalityConfidence,
              },
              {
                key: "rec",
                label: "Rec. maturity",
                render: (r) => r.recommendationMaturity,
              },
              {
                key: "est",
                label: "Transparency",
                render: (r) => r.estimateTransparency,
              },
              {
                key: "flags",
                label: "Flags",
                render: (r) => r.flags.join(", ") || "—",
              },
            ]}
            rows={report.rows}
            emptyLabel="No catalog vehicles loaded."
          />
        </>
      ) : null}
    </PostLaunchAdminShell>
  );
}
