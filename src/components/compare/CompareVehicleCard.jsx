import { Link } from "react-router-dom";

import ScoreCircle from "../common/ScoreCircle";
import CompareScoreInsight from "./CompareScoreInsight";
import TrustDataStrip from "../trust/TrustDataStrip";
import VehicleImage from "../media/VehicleImage";
import {
  dedupeComparePills,
} from "../../utils/compareConfidence";
import {
  ensureArray,
  safeMap,
  safeSlice,
  safeFilter,
} from "../../utils/compareArrayUtils";
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

  const fromAdvantages = safeMap(
    meta.strongestAdvantages,
    (item) => {
      if (typeof item === "string") return item;
      return item?.label || item?.title || item?.id || "";
    },
    { label: "strongestAdvantages", subsystem: "compare-card" }
  ).filter(Boolean);

  if (fromAdvantages.length > 0) {
    return safeSlice(fromAdvantages, 0, 4, { subsystem: "compare-card" });
  }

  const pick = meta?.comparePicks?.strongestAdvantageLabel;
  if (pick) return [pick];

  const pros = ensureArray(meta?.pros, { label: "pros", subsystem: "compare-card" });
  if (pros.length > 0) {
    return safeSlice(pros, 0, 3, { subsystem: "compare-card" });
  }

  const explanations = ensureArray(car?.evScores?.explanations, {
    label: "evScores.explanations",
    subsystem: "compare-card",
  });
  if (explanations.length > 0) {
    return safeSlice(
      safeMap(explanations, (row) => row?.label || row?.text || "", {
        subsystem: "compare-card",
      }).filter(Boolean),
      0,
      3,
      { subsystem: "compare-card" }
    );
  }

  const fromSuitability = safeFilter(
    car?.evIntelligence?.suitability?.insights,
    (i) => i.level === "strong" || i.level === "good",
    { label: "suitability.insights", subsystem: "compare-card" }
  )
    .map((i) => i.title || i.shortLabel || i.id)
    .filter(Boolean);

  return safeSlice(fromSuitability, 0, 3, { subsystem: "compare-card" });
}

/**
 * Premium compare column card — circular EVSavari score + “This EV is better at” box.
 * Sole renderer for /compare and /compare/:slug vehicle columns.
 */
export default function CompareVehicleCard({
  car,
  isRecommended = false,
  compareBadge = null,
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
  const grade = car ? resolveEvsavariGrade(car) : null;
  const strength = resolveStrengthLabel(meta);
  const tradeoff = resolveTradeoffLabel(meta);
  const betterAtPills = car
    ? dedupeComparePills(resolveBetterAtPills(meta, car))
    : [];
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
        <h3 className="compare-vehicle-card__title">
          {preserveOemCasing(displayName) || "Unknown EV"}
        </h3>
        <p className="compare-vehicle-card__price">
          {formatIndianPriceCompact(price)}
        </p>

        <TrustDataStrip car={car} variant="compare" />

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
              <CompareScoreInsight car={car} />
              {grade ? (
                <span className="compare-vehicle-card__grade">{grade}</span>
              ) : null}
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
