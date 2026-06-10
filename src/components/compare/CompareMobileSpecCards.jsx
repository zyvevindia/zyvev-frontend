import ScoreCircle from "../common/ScoreCircle";
import { formatIndianPriceCompact } from "../../utils/formatIndianPrice";
import { resolveFullDisplayName } from "../../utils/vehicleDisplayName";
import { formatCompareCellValue } from "../../intelligence/compareSpecRows";
import { formatChargingDurationDisplay } from "../../utils/formatChargingDuration";

function carKey(car) {
  return car?._id || car?.slug || null;
}

function resolveScore(car) {
  const score =
    car?.evSavariScores?.overall?.score ??
    car?.evScores?.composite ??
    null;
  return score != null && Number.isFinite(Number(score))
    ? Math.round(Number(score))
    : null;
}

function resolveGrade(car) {
  return (
    car?.evSavariScores?.overall?.grade ?? car?.evScores?.grade ?? null
  );
}

function resolveCharging(car) {
  const intel = car?.evIntelligence?.charging;
  if (intel?.dcFastChargingTime) {
    return formatChargingDurationDisplay(intel.dcFastChargingTime);
  }
  const ac = car?.specifications?.chargingTime;
  if (ac && ac !== "N/A") return ac;
  if (intel?.speedCategoryLabel) return intel.speedCategoryLabel;
  return "—";
}

function resolveBattery(car) {
  return (
    car?.specifications?.batteryPack ||
    car?.battery ||
    "EV Battery"
  );
}

function resolveRange(car) {
  const intel = car?.evIntelligence?.range?.claimedRangeKm;
  const range =
    intel ??
    car?.specifications?.range ??
    car?.range ??
    null;
  return range != null ? `${range} km` : "—";
}

/**
 * Mobile-first horizontal swipe cards — key specs per vehicle.
 * Desktop spec table remains unchanged (hidden via CSS below 769px).
 */
export default function CompareMobileSpecCards({
  cars = [],
  allBadgesByCarId = new Map(),
  recommendedId = null,
  priceRow = null,
}) {
  const list = (cars || []).filter(Boolean);
  if (list.length < 2) return null;

  return (
    <section
      className="compare-mobile-spec"
      aria-labelledby="compare-mobile-spec-title"
    >
      <div className="compare-mobile-spec__header">
        <h2 id="compare-mobile-spec-title" className="compare-mobile-spec__title">
          Compare at a glance
        </h2>
        <p className="compare-mobile-spec__hint">
          Swipe to compare each EV
        </p>
      </div>

      <div
        className="compare-mobile-spec__track"
        role="region"
        aria-label="Compare specifications by vehicle"
        tabIndex={0}
      >
        {list.map((car) => {
          const key = carKey(car);
          const badges = allBadgesByCarId.get(key) || [];
          const score = resolveScore(car);
          const grade = resolveGrade(car);
          const isRecommended = key === recommendedId;
          const price =
            priceRow != null
              ? formatCompareCellValue(priceRow.getRaw(car), priceRow)
              : formatIndianPriceCompact(
                  Number(car.startingPrice ?? car.price) || 0
                );

          return (
            <article
              key={car._id || car.slug}
              className={`compare-mobile-spec__card${
                isRecommended ? " compare-mobile-spec__card--recommended" : ""
              }`}
              aria-label={`${resolveFullDisplayName(car)} specifications`}
            >
              <header className="compare-mobile-spec__card-head">
                <h3 className="compare-mobile-spec__name">
                  {resolveFullDisplayName(car)}
                </h3>
                {badges.length > 0 ? (
                  <div className="compare-mobile-spec__badges">
                    {badges.map((badge) => (
                      <span
                        key={badge.type}
                        className={`compare-mobile-spec__badge compare-mobile-spec__badge--${badge.type}`}
                      >
                        {badge.label}
                      </span>
                    ))}
                  </div>
                ) : null}
              </header>

              {score != null ? (
                <div className="compare-mobile-spec__score-row">
                  <ScoreCircle
                    score={score}
                    size={72}
                    className="compare-mobile-spec__gauge"
                    valueClassName="compare-mobile-spec__gauge-value"
                    suffixClassName="compare-mobile-spec__gauge-suffix"
                  />
                  <div className="compare-mobile-spec__score-meta">
                    <span className="compare-mobile-spec__score-label">
                      EVSavari Score
                    </span>
                    {grade ? (
                      <span className="compare-mobile-spec__grade">
                        Grade {grade}
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <dl className="compare-mobile-spec__specs">
                <div className="compare-mobile-spec__spec-row">
                  <dt>Price</dt>
                  <dd>{price}</dd>
                </div>
                <div className="compare-mobile-spec__spec-row">
                  <dt>Battery</dt>
                  <dd>{resolveBattery(car)}</dd>
                </div>
                <div className="compare-mobile-spec__spec-row">
                  <dt>Range</dt>
                  <dd>{resolveRange(car)}</dd>
                </div>
                <div className="compare-mobile-spec__spec-row">
                  <dt>Charging</dt>
                  <dd>{resolveCharging(car)}</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>
    </section>
  );
}
