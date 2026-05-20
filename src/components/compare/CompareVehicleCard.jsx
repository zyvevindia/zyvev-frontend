import { useEffect } from "react";
import { Link } from "react-router-dom";

import ScoreCircle from "../common/ScoreCircle";
import VehicleImage from "../media/VehicleImage";
import { formatIndianPriceCompact } from "../../utils/formatIndianPrice";
import { vehicleDetailPath } from "../../utils/vehicleRoutes";
import {
  resolveFullDisplayName,
  preserveOemCasing,
} from "../../utils/vehicleDisplayName";
import "./compare-vehicle-card.css";

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

function resolveStrengthLabel(meta) {
  if (!meta || typeof meta !== "object") return null;
  const picks = meta.comparePicks;
  const label =
    coerceDisplayString(picks?.strongestAdvantageLabel) ||
    coerceDisplayString(meta.strongestAdvantages?.[0]?.label) ||
    (typeof meta.strongestAdvantages?.[0] === "string"
      ? coerceDisplayString(meta.strongestAdvantages[0])
      : "");
  return label || null;
}

function resolveTradeoffLabel(meta) {
  if (!meta || typeof meta !== "object") return null;
  const picks = meta.comparePicks;
  const label =
    coerceDisplayString(picks?.biggestWeaknessLabel) ||
    coerceDisplayString(meta.compareNarrative?.tradeoffSummary) ||
    coerceDisplayString(meta.weakestAreas?.[0]?.label) ||
    (typeof meta.weakestAreas?.[0] === "string"
      ? coerceDisplayString(meta.weakestAreas[0])
      : "");
  return label || null;
}

function resolveBetterAtPills(meta, car) {
  if (!meta || typeof meta !== "object") return [];
  const fromAdvantages = (meta.strongestAdvantages || [])
    .map((item) => {
      if (typeof item === "string") return item;
      return item?.label || item?.title || item?.id || "";
    })
    .filter(Boolean);

  if (fromAdvantages.length > 0) {
    return fromAdvantages.slice(0, 4);
  }

  const pick = meta?.comparePicks?.strongestAdvantageLabel;
  if (pick) return [pick];

  const pros = meta?.pros;
  if (Array.isArray(pros) && pros.length > 0) {
    return pros.slice(0, 3);
  }

  const explanations = car?.evScores?.explanations;
  if (Array.isArray(explanations) && explanations.length > 0) {
    return explanations
      .map((row) => row?.label || row?.text || "")
      .filter(Boolean)
      .slice(0, 3);
  }

  const insights = car?.evIntelligence?.suitability?.insights || [];
  const fromSuitability = insights
    .filter((i) => i.level === "strong" || i.level === "good")
    .map((i) => i.title || i.shortLabel || i.id)
    .filter(Boolean);

  return fromSuitability.slice(0, 3);
}

/**
 * Premium compare column card — circular EVSavari score + “This EV is better at” box.
 * Sole renderer for /compare and /compare/:slug vehicle columns.
 */
export default function CompareVehicleCard({
  car,
  isRecommended = false,
  eagerImage = false,
  detailHref,
}) {
  const displayName = car
    ? coerceDisplayString(car.fullDisplayName) ||
      resolveFullDisplayName(car)
    : "Unknown EV";

  const meta =
    car && typeof car.catalogMeta === "object" && car.catalogMeta
      ? car.catalogMeta
      : {};
  const price = Number(car?.startingPrice ?? car?.price) || 0;
  const range =
    Number(car?.specifications?.range ?? car?.range) || 0;
  const battery = coerceDisplayString(
    car?.specifications?.batteryPack || car?.battery
  ) || "EV Battery";
  const score = car ? resolveEvsavariScore(car) : null;
  const strength = resolveStrengthLabel(meta);
  const tradeoff = resolveTradeoffLabel(meta);
  const betterAtPills = car ? resolveBetterAtPills(meta, car) : [];
  const href =
    car && (detailHref || vehicleDetailPath(car, car._id));

  useEffect(() => {
    console.log("COMPARE_RENDER", {
      vehicle: car,
      fullDisplayName: displayName,
      score,
    });
  }, [car, displayName, score]);

  if (!car || typeof car !== "object") return null;

  return (
    <article
      className={`compare-vehicle-card${
        isRecommended ? " compare-vehicle-card--recommended" : ""
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
        {isRecommended ? (
          <span className="compare-vehicle-card__badge compare-vehicle-card__badge--recommended">
            Recommended
          </span>
        ) : null}
      </div>

      <div className="compare-vehicle-card__content">
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

        <div className="compare-vehicle-card__insight-row">
          <div className="compare-vehicle-card__insights">
            {strength ? (
              <p className="compare-vehicle-card__line">
                <span className="compare-vehicle-card__line-label compare-vehicle-card__line-label--strength">
                  Strength
                </span>
                {": "}
                {strength}
              </p>
            ) : null}

            {tradeoff ? (
              <p className="compare-vehicle-card__line">
                <span className="compare-vehicle-card__line-label compare-vehicle-card__line-label--tradeoff">
                  Trade-off
                </span>
                {": "}
                {tradeoff}
              </p>
            ) : null}

            {betterAtPills.length > 0 ? (
              <div className="compare-vehicle-card__better-at">
                <p className="compare-vehicle-card__better-at-title">
                  This EV is better at
                </p>
                <div className="compare-vehicle-card__pills">
                  {betterAtPills.map((pill) => (
                    <span key={pill} className="compare-vehicle-card__pill">
                      <span
                        className="compare-vehicle-card__pill-icon"
                        aria-hidden
                      >
                        ✓
                      </span>
                      {pill}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {score != null ? (
            <div className="compare-vehicle-card__score-col">
              <p className="compare-vehicle-card__score-label">
                EVSavari Score
              </p>
              <ScoreCircle
                score={score}
                size={120}
                className="compare-vehicle-card__gauge"
                valueClassName="compare-vehicle-card__gauge-value"
                suffixClassName="compare-vehicle-card__gauge-suffix"
              />
            </div>
          ) : null}
        </div>

        <Link to={href} className="compare-vehicle-card__cta">
          View Details
        </Link>
      </div>
    </article>
  );
}
