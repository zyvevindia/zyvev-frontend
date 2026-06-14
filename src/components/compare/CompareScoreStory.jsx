import CompareScoreComparison from "./CompareScoreComparison";
import ScoreStrengthsWeaknesses from "../scoring/ScoreStrengthsWeaknesses";
import RecommendationInsightsCard from "../scoring/RecommendationInsightsCard";
import PersonaChips from "../scoring/PersonaChips";
import OwnershipIntelligenceCard from "../scoring/OwnershipIntelligenceCard";
import ChargingIntelligenceCard from "../scoring/ChargingIntelligenceCard";
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
          const extraBadges = resolveExtraBadges(key, badgeMeta);

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

              <ScoreStrengthsWeaknesses
                vehicle={car}
                variant="compact"
                layout="inline"
              />

              <RecommendationInsightsCard
                vehicle={car}
                variant="compact"
                layout="inline"
              />

              <PersonaChips vehicle={car} variant="compact" layout="inline" />

              <OwnershipIntelligenceCard
                vehicle={car}
                variant="compact"
                layout="inline"
              />

              <ChargingIntelligenceCard
                vehicle={car}
                variant="compact"
                layout="inline"
              />
            </article>
          );
        })}
      </div>

      <CompareScoreComparison cars={list} compact title="Score by dimension" />
    </section>
  );
}
