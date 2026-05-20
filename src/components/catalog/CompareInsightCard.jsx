/**
 * Per-vehicle compare intelligence — embedded compact block inside compare cards.
 */

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
  const tradeoff = narrative?.tradeoffSummary || weak;

  return (
    <div className="compare-insight">
      {meta.compareValueScore != null && (
        <div className="compare-insight__score-row">
          <span className="compare-insight__score-label">Value score</span>
          <span className="compare-insight__score-value">
            {meta.compareValueScore}/100
          </span>
        </div>
      )}

      {adv && (
        <p className="compare-insight__line">
          <span className="compare-insight__tag compare-insight__tag--strength">
            Strength
          </span>
          {": "}
          {adv}
        </p>
      )}

      {tradeoff && (
        <p className="compare-insight__line">
          <span className="compare-insight__tag compare-insight__tag--tradeoff">
            Trade-off
          </span>
          {": "}
          {tradeoff}
        </p>
      )}

      {(picks?.bestValuePick || picks?.bestLongTermOwnershipPick) && (
        <p className="compare-insight__picks">
          {picks.bestValuePick && <span>★ Best value · </span>}
          {picks.bestLongTermOwnershipPick && (
            <span>★ Strong ownership</span>
          )}
        </p>
      )}
    </div>
  );
}
