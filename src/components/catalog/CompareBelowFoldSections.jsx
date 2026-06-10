/**
 * Below-the-fold compare panels — loaded async to reduce main-thread work
 * on initial compare paint (LCP/TTI friendly). Parent passes stable car lists.
 */
import CompareAdvantageSummary from "./CompareAdvantageSummary";
import CompareTrustSummary from "./CompareTrustSummary";
import CompareScenarioPanel from "./CompareScenarioPanel";
import CompareScoreComparison from "../compare/CompareScoreComparison";

export default function CompareBelowFoldSections({
  cars,
  intelligentCars,
  guideMode = false,
}) {
  return (
    <>
      {!guideMode ? (
        <>
          <CompareAdvantageSummary cars={intelligentCars} />
          <CompareScoreComparison cars={intelligentCars} />
        </>
      ) : null}
      <CompareTrustSummary cars={intelligentCars} />
      {!guideMode ? (
        <div className="compare-scenario-panel">
          <CompareScenarioPanel cars={cars} />
        </div>
      ) : null}
    </>
  );
}
