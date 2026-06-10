import { buildCompareScoreInsight } from "../../utils/compareConfidence";
import {
  buildWhyRecommendedSummary,
  buildOwnershipCaveat,
  buildDrivingContextNote,
  buildEstimatedVerifiedNuance,
  buildChargingPracticalityNuance,
  buildCompareSuitabilityLines,
  buildOwnershipRealismCaveats,
} from "../../utils/compareTrustCopy";
import OwnershipGuidanceStrip from "../trust/OwnershipGuidanceStrip";
import CompareRecommendationDoubt from "./CompareRecommendationDoubt";
import { trackCompareConfidenceExpanded } from "../../analytics/funnel";
import { useState } from "react";

const box = {
  fontSize: "0.85rem",
  color: "#475569",
  lineHeight: 1.55,
  margin: "0 0 12px",
  padding: "10px 14px",
  background: "#fffbeb",
  border: "1px solid #fde68a",
  borderRadius: 8,
};

/**
 * “Why recommended?” — concise trust explainability for compare hub/guide.
 */
export default function CompareTrustExplain({
  cars = [],
  recommendedSlug = null,
}) {
  const [guidanceOpened, setGuidanceOpened] = useState(false);

  const safeCars = cars ?? [];
  if (!safeCars.length) return null;

  const recommended = recommendedSlug
    ? safeCars.find((c) => c?.slug === recommendedSlug) || safeCars[0]
    : safeCars[0];

  const insight = buildCompareScoreInsight(recommended);
  const whyRecommended = buildWhyRecommendedSummary(recommended, safeCars);
  const ownershipCaveat = buildOwnershipCaveat(recommended);
  const drivingNote = buildDrivingContextNote(safeCars);
  const suitabilityLines = buildCompareSuitabilityLines(safeCars);
  const realismCaveats = buildOwnershipRealismCaveats(recommended);

  return (
    <aside style={box} aria-label="Why this EV is highlighted">
      <strong style={{ color: "#92400e" }}>Why recommended?</strong>{" "}
      {whyRecommended}
      {drivingNote ? (
        <span style={{ display: "block", marginTop: 6, fontSize: "0.8rem" }}>
          {drivingNote}
        </span>
      ) : null}
      <span style={{ display: "block", marginTop: 6, fontSize: "0.8rem" }}>
        {buildChargingPracticalityNuance(recommended)}
      </span>
      <span style={{ display: "block", marginTop: 6, fontSize: "0.8rem" }}>
        {ownershipCaveat}
      </span>
      <span style={{ display: "block", marginTop: 6, fontSize: "0.8rem" }}>
        {buildEstimatedVerifiedNuance(recommended)}
      </span>
      {suitabilityLines.length > 0 ? (
        <span style={{ display: "block", marginTop: 6, fontSize: "0.8rem" }}>
          {suitabilityLines.join(" · ")}
        </span>
      ) : null}
      {realismCaveats.length > 0 ? (
        <span style={{ display: "block", marginTop: 6, fontSize: "0.8rem" }}>
          {realismCaveats.join(" · ")}
        </span>
      ) : null}
      {insight.confidence !== "high" ? (
        <span style={{ display: "block", marginTop: 6, fontSize: "0.8rem" }}>
          {insight.estimatedLabel || "Directional estimate"} — verified specs
          raise confidence. Not a guaranteed outcome.
        </span>
      ) : null}
      <OwnershipGuidanceStrip
        car={recommended}
        variant="compare"
        onExpand={() => {
          setGuidanceOpened(true);
          trackCompareConfidenceExpanded({
            vehicleSlugs: safeCars.map((c) => c?.slug).filter(Boolean),
            sourcePage:
              typeof window !== "undefined" ? window.location.pathname : "",
          });
        }}
      />
      <CompareRecommendationDoubt
        cars={safeCars}
        recommendedSlug={recommended?.slug}
        guidanceWasOpened={guidanceOpened}
      />
    </aside>
  );
}
