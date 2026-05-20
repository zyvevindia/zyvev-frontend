import UsefulnessFeedback from "../feedback/UsefulnessFeedback";

/**
 * Compare page utility strip — methodology, usefulness vote, data report.
 * Placed after Detailed Specifications, before real-world comparison blocks.
 */
export default function CompareUtilityRail({
  recommendationLogic = null,
  sourcePage = "",
  metadata = {},
  usefulnessLabel = "Was this useful?",
}) {
  const methodology = recommendationLogic?.methodology;

  return (
    <div className="compare-utility-rail" aria-label="Comparison feedback and methodology">
      {methodology ? (
        <div className="compare-utility-rail__methodology">
          <p className="compare-utility-rail__methodology-text">
            <strong>How we rank:</strong> {methodology}
          </p>
        </div>
      ) : null}

      <UsefulnessFeedback
        context="compare"
        sourcePage={sourcePage}
        metadata={metadata}
        label={usefulnessLabel}
      />
    </div>
  );
}
