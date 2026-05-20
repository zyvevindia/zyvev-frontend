/**
 * Below-the-fold compare panels — loaded async to reduce main-thread work
 * on initial compare paint (LCP/TTI friendly). Parent passes stable car lists.
 */
import CompareAdvantageSummary from "./CompareAdvantageSummary";
import CompareTrustSummary from "./CompareTrustSummary";
import CompareScenarioPanel from "./CompareScenarioPanel";

export default function CompareBelowFoldSections({ cars, intelligentCars }) {
  return (
    <>
      <CompareAdvantageSummary cars={intelligentCars} />
      <CompareTrustSummary cars={intelligentCars} />
      <div className="compare-scenario-panel">
        <CompareScenarioPanel cars={cars} />
      </div>
    </>
  );
}
