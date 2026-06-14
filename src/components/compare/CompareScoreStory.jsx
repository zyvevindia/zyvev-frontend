import CompareScoreComparison from "./CompareScoreComparison";
import { buildVehicleVariantDisplayName } from "../../utils/vehicleDisplayName";
import { COMPARE_BADGE_TYPES } from "../../utils/compareScoreBadges";

import "./compare-score-story.css";

function carKey(car) {
  return car?._id || car?.slug || null;
}

function resolveOverall(car) {
  const scores = car?.evSavariScores;
  return {
    score:
      scores?.overall?.score ??
      car?.evScores?.composite ??
      null,
    grade: scores?.overall?.grade ?? car?.evScores?.grade ?? null,
    strengths: scores?.explanation?.strengths ?? [],
    weaknesses: scores?.explanation?.weaknesses ?? [],
  };
}

function resolveExtraBadges(key, badgeMeta) {
  const badges = [];
  if (key === badgeMeta.bestValueId) {
    badges.push(COMPARE_BADGE_TYPES.bestValue);
  }
  if (key === badgeMeta.longRangeId) {
    badges.push(COMPARE_BADGE_TYPES.longRange);
  }
  if (key === badgeMeta.fastChargingId) {
    badges.push(COMPARE_BADGE_TYPES.fastCharging);
  }
  if (key === badgeMeta.recommendedId) {
    badges.push(COMPARE_BADGE_TYPES.recommended);
  }
  return badges;
}

/**
 * Primary score narrative — above specification tables on compare pages.
 */
export default function CompareScoreStory({
  cars = [],
  recommendedId = null,
  bestValueId = null,
  longRangeId = null,
  fastChargingId = null,
}) {
  const list = (cars || []).filter(Boolean);
  if (list.length < 2) return null;

  const hasAnyScore = list.some(
    (car) => resolveOverall(car).score != null
  );
  if (!hasAnyScore) return null;

  const badgeMeta = {
    recommendedId,
    bestValueId,
    longRangeId,
    fastChargingId,
  };

  return (
    <section
      className="compare-score-story"
      aria-labelledby="compare-score-story-title"
    >
      <header className="compare-score-story__header">
        <h2 id="compare-score-story-title" className="compare-score-story__title">
          EVSavari score comparison
        </h2>
        <p className="compare-score-story__intro">
          Standout strengths, trade-offs, and dimension scores — before you dive
          into full specifications.
        </p>
      </header>

      <div className="compare-score-story__grid">
        {list.map((car) => {
          const key = carKey(car);
          const { strengths, weaknesses } = resolveOverall(car);
          const extraBadges = resolveExtraBadges(key, badgeMeta);
          const topStrengths = strengths.slice(0, 2);
          const topWeaknesses = weaknesses.slice(0, 2);

          return (
            <article
              key={car._id || car.slug}
              className={`compare-score-story__card${
                key === recommendedId
                  ? " compare-score-story__card--recommended"
                  : ""
              }`}
            >
              <h3 className="compare-score-story__name">
                {buildVehicleVariantDisplayName(car)}
              </h3>

              {extraBadges.length > 0 ? (
                <ul
                  className="compare-score-story__badges"
                  aria-label="Score highlights"
                >
                  {extraBadges.map((badge) => (
                    <li key={badge.label}>
                      <span
                        className={`compare-score-story__badge compare-score-story__badge--${badge.type}`}
                      >
                        {badge.label}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {topStrengths.length > 0 ? (
                <div className="compare-score-story__list-block">
                  <h4 className="compare-score-story__list-title">
                    Strengths
                  </h4>
                  <ul className="compare-score-story__list compare-score-story__list--strengths">
                    {topStrengths.map((item) => (
                      <li key={item.dimension || item.label}>
                        <strong>{item.label}</strong>
                        {item.reason ? (
                          <span className="compare-score-story__list-detail">
                            {" "}
                            — {item.reason}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {topWeaknesses.length > 0 ? (
                <div className="compare-score-story__list-block">
                  <h4 className="compare-score-story__list-title">
                    Weaknesses
                  </h4>
                  <ul className="compare-score-story__list compare-score-story__list--weaknesses">
                    {topWeaknesses.map((item) => (
                      <li key={item.dimension || item.label}>
                        <strong>{item.label}</strong>
                        {item.reason ? (
                          <span className="compare-score-story__list-detail">
                            {" "}
                            — {item.reason}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <CompareScoreComparison cars={list} compact title="Score by dimension" />
    </section>
  );
}
