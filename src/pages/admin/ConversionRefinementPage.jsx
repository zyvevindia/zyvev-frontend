import { useCallback, useMemo, useState } from "react";



import { loadPostLaunchOpsContext } from "../../ops/postLaunchOpsContext";

import { buildConversionRefinementReport } from "../../ops/conversionRefinementOps";

import OpsExportActions from "../../components/admin/OpsExportActions";

import PostLaunchAdminShell, { MetricGrid, OpsTable, adminCard } from "./PostLaunchAdminShell";



export default function ConversionRefinementPage() {

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

    () => (ctx ? buildConversionRefinementReport(ctx) : null),

    [ctx]

  );



  return (

    <PostLaunchAdminShell

      title="Conversion refinement"

      description="Trust-assisted conversion, compare-to-lead paths, and doubt abandonment — calm funnel learning only."

      loading={loading}

      error={error}

      onRefresh={load}

      lastLoaded={report?.generatedAt}

      extraActions={

        report ? (

          <OpsExportActions

            reportType="conversion-refinement"

            rows={report.weakCompareToLeadPaths}

            fullReport={report}

            filenamePrefix="conversion-refinement"

            mapCsvRow={(r) => ({

              pairSlug: r.pairSlug,

              started: r.started,

              abandoned: r.abandoned,

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

                  label: "Lead confidence",

                  value: report.compareLeadConfidenceTrend,

                },

                {

                  label: "Trust-assisted",

                  value: report.trustAssistedConversionIndicator ?? "—",

                },

                {

                  label: "Assisted quality",

                  value: report.trustAssistedConversionQuality,

                },

                {

                  label: "Rec.-assisted leads",

                  value: report.recommendationAssistedLeadTrend,

                },

                {

                  label: "Rec. confidence → lead",

                  value: report.recommendationConfidenceConversionTrend,

                },

                {

                  label: "Guidance-assisted",

                  value: report.guidanceAssistedLeadConfidence,

                },

              ]}

            />

          </div>



          <div style={adminCard}>

            <h3 style={{ marginTop: 0 }}>Most trusted conversion journeys</h3>

            <OpsTable

              columns={[

                {

                  key: "pair",

                  label: "Pair",

                  render: (r) => <code>{r.pairSlug}</code>,

                },

                {

                  key: "leads",

                  label: "Leads",

                  render: (r) => r.leads ?? r.leadCount ?? "—",

                },

              ]}

              rows={report.mostTrustedConversionJourneys.map((r) => ({

                ...r,

                _key: r.pairSlug,

              }))}

              emptyLabel="None in buffer yet."

            />

          </div>



          <div style={adminCard}>

            <h3 style={{ marginTop: 0 }}>Weak trust-to-lead journeys</h3>

            <OpsTable

              columns={[

                {

                  key: "pair",

                  label: "Pair",

                  render: (r) => <code>{r.pairSlug}</code>,

                },

                { key: "s", label: "Started", render: (r) => r.started },

                {

                  key: "a",

                  label: "Abandoned",

                  render: (r) => r.abandoned,

                },

              ]}

              rows={report.weakTrustToLeadJourneys.map((r) => ({

                ...r,

                _key: r.pairSlug,

              }))}

              emptyLabel="None flagged in buffer."

            />

          </div>



          <div style={adminCard}>

            <h3 style={{ marginTop: 0 }}>High doubt before lead</h3>

            <OpsTable

              columns={[

                {

                  key: "pair",

                  label: "Pair",

                  render: (r) => <code>{r.pairSlug}</code>,

                },

                { key: "d", label: "Doubt", render: (r) => r.doubted },

                {

                  key: "a",

                  label: "Abandoned",

                  render: (r) => r.abandoned,

                },

              ]}

              rows={report.highDoubtBeforeLead.map((r) => ({

                ...r,

                _key: r.pairSlug,

              }))}

              emptyLabel="None in buffer."

            />

          </div>



          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Most trusted repeat-user leads</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.mostTrustedRepeatUserLeads || []).map((r) => (
                <li key={r.count}>
                  {r.count} leads · quality {r.quality}
                </li>
              ))}
            </ul>
            <p style={{ fontSize: "0.85rem", marginTop: 8 }}>
              Weak trust before lead: {report.weakTrustPersistenceBeforeLead ?? "—"}
              {" · "}
              Lead durability: {report.repeatVisitorLeadDurability ?? "—"}
            </p>
          </div>

          <div style={adminCard}>

            <h3 style={{ marginTop: 0 }}>Strong repeat-user conversions</h3>

            <p style={{ fontSize: "0.85rem", color: "#64748b" }}>

              Trusted return-user leads: {report.trustedReturnUserLeads} · Repeat-compare

              quality: {report.repeatCompareConversionQuality} · Repeat visitor pattern:{" "}

              {report.repeatVisitorLeadQuality}

            </p>

          </div>



          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Highest-trust conversion journeys</h3>
            <OpsTable
              columns={[
                {
                  key: "pair",
                  label: "Pair",
                  render: (r) => <code>{r.pairSlug}</code>,
                },
              ]}
              rows={(report.highestTrustConversionJourneys || []).map((r) => ({
                ...r,
                _key: r.pairSlug,
              }))}
              emptyLabel="None yet."
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Weak recommendation-to-lead flows</h3>
            <OpsTable
              columns={[
                {
                  key: "pair",
                  label: "Pair",
                  render: (r) => <code>{r.pairSlug}</code>,
                },
                { key: "s", label: "Started", render: (r) => r.started },
              ]}
              rows={(report.weakRecommendationToLeadFlows || []).map((r) => ({
                ...r,
                _key: r.pairSlug,
              }))}
              emptyLabel="None flagged."
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Strong trust-assisted journeys</h3>
            <OpsTable
              columns={[
                {
                  key: "pair",
                  label: "Pair",
                  render: (r) => <code>{r.pairSlug}</code>,
                },
              ]}
              rows={(report.strongTrustAssistedJourneys || []).map((r) => ({
                ...r,
                _key: r.pairSlug,
              }))}
              emptyLabel="None yet."
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Strong ownership-guidance conversions</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.strongOwnershipGuidanceConversions || []).map((r) => (
                <li key={r.pairSlug}>
                  <code>{r.pairSlug}</code>
                </li>
              ))}
            </ul>
            <p style={{ fontSize: "0.85rem", marginTop: 8 }}>
              Durability: {report.ownershipGuidanceConversionDurability ?? "—"}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Weak trust consistency under traffic</h3>
            <p style={{ fontSize: "0.85rem" }}>
              {report.weakTrustConsistencyUnderTraffic ?? "—"} · Conversion under traffic:{" "}
              {report.conversionQualityUnderTraffic ?? "—"}
            </p>
            <p style={{ fontSize: "0.85rem", marginTop: 8 }}>
              Low-trust abandonment under growth:{" "}
              {report.lowTrustAbandonmentUnderGrowth ?? "—"}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Weak trust consistency before lead</h3>
            <p style={{ fontSize: "0.85rem" }}>
              {report.weakTrustConsistencyBeforeLead ?? report.weakTrustPersistenceBeforeLead ?? "—"}
              {" · "}
              Low-trust persistence: {report.lowTrustConversionPersistence ?? "—"}
            </p>
            <p style={{ fontSize: "0.85rem", marginTop: 8 }}>
              Reassurance-assisted: {report.reassuranceAssistedConversionQuality ?? "—"}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Weak trust persistence before lead</h3>
            <p style={{ fontSize: "0.85rem" }}>
              {report.weakTrustPersistenceBeforeLead ?? "—"} · Hotspots:{" "}
              {(report.weakTrustConversionHotspots || []).length}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Most trusted repeat-user leads</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.85rem" }}>
              {(report.mostTrustedRepeatUserLeads || []).map((r, i) => (
                <li key={i}>
                  {r.count} leads — {r.quality}
                </li>
              ))}
            </ul>
            <p style={{ fontSize: "0.85rem", marginTop: 8 }}>
              Repeat-user trust: {report.repeatUserConversionTrust ?? "—"}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Highest trust-quality leads</h3>
            <OpsTable
              columns={[
                {
                  key: "pair",
                  label: "Pair",
                  render: (r) => <code>{r.pairSlug}</code>,
                },
              ]}
              rows={(report.highestTrustQualityLeads || []).map((r) => ({
                ...r,
                _key: r.pairSlug,
              }))}
              emptyLabel="None yet."
            />
            <p style={{ fontSize: "0.85rem", marginTop: 8 }}>
              Usefulness-assisted: {report.usefulnessAssistedConversionQuality ?? "—"}
            </p>
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Highest trust-retention conversions</h3>
            <OpsTable
              columns={[
                {
                  key: "pair",
                  label: "Pair",
                  render: (r) => <code>{r.pairSlug}</code>,
                },
              ]}
              rows={(report.highestTrustRetentionConversions || []).map((r) => ({
                ...r,
                _key: r.pairSlug,
              }))}
              emptyLabel="None yet."
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Most durable compare-to-lead journeys</h3>
            <OpsTable
              columns={[
                {
                  key: "pair",
                  label: "Pair",
                  render: (r) => <code>{r.pairSlug}</code>,
                },
              ]}
              rows={(report.mostDurableCompareToLeadJourneys || []).map((r) => ({
                ...r,
                _key: r.pairSlug,
              }))}
              emptyLabel="None yet."
            />
          </div>

          <div style={adminCard}>
            <h3 style={{ marginTop: 0 }}>Ownership-guidance conversion quality</h3>
            <p style={{ fontSize: "0.85rem" }}>
              {report.ownershipGuidanceConversionQuality ?? "—"} · Persistence:{" "}
              {report.ownershipGuidanceConversionPersistence ?? "—"} · Weak trust before
              lead: {report.weakTrustPersistenceBeforeLead ?? "—"}
            </p>
          </div>

          <div style={adminCard}>

            <h3 style={{ marginTop: 0 }}>Weak CTA clarity hotspots</h3>

            <OpsTable

              columns={[

                {

                  key: "pair",

                  label: "Pair",

                  render: (r) => <code>{r.pairSlug}</code>,

                },

                {

                  key: "tooltips",

                  label: "Tooltips",

                  render: (r) => r.tooltips,

                },

              ]}

              rows={report.weakCtaClarityHotspots.map((r) => ({

                ...r,

                _key: r.pairSlug,

              }))}

              emptyLabel="None flagged."

            />

          </div>

        </>

      ) : null}

    </PostLaunchAdminShell>

  );

}

