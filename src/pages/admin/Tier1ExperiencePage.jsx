import { useCallback, useMemo, useState } from "react";

import { loadPostLaunchOpsContext } from "../../ops/postLaunchOpsContext";
import { buildTier1ExperienceReport } from "../../ops/tier1ExperienceOps";
import OpsExportActions from "../../components/admin/OpsExportActions";
import PostLaunchAdminShell, { MetricGrid, OpsTable, adminCard } from "./PostLaunchAdminShell";
import { adminBadge } from "./adminOpsStyles";

export default function Tier1ExperiencePage() {
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
    () => (ctx ? buildTier1ExperienceReport(ctx) : null),
    [ctx]
  );

  return (
    <PostLaunchAdminShell
      title="Tier-1 EV experience"
      description="PREMIUM_READY / GOOD / NEEDS_IMPROVEMENT for highest-intent families — compare, media, trust, leads, SEO, and ownership realism."
      loading={loading}
      error={error}
      onRefresh={load}
      lastLoaded={report?.generatedAt}
      extraActions={
        report ? (
          <OpsExportActions
            reportType="tier1-experience"
            rows={report.rows}
            fullReport={report}
            filenamePrefix="tier1-experience"
            mapCsvRow={(r) => ({
              familySlug: r.familySlug,
              status: r.status,
              compositeScore: r.compositeScore,
              compareReadiness: r.compareReadiness,
              imageCompleteness: r.imageCompleteness,
              trustCompleteness: r.trustCompleteness,
              recommendationConfidence: r.recommendationConfidence,
              priorityScore: r.priorityScore,
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
                { label: "PREMIUM_READY", value: report.statusCounts.PREMIUM_READY },
                { label: "GOOD", value: report.statusCounts.GOOD },
                {
                  label: "NEEDS_IMPROVEMENT",
                  value: report.statusCounts.NEEDS_IMPROVEMENT,
                },
                { label: "Avg composite", value: report.avgComposite },
                {
                  label: "Media coverage",
                  value: `${report.mediaCoveragePercent}%`,
                  hint: "Families ≥75% manifest roles",
                },
              ]}
            />
          </div>
          <OpsTable
            columns={[
              {
                key: "ev",
                label: "EV",
                render: (r) => (
                  <>
                    <strong>{r.label}</strong>
                    <br />
                    <code>{r.familySlug}</code>
                  </>
                ),
              },
              {
                key: "status",
                label: "Status",
                render: (r) => adminBadge(r.status),
              },
              { key: "score", label: "Composite", render: (r) => r.compositeScore },
              {
                key: "compare",
                label: "Compare",
                render: (r) => r.compareReadiness,
              },
              {
                key: "media",
                label: "Images",
                render: (r) => r.imageCompleteness,
              },
              {
                key: "trust",
                label: "Trust",
                render: (r) => r.trustCompleteness,
              },
              {
                key: "rec",
                label: "Rec. conf.",
                render: (r) => `${r.recommendationConfidence}%`,
              },
              {
                key: "prio",
                label: "Priority",
                render: (r) => r.priorityScore,
              },
              {
                key: "hints",
                label: "Hints",
                render: (r) =>
                  r.hints?.length ? (
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {r.hints.map((h) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>
                  ) : (
                    "—"
                  ),
              },
            ]}
            rows={report.rows.map((r) => ({ ...r, _key: r.familySlug }))}
          />
        </>
      ) : (
        <p style={{ color: "#64748b" }}>Refresh to load tier-1 experience scores.</p>
      )}
    </PostLaunchAdminShell>
  );
}
