import { Link } from "react-router-dom";

import ScoreCircle from "../common/ScoreCircle";
import VehicleImage from "../media/VehicleImage";
import { formatIndianPriceCompact } from "../../utils/formatIndianPrice";
import { vehicleDetailPath } from "../../utils/vehicleRoutes";
import {
  buildVehicleVariantDisplayName,
  preserveOemCasing,
} from "../../utils/vehicleDisplayName";
import "./compare-vehicle-card.css";

const COMPARE_SCORE_GAUGE_SIZE = 76;

function coerceDisplayString(value) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return "";
}

function resolveEvsavariScore(car) {
  const composite =
    car?.evSavariScores?.overall?.score ??
    car?.evScores?.composite ??
    car?.evIntelligence?.scores?.composite ??
    null;
  if (composite != null && Number.isFinite(Number(composite))) {
    return Math.round(Number(composite));
  }
  const catalog = car?.catalogMeta?.compareValueScore;
  if (catalog != null && Number.isFinite(Number(catalog))) {
    return Math.round(Number(catalog));
  }
  return null;
}

function resolveEvsavariGrade(car) {
  return (
    car?.evSavariScores?.overall?.grade ??
    car?.evScores?.grade ??
    null
  );
}

function formatGradeLabel(grade) {
  const value = coerceDisplayString(grade);
  if (!value) return null;
  return /^grade\b/i.test(value) ? value : `Grade ${value}`;
}

/**
 * Premium compare column card — compact layout with horizontal EVSavari score.
 * Sole renderer for /compare and /compare/:slug vehicle columns.
 */
export default function CompareVehicleCard({
  car,
  isRecommended = false,
  compareBadge = null,
  eagerImage = false,
  detailHref,
}) {
  const displayName = car ? buildVehicleVariantDisplayName(car) : "Unknown EV";

  const price = Number(car?.startingPrice ?? car?.price) || 0;
  const range =
    Number(car?.specifications?.range ?? car?.range) || 0;
  const battery = coerceDisplayString(
    car?.specifications?.batteryPack || car?.battery
  ) || "EV Battery";
  const score = car ? resolveEvsavariScore(car) : null;
  const gradeLabel = car ? formatGradeLabel(resolveEvsavariGrade(car)) : null;
  const href =
    car && (detailHref || vehicleDetailPath(car, car._id));

  const badgeLabel =
    compareBadge?.label ||
    (isRecommended ? "Recommended" : null);
  const badgeClass =
    compareBadge?.cssClass ||
    (isRecommended ? "compare-vehicle-card__badge--recommended" : null);

  if (!car || typeof car !== "object") return null;

  return (
    <article
      className={`compare-vehicle-card${
        badgeLabel ? " compare-vehicle-card--recommended" : ""
      }`}
      aria-label={displayName}
    >
      <div className="compare-vehicle-card__media">
        <VehicleImage
          car={car}
          role="compare"
          alt={displayName}
          responsive
          eager={eagerImage}
          imgClassName="compact-car-image"
          wrapperStyle={{
            position: "absolute",
            inset: 0,
            height: "100%",
            aspectRatio: "unset",
          }}
        />
        {badgeLabel ? (
          <span
            className={`compare-vehicle-card__badge${
              badgeClass ? ` ${badgeClass}` : ""
            }`}
          >
            {badgeLabel}
          </span>
        ) : null}
      </div>

      <div className="compare-vehicle-card__content">
        <div className="compare-vehicle-card__main">
          <h3 className="compare-vehicle-card__title">
            {preserveOemCasing(displayName) || "Unknown EV"}
          </h3>
          <p className="compare-vehicle-card__price">
            {formatIndianPriceCompact(price)}
          </p>

          <div className="compare-vehicle-card__specs">
            <span className="compare-vehicle-card__spec">⚡ {range} km</span>
            <span className="compare-vehicle-card__spec">🔋 {battery}</span>
          </div>
        </div>

        <div className="compare-vehicle-card__footer">
          {score != null ? (
            <div className="compare-vehicle-card__score-row">
              <span className="compare-vehicle-card__score-title">
                EVSavari Score
              </span>
              <div className="compare-vehicle-card__score-meta">
                <ScoreCircle
                  score={score}
                  size={COMPARE_SCORE_GAUGE_SIZE}
                  className="compare-vehicle-card__gauge"
                  valueClassName="compare-vehicle-card__gauge-value"
                  suffixClassName="compare-vehicle-card__gauge-suffix"
                />
                {gradeLabel ? (
                  <span className="compare-vehicle-card__grade">
                    {gradeLabel}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          <Link to={href} className="compare-vehicle-card__cta">
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}
