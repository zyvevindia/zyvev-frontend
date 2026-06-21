import { useMemo } from "react";

import { useNavigate } from "react-router-dom";

import { buildPeopleAlsoCompare } from "../../intelligence/buildPeopleAlsoCompare.js";
import { buildSimilarEvs } from "../../intelligence/buildSimilarEvs.js";
import PeopleAlsoCompareSection from "../car/PeopleAlsoCompareSection.jsx";
import SimilarEvsSection from "../car/SimilarEvsSection.jsx";

/**
 * @param {{ vehicle?: object|null }} props
 */
export default function ReviewAlternativesSection({ vehicle = null }) {
  const navigate = useNavigate();

  const peopleAlsoCompare = useMemo(
    () => (vehicle ? buildPeopleAlsoCompare(vehicle) : { comparisons: [] }),
    [vehicle]
  );

  const similarEvs = useMemo(() => {
    if (!vehicle) {
      return { similarVehicles: [] };
    }

    return buildSimilarEvs(vehicle, {
      excludeSlugs: peopleAlsoCompare.comparisons.map((item) => item.slug),
    });
  }, [vehicle, peopleAlsoCompare]);

  const hasComparisons = peopleAlsoCompare.comparisons.length > 0;
  const hasSimilar = similarEvs.similarVehicles.length > 0;

  if (!hasComparisons && !hasSimilar) {
    return null;
  }

  return (
    <section className="review-page__alternatives" aria-label="Related EVs">
      {hasSimilar ? (
        <SimilarEvsSection similarVehicles={similarEvs.similarVehicles} />
      ) : null}
      {hasComparisons ? (
        <PeopleAlsoCompareSection
          currentVehicle={vehicle}
          comparisons={peopleAlsoCompare.comparisons}
          navigate={navigate}
        />
      ) : null}
    </section>
  );
}
