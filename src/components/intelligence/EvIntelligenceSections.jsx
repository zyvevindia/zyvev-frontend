import { useEffect, useMemo, useRef } from "react";

import {
  buildVehicleIntelligence,
} from "../../intelligence/buildVehicleIntelligence";
import {
  formatIntelligenceValue,
  isPresent,
} from "../../intelligence/governance";
import {
  formatRangeConfidenceLabel,
  formatRangeBand,
} from "../../intelligence/rangeConfidence";
import TrustTransparencyPanel from "../trust/TrustTransparencyPanel";
import { SUITABILITY_LEVEL } from "../../intelligence/suitabilityInsights";
import {
  trackChargingGuideOpened,
  trackChargingPracticalityViewed,
  trackFeatureComparisonViewed,
  trackOwnershipGuideOpened,
} from "../../analytics/funnel";
import "../../styles/ev-trust.css";

import "../../styles/ev-intelligence.css";

const LEVEL_CLASS = {
  [SUITABILITY_LEVEL.STRONG]: "ev-intel-level--strong",
  [SUITABILITY_LEVEL.GOOD]: "ev-intel-level--good",
  [SUITABILITY_LEVEL.MODERATE]: "ev-intel-level--moderate",
  [SUITABILITY_LEVEL.LIMITED]: "ev-intel-level--limited",
};

function GridItem({ label, value, estimated = false }) {
  if (!isPresent(value)) return null;
  return (
    <div className="ev-intel-grid__item">
      <dt>{label}</dt>
      <dd>
        {value}
        {estimated ? <span className="ev-intel-est">Est.</span> : null}
      </dd>
    </div>
  );
}

function useSectionViewOnce(ref, onView) {
  const fired = useRef(false);
  useEffect(() => {
    if (!ref.current || fired.current) return;
    const el = ref.current;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !fired.current) {
          fired.current = true;
          onView();
        }
      },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [onView]);
}

