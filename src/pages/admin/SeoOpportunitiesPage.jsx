import { useCallback, useMemo, useState } from "react";

import { loadPostLaunchOpsContext } from "../../ops/postLaunchOpsContext";
import {
  buildSeoOpportunityQueue,
  summarizeSeoOpportunityQueue,
} from "../../ops/seoOpportunityOps";
import PostLaunchAdminShell, { MetricGrid, OpsTable, adminCard } from "./PostLaunchAdminShell";
import { adminBadge } from "./adminOpsStyles";

export default function SeoOpportunitiesPage() {
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

  const rows = useMemo(() => {
    if (!ctx) return [];
    return buildSeoOpportunityQueue(ctx.seoDiscipline, {
      topLandingPages: ctx.traffic?.topLandingPages,
      topConvertingPages: ctx.traffic?.topConvertingPages,
    });
  }, [ctx]);

  const summary = useMemo(() => summarizeSeoOpportunityQueue(rows), [rows]);

  return (
    <PostLaunchAdminShell
      title="SEO opportunities"
      description="Indexing discipline + traffic traction — orphans, weak engagement, internal link opportunities. No GSC API (human-run GSC separately)."
      loading={loading}
      error={error}
      onRefresh={load}
      lastLoaded={ctx?.generatedAt}
    >
      {ctx ? (
        <>
          <div style={adminCard}>
            <MetricGrid
              metrics={[
                { label: "Opportunities", value: summary.total },
                { label: "High severity", value: summary.high },
                { label: "Medium", value: summary.medium },
                {
                  label: "Orphan paths",
                  value: ctx.seoDiscipline?.orphanDiscoveryPaths?.length ?? 0,
                },
              ]}
            />
          </div>
          <OpsTable
            columns={[
              { key: "path", label: "Path", render: (r) => <code>{r.path}</code> },
              { key: "kind", label: "Kind", render: (r) => r.kind },
              {
                key: "sev",
                label: "Severity",
                render: (r) => (
                  <span style={adminBadge(r.severity === "high" ? "red" : "yellow")}>
                    {r.severity}
                  </span>
                ),
              },
              {
                key: "suggestion",
                label: "Recommendation",
                render: (r) => r.suggestion,
              },
            ]}
            rows={rows.map((r) => ({ ...r, _key: r.key }))}
          />
        </>
      ) : (
        <p style={{ color: "#64748b" }}>Refresh to analyze SEO opportunities.</p>
      )}
    </PostLaunchAdminShell>
  );
}
