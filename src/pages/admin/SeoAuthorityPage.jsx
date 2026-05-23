import { useCallback, useMemo, useState } from "react";

import { loadPostLaunchOpsContext } from "../../ops/postLaunchOpsContext";
import { buildSeoAuthorityReport } from "../../ops/seoAuthorityOps";
import OpsExportActions from "../../components/admin/OpsExportActions";
import PostLaunchAdminShell, { MetricGrid, OpsTable, adminCard } from "./PostLaunchAdminShell";
import { adminBadge } from "./adminOpsStyles";

export default function SeoAuthorityPage() {
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
    () => (ctx ? buildSeoAuthorityReport(ctx) : null),
    [ctx]
  );

  return (
    <PostLaunchAdminShell
      title="SEO authority"
      description="Compare SEO maturity, topical clusters, internal link recommendations, and guide expansion opportunities."
      loading={loading}
      error={error}
      onRefresh={load}
      lastLoaded={report?.generatedAt}
      extraActions={
        report ? (
          <OpsExportActions
            reportType="seo-authority"
            rows={report.opportunities}
            fullReport={report}
            filenamePrefix="seo-authority"
            mapCsvRow={(r) => ({
              path: r.path,
              kind: r.kind,
              severity: r.severity,
              suggestion: r.suggestion,
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
                {
                  label: "Topical authority",
                  value: report.topicalAuthorityScore ?? report.clusterAuthorityScore,
                },
                {
                  label: "Cluster authority",
                  value: report.clusterAuthorityScore,
                },
                { label: "Compare SEO maturity", value: report.compareSeoMaturity },
                {
                  label: "Strongest compare pages",
                  value: report.strongestCompare.length,
                },
                {
                  label: "Needs guide support",
                  value: report.needsGuideSupport.length,
                },
                {
                  label: "Discovery health",
                  value: report.internalDiscoveryHealth,
                },
                {
                  label: "Internal flow",
                  value: report.weakInternalAuthorityFlow,
                },
                {
                  label: "Authority compounding?",
                  value: report.authorityCompoundingHealthy ? "Yes" : "Watch",
                },
                {
                  label: "Discovery persistence",
                  value: report.authorityDiscoveryPersistence,
                },
              ]}
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Low-trust authority paths</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.lowTrustAuthorityPaths || []).map((c) => (
                <li key={c.clusterId}>
                  {c.clusterId} (score {c.score})
                </li>
              ))}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Practical guides lacking discovery</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.practicalGuidesLackingDiscovery || []).map((g) => (
                <li key={g.id}>
                  {g.title} — <code>{g.path}</code>
                </li>
              ))}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Weak authority discovery</h3>
            <OpsTable
              columns={[
                { key: "to", label: "Target", render: (r) => <code>{r.to}</code> },
                { key: "reason", label: "Reason", render: (r) => r.reason },
              ]}
              rows={(report.weakAuthorityDiscovery || []).map((r, i) => ({
                ...r,
                _key: `wd-${i}`,
              }))}
              emptyLabel="No weak paths."
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Compare pages lacking guidance</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.comparePagesLackingGuidance || []).map((c) => (
                <li key={c.pairSlug}>
                  <code>{c.pairSlug}</code>
                </li>
              ))}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Weak authority consistency</h3>
            <p style={{ fontSize: "0.85rem" }}>
              {report.weakAuthorityConsistency ?? "—"} · Discovery consistency:{" "}
              {report.weakDiscoveryConsistency ?? "—"}
            </p>
            <p style={{ fontSize: "0.85rem", marginTop: 8 }}>
              Authority consistency persistence:{" "}
              {report.authorityConsistencyPersistence ?? "—"}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Weak authority retention paths</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.weakAuthorityRetentionPaths || report.weakAuthorityMemoryHotspots || []).map(
                (p, i) => (
                  <li key={i}>
                    <code>{p.to || p.clusterId || p}</code>
                  </li>
                )
              )}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Practical guides lacking discovery</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(
                report.practicalGuidesLackingDiscovery ||
                report.underlinkedHighValuePracticalGuides ||
                []
              ).map((g) => (
                <li key={g.id || g.path}>
                  {g.title} — <code>{g.path}</code>
                </li>
              ))}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Most memorable authority content</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.mostMemorableAuthorityContent || []).map((g) => (
                <li key={g.id || g.path}>
                  {g.title} — <code>{g.path}</code>
                </li>
              ))}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Authority compounding healthy?</h3>
            <p style={{ fontSize: "0.85rem" }}>
              {report.authorityCompoundingHealthy ? "Yes — depth or quality improving" : "Watch — review discovery gaps"}
              {" · "}
              Discovery persistence: {report.authorityDiscoveryPersistence ?? "—"}
              {" · "}
              Compare-support durability: {report.compareSupportAuthorityDurability ?? "—"}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Strong compare-support authority</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.strongCompareSupportAuthority || []).map((l, i) => (
                <li key={`${l.from}-${i}`}>
                  {l.from} → <code>{l.to}</code>
                </li>
              ))}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Most durable authority discovery</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.mostDurableAuthorityDiscovery || []).map((g) => (
                <li key={g.id || g.path}>
                  {g.title} — <code>{g.path}</code>
                </li>
              ))}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>High-retention compare-support content</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.highRetentionCompareSupportContent || []).map((l, i) => (
                <li key={`${l.from}-${i}`}>
                  {l.from} → <code>{l.to}</code>
                </li>
              ))}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Practical-content discovery gaps</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.practicalContentDiscoveryGaps || []).map((g) => (
                <li key={g.id || g.path}>
                  {g.title} — <code>{g.path}</code>
                </li>
              ))}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Underlinked practical content</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.underlinkedPracticalGuides || []).map((r, i) => (
                <li key={`${r.to}-${i}`}>
                  <code>{r.to}</code> — {r.reason}
                </li>
              ))}
            </ul>
          </div>
          <div style={adminCard}>
            <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Guide opportunities</h2>
            <ul style={{ fontSize: "0.9rem", lineHeight: 1.7 }}>
              {report.guideOpportunities.map((g) => (
                <li key={g.id}>
                  <strong>{g.title}</strong> (score {g.guideOpportunityScore}) —{" "}
                  <code>{g.path}</code>
                  <br />
                  <span style={{ color: "#64748b" }}>{g.editorialNote}</span>
                </li>
              ))}
            </ul>
          </div>
          <OpsTable
            columns={[
              { key: "to", label: "Target", render: (r) => <code>{r.to}</code> },
              { key: "reason", label: "Recommendation", render: (r) => r.reason },
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
            rows={report.internalLinkRecs.map((r, i) => ({
              ...r,
              _key: `${r.to}-${i}`,
            }))}
          />
        </>
      ) : (
        <p style={{ color: "#64748b" }}>Refresh to analyze SEO authority.</p>
      )}
    </PostLaunchAdminShell>
  );
}
