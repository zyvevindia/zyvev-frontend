import { OpsTable, adminCard } from "./PostLaunchAdminShell";

/**
 * Shared weekly summary block — used on public-beta, trust-feedback, behavioral admin.
 */
export default function BetaWeeklySummarySection({
  summary,
  title = "Beta weekly summary",
  compact = false,
}) {
  if (!summary) return null;

  return (
    <div style={{ ...adminCard, marginTop: compact ? 0 : 16 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0 0 12px" }}>
        Week {summary.week} · Completion {summary.compareCompletionTrend}% · Trust{" "}
        {summary.trustStabilityTrend} · Guidance opens{" "}
        {summary.mostOpenedTrustGuidance?.total ?? 0}
      </p>

      {!compact ? (
        <>
          <h4 style={{ fontSize: "0.85rem" }}>Top compare journeys</h4>
          <OpsTable
            columns={[
              {
                key: "pair",
                label: "Pair",
                render: (r) => <code>{r.pairSlug}</code>,
              },
              { key: "s", label: "Started", render: (r) => r.started },
              { key: "c", label: "Done", render: (r) => r.completed },
              { key: "d", label: "Doubt", render: (r) => r.doubted ?? 0 },
            ]}
            rows={(summary.topCompareJourneys || []).map((r) => ({
              ...r,
              _key: r.pairSlug,
            }))}
            emptyLabel="No compare journeys in buffer."
          />

          <h4 style={{ fontSize: "0.85rem", marginTop: 16 }}>
            Most confusing vs most trusted pairs
          </h4>
          <p style={{ fontSize: "0.8rem" }}>
            Confusing:{" "}
            {(summary.mostConfusingComparePairs || [])
              .map((p) => p.pairSlug || p)
              .join(", ") || "—"}
          </p>
          <p style={{ fontSize: "0.8rem" }}>
            Trusted:{" "}
            {(summary.mostTrustedComparePairs || [])
              .map((p) => p.pairSlug)
              .join(", ") || "—"}
          </p>

          <h4 style={{ fontSize: "0.85rem", marginTop: 12 }}>
            Ownership & charging extremes
          </h4>
          <p style={{ fontSize: "0.8rem" }}>
            Highest ownership confidence:{" "}
            {(summary.highestOwnershipConfidenceEvs || [])
              .slice(0, 3)
              .map((e) => `${e.name || e.slug} (${e.score})`)
              .join(" · ") || "—"}
          </p>
          <p style={{ fontSize: "0.8rem" }}>
            Weakest charging practicality:{" "}
            {(summary.weakestChargingPracticalityJourneys || [])
              .slice(0, 3)
              .map((e) => e.name || e.slug)
              .join(" · ") || "—"}
          </p>
        </>
      ) : null}
    </div>
  );
}
