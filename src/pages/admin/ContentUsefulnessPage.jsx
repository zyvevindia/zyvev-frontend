import { useCallback, useMemo, useState } from "react";

import { loadPostLaunchOpsContext } from "../../ops/postLaunchOpsContext";
import { buildContentUsefulnessReport } from "../../ops/contentUsefulnessOps";
import OpsExportActions from "../../components/admin/OpsExportActions";
import PostLaunchAdminShell, { MetricGrid, OpsTable, adminCard } from "./PostLaunchAdminShell";

export default function ContentUsefulnessPage() {
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
    () => (ctx ? buildContentUsefulnessReport(ctx) : null),
    [ctx]
  );

  return (
    <PostLaunchAdminShell
      title="Content usefulness"
      description="Practical guide engagement, compare-support content, and authority gaps — usefulness-first signals only."
      loading={loading}
      error={error}
      onRefresh={load}
      lastLoaded={report?.generatedAt}
      extraActions={
        report ? (
          <OpsExportActions
            reportType="content-usefulness"
            rows={report.strongestPracticalGuides}
            fullReport={report}
            filenamePrefix="content-usefulness"
            mapCsvRow={(r) => ({
              path: r.label || r.path,
              engagements: r.engagements,
              cluster: r.cluster,
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
                  label: "Guide engagement",
                  value: report.guideEngagementQuality,
                },
                {
                  label: "Usefulness trend",
                  value: report.guideUsefulnessTrend,
                },
                {
                  label: "Repeat guide paths",
                  value: report.repeatGuideVisitCount,
                },
                {
                  label: "Compare → guide",
                  value: report.compareToGuideTransitions.length,
                },
                {
                  label: "Content trust",
                  value: report.contentTrustTrend,
                },
                {
                  label: "Authority usefulness",
                  value: report.authorityUsefulnessScore,
                },
              ]}
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Most practically useful guides</h3>
            <OpsTable
              columns={[
                {
                  key: "path",
                  label: "Path",
                  render: (r) => <code>{r.label || r.path}</code>,
                },
                {
                  key: "eng",
                  label: "Engagements",
                  render: (r) => r.engagements,
                },
              ]}
              rows={(report.mostPracticallyUsefulGuides || []).map((r, i) => ({
                ...r,
                _key: `prac-${i}`,
              }))}
              emptyLabel="No signal yet."
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Highest-value compare journeys</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.highestValueCompareJourneys || []).map((j) => (
                <li key={`${j.from}-${j.to}`}>
                  {j.from} → {j.to}
                </li>
              ))}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Freshest practical authority content</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.freshestPracticalAuthorityContent || report.mostRevisitedPracticalContent || []).map(
                (g) => (
                  <li key={g.path}>
                    <code>{g.path}</code> ({g.visits})
                  </li>
                )
              )}
            </ul>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 8 }}>
              Freshness: {report.contentFreshnessPersistence ?? "—"} · Usefulness stability:{" "}
              {report.authorityUsefulnessStability ?? "—"}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Most durable EV explainers</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.mostDurableEvExplainers || report.mostDurableOwnershipGuides || []).map(
                (g, i) => (
                  <li key={i}>
                    <code>{g.path || g.label}</code>
                  </li>
                )
              )}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Weak practical-content freshness</h3>
            <p style={{ fontSize: "0.85rem" }}>
              {report.weakPracticalContentFreshness ?? "—"} · Compare-support freshness:{" "}
              {report.compareSupportAuthorityFreshness ?? "—"}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Highest-quality EV journeys</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.highestQualityEvJourneys || report.mostPolishedEvJourneys || []).map(
                (j, i) => (
                  <li key={i}>
                    {j.from} → {j.to}
                  </li>
                )
              )}
            </ul>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 8 }}>
              Production UX: {report.productionUxConsistency ?? "—"} · Smoothness:{" "}
              {report.practicalJourneySmoothness ?? "—"}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Weak UX consistency</h3>
            <p style={{ fontSize: "0.85rem" }}>
              {report.weakUxConsistency ?? "—"} · Friction hotspots:{" "}
              {(report.weakUxFrictionHotspots || []).length}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Highest-quality authority content</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.highestQualityAuthorityContent || report.mostMemorableAuthorityGuides || []).map(
                (g, i) => (
                  <li key={i}>
                    <code>{g.path || g.label}</code>
                  </li>
                )
              )}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Most memorable EV explainers</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.mostMemorableEvExplainers || report.bestOwnershipExplainers || []).map(
                (g, i) => (
                  <li key={i}>
                    <code>{g.path || g.label}</code>
                  </li>
                )
              )}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Most polished EV journeys</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.mostPolishedEvJourneys || report.mostUsefulEvJourneys || []).map(
                (j, i) => (
                  <li key={i}>
                    {j.from} → {j.to}
                  </li>
                )
              )}
            </ul>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 8 }}>
              Calm UX trend: {report.calmUxQualityTrend ?? "—"} · Journey consistency:{" "}
              {report.practicalJourneyConsistency ?? "—"}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Highest clarity compare journeys</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.highestClarityCompareJourneys ||
                report.strongestCompareReadability ||
                []
              ).map((j, i) => (
                <li key={i}>
                  {j.from} → {j.to}
                </li>
              ))}
            </ul>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 8 }}>
              Readability persistence: {report.compareReadabilityPersistence ?? "—"}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Strong ownership readability</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.strongOwnershipReadability || report.mostUsefulOwnershipGuidance || []).map(
                (g, i) => (
                  <li key={i}>
                    <code>{g.path || g.label}</code>
                  </li>
                )
              )}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Weak charging clarity</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.weakChargingGuidance || []).map((g, i) => (
                <li key={i}>
                  <code>{g.path || g.label || g.cluster}</code>
                </li>
              ))}
            </ul>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 8 }}>
              Charging readability: {report.chargingGuidanceReadability ?? "—"}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Most memorable authority guides</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.mostMemorableAuthorityGuides || report.mostMemorableAuthorityContent || []).map(
                (g, i) => (
                  <li key={i}>
                    <code>{g.path || g.label}</code>
                  </li>
                )
              )}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Weak practical authority quality</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.weakPracticalAuthorityQuality || report.weakPracticalAuthorityClusters || []).map(
                (c, i) => (
                  <li key={i}>{c.clusterId || c.path || String(c)}</li>
                )
              )}
            </ul>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 8 }}>
              Authority consistency: {report.authorityContentConsistency ?? "—"}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Most useful EV journeys</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.mostUsefulEvJourneys || report.highReturnPracticalJourneys || []).map(
                (j, i) => (
                  <li key={i}>
                    {j.from} → {j.to}
                  </li>
                )
              )}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Strongest compare readability</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.strongestCompareReadability ||
                report.highestValueCompareJourneys ||
                []
              ).map((j, i) => (
                <li key={i}>
                  {j.from} → {j.to}
                </li>
              ))}
            </ul>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 8 }}>
              Quality: {report.compareReadabilityQuality ?? "—"}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Weak practical usability</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.weakPracticalUsability || report.weakUsabilityHotspots || []).map(
                (w, i) => (
                  <li key={i}>
                    {w.type}: {w.id || w.slug || w.clusterId}
                  </li>
                )
              )}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Most useful ownership guidance</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.mostUsefulOwnershipGuidance || []).map((g, i) => (
                <li key={i}>
                  <code>{g.path || g.label}</code>
                </li>
              ))}
            </ul>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 8 }}>
              Clarity: {report.ownershipGuidanceClarity ?? "—"}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Weak charging guidance</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.weakChargingGuidance || []).map((g, i) => (
                <li key={i}>
                  <code>{g.path || g.label || g.cluster}</code>
                </li>
              ))}
            </ul>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 8 }}>
              Clarity: {report.chargingGuidanceClarity ?? "—"}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Weak practical guidance</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.weakPracticalGuidance || []).map((w, i) => (
                <li key={i}>
                  {w.type}: {w.id || w.slug || w.clusterId}
                </li>
              ))}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Most revisited practical content</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.mostRevisitedPracticalContent || []).map((g) => (
                <li key={g.path}>
                  <code>{g.path}</code> ({g.visits})
                </li>
              ))}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Most trusted public authority content</h3>
            <OpsTable
              columns={[
                {
                  key: "path",
                  label: "Path",
                  render: (r) => <code>{r.label || r.path}</code>,
                },
                {
                  key: "eng",
                  label: "Engagements",
                  render: (r) => r.engagements,
                },
              ]}
              rows={(report.mostTrustedPublicAuthorityContent || []).map((r, i) => ({
                ...r,
                _key: `pub-${i}`,
              }))}
              emptyLabel="No public authority signal yet."
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Best ownership explainers</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.bestOwnershipExplainers || []).map((g) => (
                <li key={g.label}>{g.label}</li>
              ))}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Best charging practicality content</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.bestChargingPracticalityContent || []).map((g) => (
                <li key={g.label}>
                  {g.label} ({g.engagements})
                </li>
              ))}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Weak public authority clusters</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.weakPublicAuthorityClusters || []).map((c) => (
                <li key={c.clusterId}>
                  {c.clusterId} (score {c.score})
                </li>
              ))}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Highest trust-retention authority content</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.highestTrustRetentionAuthorityContent || []).map((g) => (
                <li key={g.path}>
                  <code>{g.path}</code> ({g.visits} revisits)
                </li>
              ))}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Most useful charging explainers</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.mostUsefulChargingExplainers || []).map((g) => (
                <li key={g.label}>
                  {g.label} ({g.engagements})
                </li>
              ))}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Highest trust-retention guides</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.highestTrustRetentionGuides ||
                report.highestRetentionAuthorityPages ||
                []
              ).map((g) => (
                <li key={g.path}>
                  <code>{g.path}</code> ({g.visits} revisits)
                </li>
              ))}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Repeat-user authority journeys</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.repeatUserAuthorityJourneys || []).map((j) => (
                <li key={`${j.from}-${j.pair}`}>
                  {j.from} → compare {j.pair || "—"}
                </li>
              ))}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Highest retention authority pages</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.highestRetentionAuthorityPages || []).map((g) => (
                <li key={g.path}>
                  <code>{g.path}</code> ({g.visits} revisits)
                </li>
              ))}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Repeat-visitor guide engagement</h3>
            <p style={{ fontSize: "0.85rem" }}>
              Revisit quality: {report.guideRevisitQuality} · Retention trend:{" "}
              {report.authorityRetentionTrend}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Most trusted practical guides</h3>
            <OpsTable
              columns={[
                {
                  key: "path",
                  label: "Path",
                  render: (r) => <code>{r.label || r.path}</code>,
                },
                {
                  key: "eng",
                  label: "Engagements",
                  render: (r) => r.engagements,
                },
              ]}
              rows={report.mostTrustedPracticalGuides.map((r, i) => ({
                ...r,
                _key: `trusted-${i}`,
              }))}
              emptyLabel="No engagement yet."
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Strongest practical guides</h3>
            <OpsTable
              columns={[
                {
                  key: "path",
                  label: "Path / cluster",
                  render: (r) => <code>{r.label || r.path}</code>,
                },
                {
                  key: "eng",
                  label: "Engagements",
                  render: (r) => r.engagements,
                },
                {
                  key: "cluster",
                  label: "Cluster",
                  render: (r) => r.cluster,
                },
              ]}
              rows={report.strongestPracticalGuides.map((r, i) => ({
                ...r,
                _key: `${r.path}-${i}`,
              }))}
              emptyLabel="No guide engagement in buffer yet."
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Weak authority content</h3>
            <OpsTable
              columns={[
                {
                  key: "cluster",
                  label: "Cluster",
                  render: (r) => r.clusterId,
                },
                { key: "score", label: "Score", render: (r) => r.score },
              ]}
              rows={report.weakAuthorityContent.map((r) => ({
                ...r,
                _key: r.clusterId,
              }))}
              emptyLabel="No weak clusters."
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Weak engagement practical pages</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.lowEngagementPracticalPages || []).map((g) => (
                <li key={g.path || g.title}>
                  {g.path || g.title} (score {g.guideOpportunityScore})
                </li>
              ))}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>High-trust ownership explainers</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {report.highTrustOwnershipExplainers.map((g) => (
                <li key={g.label}>{g.label}</li>
              ))}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Weak authority pages</h3>
            <OpsTable
              columns={[
                {
                  key: "cluster",
                  label: "Cluster",
                  render: (r) => r.clusterId,
                },
                { key: "score", label: "Score", render: (r) => r.score },
              ]}
              rows={report.weakAuthorityPages.map((r) => ({
                ...r,
                _key: r.clusterId,
              }))}
              emptyLabel="No weak clusters flagged."
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Most useful compare-support guides</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {report.mostUsefulCompareSupportGuides.map((g) => (
                <li key={g.pairSlug || g.href}>
                  {g.pairSlug || g.label} → {g.guideHref || g.href}
                </li>
              ))}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Most durable ownership guides</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.mostDurableOwnershipGuides || []).map((g) => (
                <li key={g.label || g.path}>{g.label || g.path}</li>
              ))}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Most revisited charging guides</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.mostRevisitedChargingGuides || []).map((g) => (
                <li key={g.label}>{g.label} ({g.engagements})</li>
              ))}
            </ul>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Weak practical authority clusters</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.weakPracticalAuthorityClusters || []).map((c) => (
                <li key={c.clusterId}>
                  {c.clusterId} (score {c.score})
                </li>
              ))}
            </ul>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={adminCard}>
              <h3 style={{ marginTop: 0 }}>Ownership education hotspots</h3>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
                {report.ownershipEducationHotspots.map((g) => (
                  <li key={g.label}>{g.label} ({g.engagements})</li>
                ))}
              </ul>
            </div>
            <div style={adminCard}>
              <h3 style={{ marginTop: 0 }}>Charging education hotspots</h3>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
                {report.chargingEducationHotspots.map((g) => (
                  <li key={g.label}>{g.label} ({g.engagements})</li>
                ))}
              </ul>
            </div>
          </div>
        </>
      ) : null}
    </PostLaunchAdminShell>
  );
}
