import { useCallback, useMemo, useState } from "react";

import { loadPostLaunchOpsContext } from "../../ops/postLaunchOpsContext";
import { buildOwnershipAuthorityReport } from "../../ops/ownershipAuthorityOps";
import OpsExportActions from "../../components/admin/OpsExportActions";
import PostLaunchAdminShell, { MetricGrid, OpsTable, adminCard } from "./PostLaunchAdminShell";
import { adminBadge } from "./adminOpsStyles";

export default function OwnershipAuthorityPage() {
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
    () => (ctx ? buildOwnershipAuthorityReport(ctx) : null),
    [ctx]
  );

  return (
    <PostLaunchAdminShell
      title="Ownership authority"
      description="Authority depth, guide ecosystem, buyer personas, and compare ↔ guide linking — quality clusters only."
      loading={loading}
      error={error}
      onRefresh={load}
      lastLoaded={report?.generatedAt}
      extraActions={
        report ? (
          <>
            <OpsExportActions
              reportType="ownership-authority"
              rows={report.topics}
              fullReport={report}
              filenamePrefix="ownership-authority"
              mapCsvRow={(t) => ({
                id: t.id,
                title: t.title,
                authorityDepthScore: t.authorityDepthScore,
                guideSupportCompleteness: t.guideSupportCompleteness,
              })}
            />
            <OpsExportActions
              reportType="weak-authority-clusters"
              rows={report.weakAuthorityClusters}
              fullReport={{ weak: report.weakAuthorityClusters }}
              filenamePrefix="weak-authority-clusters"
              mapCsvRow={(w) => ({
                id: w.id,
                title: w.title,
                completeness: w.completeness,
                suggestion: w.suggestion,
              })}
            />
          </>
        ) : null
      }
    >
      {report ? (
        <>
          <div style={adminCard}>
            <MetricGrid
              metrics={[
                {
                  label: "Authority ecosystem",
                  value: report.authorityEcosystemScore,
                },
                {
                  label: "Maturity",
                  value: report.authorityMaturityLevel,
                },
                {
                  label: "Ownership education",
                  value: report.ownershipEducationCompleteness,
                },
                {
                  label: "Charging education",
                  value: report.chargingEducationMaturity,
                },
                {
                  label: "Compare ↔ guide",
                  value: report.compareGuideLinkMaturity,
                },
                {
                  label: "Weak clusters",
                  value: report.weakAuthorityClusters.length,
                },
              ]}
            />
          </div>
          <div style={{ ...adminCard, marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Buyer guidance personas</h3>
            <OpsTable
              columns={[
                { key: "label", label: "Persona", render: (p) => p.label },
                {
                  key: "conf",
                  label: "Guidance confidence",
                  render: (p) => p.ownershipGuidanceConfidence,
                },
                {
                  key: "edu",
                  label: "Education score",
                  render: (p) => p.educationalSupportScore,
                },
                {
                  key: "comp",
                  label: "Guide completeness",
                  render: (p) => `${p.guideSupportCompleteness}%`,
                },
              ]}
              rows={report.personas.map((p) => ({ ...p, _key: p.id }))}
            />
          </div>
          {report.editorialDepthSuggestions?.length ? (
            <div style={{ ...adminCard, marginTop: 16 }}>
              <h3 style={{ marginTop: 0 }}>Editorial depth suggestions</h3>
              <ul>
                {report.editorialDepthSuggestions.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : (
        <p style={{ color: "#64748b" }}>Refresh to analyze ownership authority depth.</p>
      )}
    </PostLaunchAdminShell>
  );
}
