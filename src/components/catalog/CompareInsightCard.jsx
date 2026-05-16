/**
 * Per-vehicle compare intelligence (catalogMeta).
 */

const wrap = {
  marginTop: "12px",
  padding: "14px 16px",
  borderRadius: "14px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  fontSize: "13px",
  lineHeight: 1.55,
  color: "#334155",
};

const label = {
  fontWeight: "700",
  color: "#0f172a",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: "6px",
};

export default function CompareInsightCard({ car }) {
  const meta = car?.catalogMeta;
  if (!meta) return null;

  const picks = meta.comparePicks;

  const hasCompare =
    meta.compareValueScore != null ||
    meta.strongestAdvantages?.length ||
    meta.weakestAreas?.length ||
    picks?.strongestAdvantageLabel ||
    picks?.biggestWeaknessLabel;

  if (!hasCompare) return null;

  const adv =
    picks?.strongestAdvantageLabel ||
    meta.strongestAdvantages?.[0]?.label ||
    meta.strongestAdvantages?.[0];

  const weak =
    picks?.biggestWeaknessLabel ||
    meta.weakestAreas?.[0]?.label ||
    meta.weakestAreas?.[0];

  const narrative = meta.compareNarrative;

  return (
    <div style={wrap}>
      {meta.compareValueScore != null && (
        <p style={{ margin: "0 0 10px 0" }}>
          <span style={label}>Value score</span>
          <br />
          <strong style={{ color: "#1d4ed8", fontSize: "15px" }}>
            {meta.compareValueScore}/100
          </strong>
          {" "}
          in {meta.segment?.replace(/-/g, " ") || "segment"}
        </p>
      )}

      {adv && (
        <p style={{ margin: "0 0 8px 0" }}>
          <span style={{ color: "#047857", fontWeight: "700" }}>
            Strength:
          </span>{" "}
          {adv}
        </p>
      )}

      {(narrative?.tradeoffSummary || weak) && (
        <p style={{ margin: "0 0 8px 0" }}>
          <span style={{ color: "#b45309", fontWeight: "700" }}>
            Trade-off:
          </span>{" "}
          {narrative?.tradeoffSummary || weak}
        </p>
      )}

      {narrative?.betterAlignedReason && (
        <p style={{ margin: "0 0 8px 0", fontSize: "12px" }}>
          {narrative.betterAlignedReason}
        </p>
      )}

      {(picks?.bestValuePick ||
        picks?.bestLongTermOwnershipPick) && (
        <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
          {picks.bestValuePick && (
            <span style={{ marginRight: "10px" }}>
              ★ Best value in set
            </span>
          )}
          {picks.bestLongTermOwnershipPick && (
            <span>★ Strong long-term ownership</span>
          )}
        </p>
      )}

      {meta.compareRivals?.length > 0 && (
        <p
          style={{
            margin: "10px 0 0",
            fontSize: "12px",
            color: "#64748b",
          }}
        >
          Segment peers on EVSavari
        </p>
      )}
    </div>
  );
}