export default function EvIntelligenceSections({
  car,
  slug = "",
  layout = "v2",
  sections = [
    "trust",
    "range",
    "charging",
    "ownership",
    "features",
    "suitability",
  ],
}) {
  const intelligence = useMemo(
    () => buildVehicleIntelligence(car),
    [car]
  );

  const chargingRef = useRef(null);
  const practicalityRef = useRef(null);
  const ownershipRef = useRef(null);
  const featuresRef = useRef(null);

  useSectionViewOnce(chargingRef, () =>
    trackChargingGuideOpened({ familySlug: slug, sourcePage: "car_detail" })
  );
  useSectionViewOnce(practicalityRef, () =>
    trackChargingPracticalityViewed({
      familySlug: slug,
      sourcePage: "car_detail",
    })
  );
  useSectionViewOnce(ownershipRef, () =>
    trackOwnershipGuideOpened({ familySlug: slug, sourcePage: "car_detail" })
  );
  useSectionViewOnce(featuresRef, () =>
    trackFeatureComparisonViewed({ familySlug: slug, sourcePage: "car_detail" })
  );

  if (!intelligence) return null;

  const {
    charging,
    chargingPracticality,
    ownership,
    range,
    features,
    suitability,
    trust,
    curation,
  } = intelligence;

  const show = (key) => sections.includes(key);
  const cardClass =
    layout === "v2"
      ? "cd-section cd-card cd-content-card ev-intel-section"
      : "ev-intel-section";

  const chargingItems = [];
  if (isPresent(charging.dcFastChargingTime)) {
    chargingItems.push({
      label: "DC fast charge",
      value: charging.dcFastChargingTime,
    });
  }
  if (isPresent(charging.acChargingTime)) {
    chargingItems.push({
      label: "AC charging",
      value: charging.acChargingTime,
    });
  }
  if (isPresent(charging.connectorType)) {
    chargingItems.push({
      label: "Connector",
      value: charging.connectorType,
    });
  }
  if (isPresent(charging.speedCategoryLabel)) {
    chargingItems.push({
      label: "Speed category",
      value: charging.speedCategoryLabel,
    });
  }
  if (charging.homeChargingSupported === true) {
    chargingItems.push({
      label: "Home charging",
      value: "Supported",
    });
  }
  if (charging.portableChargerIncluded === true) {
    chargingItems.push({
      label: "Portable charger",
      value: "Included",
    });
  }

  return (
    <div className="ev-intel-wrap">
      {show("trust") && trust && (
        <TrustTransparencyPanel
          trust={trust}
          range={range}
          ownership={ownership}
          curation={curation}
          sourcePage="car_detail"
          familySlug={slug}
        />
      )}

      {show("range") && range.hasData && (
        <section
          className={cardClass}
          id="detail-range-confidence"
          aria-labelledby="ev-range-confidence-title"
        >
          <h2
            id="ev-range-confidence-title"
            className="cd-section__title"
          >
            Range confidence
          </h2>
          <p className="cd-section__intro ev-intel-muted">
            {range.confidenceExplanation || range.explanation}
          </p>
          <div className="ev-intel-range-row">
            {isPresent(range.claimedRangeKm) && (
              <div className="ev-intel-range-chip">
                <span className="ev-intel-range-chip__label">
                  Claimed (ARAI)
                </span>
                <span className="ev-intel-range-chip__value">
                  {range.claimedRangeKm} km
                </span>
              </div>
            )}
            {range.estimatedRealWorldKm && (
              <div className="ev-intel-range-chip ev-intel-range-chip--estimate">
                <span className="ev-intel-range-chip__label">
                  Est. real-world
                </span>
                <span className="ev-intel-range-chip__value">
                  {range.estimatedRealWorldKm.min}–
                  {range.estimatedRealWorldKm.max} km
                </span>
              </div>
            )}
            <div className="ev-intel-range-chip ev-intel-range-chip--confidence">
              <span className="ev-intel-range-chip__label">Confidence</span>
              <span className="ev-intel-range-chip__value">
                {formatRangeConfidenceLabel(range)}
              </span>
            </div>
          </div>
          {(range.cityRangeKm || range.highwayRangeKm) && (
            <div className="ev-range-usage-grid">
              {range.cityRangeKm && (
                <div className="ev-intel-range-chip">
                  <span className="ev-intel-range-chip__label">
                    Est. city
                  </span>
                  <span className="ev-intel-range-chip__value">
                    {formatRangeBand(range.cityRangeKm)}
                  </span>
                </div>
              )}
              {range.highwayRangeKm && (
                <div className="ev-intel-range-chip">
                  <span className="ev-intel-range-chip__label">
                    Est. highway
                  </span>
                  <span className="ev-intel-range-chip__value">
                    {formatRangeBand(range.highwayRangeKm)}
                  </span>
                </div>
              )}
            </div>
          )}
          {range.highwayNote && (
            <p className="ev-intel-footnote">{range.highwayNote}</p>
          )}
          {range.seasonalNotes?.length > 0 && (
            <ul className="ev-intel-bullets">
              {range.seasonalNotes.slice(0, 3).map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {show("charging") && charging.hasData && (
        <section
          ref={chargingRef}
          className={cardClass}
          id="detail-charging-intelligence"
          aria-labelledby="ev-charging-intel-title"
        >
          <h2
            id="ev-charging-intel-title"
            className="cd-section__title"
          >
            Charging intelligence
          </h2>
          <p className="cd-section__intro ev-intel-muted">
            Structured charging specs and convenience signals for Indian
            buyers.
          </p>
          <dl className="ev-intel-grid">
            {chargingItems.map((item) => (
              <GridItem
                key={item.label}
                label={item.label}
                value={item.value}
              />
            ))}
            {isPresent(charging.convenienceScore) && (
              <GridItem
                label="Convenience score"
                value={`${charging.convenienceScore}/100`}
                estimated
              />
            )}
          </dl>
          {charging.summaryLines?.length > 0 && (
            <ul className="ev-intel-bullets">
              {charging.summaryLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {chargingPracticality?.hasData && (
        <section
          ref={practicalityRef}
          className={cardClass}
          aria-labelledby="ev-charging-practicality-title"
        >
          <h2
            id="ev-charging-practicality-title"
            className="cd-section__title"
          >
            Charging practicality
          </h2>
          <ul className="ev-intel-bullets">
            {chargingPracticality.summaryLines?.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {chargingPracticality.convenienceLevelLabel && (
            <p className="ev-intel-footnote">
              {chargingPracticality.convenienceLevelLabel}
            </p>
          )}
        </section>
      )}

      {show("ownership") && ownership.hasData && (
        <section
          ref={ownershipRef}
          className={cardClass}
          id="detail-ownership-intelligence"
          aria-labelledby="ev-ownership-intel-title"
        >
          <h2
            id="ev-ownership-intel-title"
            className="cd-section__title"
          >
            Ownership intelligence
          </h2>
          <p className="cd-section__intro ev-intel-muted">
            {ownership.assumptions?.note}
          </p>
          <dl className="ev-intel-grid">
            <GridItem
              label="Est. monthly charging"
              value={`₹${formatIntelligenceValue(ownership.monthlyChargingCostInr).display}`}
              estimated
            />
            <GridItem
              label="Est. yearly charging"
              value={`₹${formatIntelligenceValue(ownership.yearlyChargingCostInr).display}`}
              estimated
            />
            <GridItem
              label="Est. savings vs petrol / yr"
              value={`₹${formatIntelligenceValue(ownership.savingsVsPetrolYearlyInr).display}`}
              estimated
            />
            {ownership.batteryWarranty?.available && (
              <GridItem
                label="Battery warranty"
                value={[
                  ownership.batteryWarranty.years &&
                    `${ownership.batteryWarranty.years} yr`,
                  ownership.batteryWarranty.km &&
                    `${Number(ownership.batteryWarranty.km).toLocaleString("en-IN")} km`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              />
            )}
            <GridItem
              label="Service interval"
              value={`${ownership.serviceInterval.km?.toLocaleString("en-IN")} km / ${ownership.serviceInterval.months} mo`}
              estimated={ownership.serviceInterval.estimated}
            />
            {ownership.yearlyKwhEstimate != null && (
              <GridItem
                label="Est. yearly electricity"
                value={`${ownership.yearlyKwhEstimate} kWh`}
                estimated
              />
            )}
          </dl>
          {ownership.suitabilityIndicators?.length > 0 && (
            <div className="ev-intel-tags">
              {ownership.suitabilityIndicators.map((t) => (
                <span key={t} className="ev-intel-tag">
                  {t}
                </span>
              ))}
            </div>
          )}
          {ownership.warrantySummary && (
            <p className="ev-intel-footnote">{ownership.warrantySummary}</p>
          )}
          {ownership.degradationNote && (
            <p className="ev-intel-footnote">{ownership.degradationNote}</p>
          )}
          {ownership.riskIndicators?.length > 0 && (
            <ul className="ev-intel-bullets">
              {ownership.riskIndicators.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
          {ownership.assumptionTransparency?.bullets && (
            <div className="ev-intel-footnote">
              <strong>{ownership.assumptionTransparency.title}</strong>
              <ul className="ev-intel-bullets">
                {ownership.assumptionTransparency.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="ev-intel-footnote">{ownership.savingsDisclaimer}</p>
          <p className="ev-intel-footnote">{ownership.disclaimer}</p>
        </section>
      )}

      {show("features") && features.hasData && (
        <section
          ref={featuresRef}
          className={cardClass}
          aria-labelledby="ev-features-intel-title"
        >
          <h2
            id="ev-features-intel-title"
            className="cd-section__title"
          >
            Feature intelligence
          </h2>
          <div className="ev-intel-tags">
            {features.highlights.map((h) => (
              <span key={h} className="ev-intel-tag ev-intel-tag--feature">
                {h}
              </span>
            ))}
          </div>
        </section>
      )}

      {show("suitability") && suitability.hasData && (
        <section
          className={cardClass}
          aria-labelledby="ev-suitability-title"
        >
          <h2
            id="ev-suitability-title"
            className="cd-section__title"
          >
            EV suitability
          </h2>
          <ul className="ev-intel-insights">
            {suitability.insights.map((insight) => (
              <li
                key={insight.id}
                className={`ev-intel-insight ${LEVEL_CLASS[insight.level] || ""}`}
              >
                <span className="ev-intel-insight__title">
                  {insight.title}
                </span>
                <p className="ev-intel-insight__text">
                  {insight.explanation}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
