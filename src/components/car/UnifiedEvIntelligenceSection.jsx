import { useMemo, useState } from "react";

import { buildRecommendationEngine } from "../../intelligence/buildRecommendationEngine.js";
import { buildScoreExplanation } from "../../intelligence/buildScoreExplanation.js";
import { buildPersonas } from "../../intelligence/buildPersonas.js";
import RecommendationInsightsCard from "../scoring/RecommendationInsightsCard.jsx";
import PersonaChips from "../scoring/PersonaChips.jsx";
import ScoreStrengthsWeaknesses from "../scoring/ScoreStrengthsWeaknesses.jsx";
import OwnershipIntelligenceCard from "../scoring/OwnershipIntelligenceCard.jsx";
import ChargingIntelligenceCard from "../scoring/ChargingIntelligenceCard.jsx";
import HighwayConfidenceCard from "../scoring/HighwayConfidenceCard.jsx";
import FamilyIntelligenceCard from "../scoring/FamilyIntelligenceCard.jsx";
import ServiceConfidenceCard from "../scoring/ServiceConfidenceCard.jsx";

import "./unified-ev-intelligence.css";

function hasPersonas(vehicle) {
  return (buildPersonas(vehicle).personas || []).length > 0;
}

function hasBestFor(vehicle) {
  return (buildRecommendationEngine(vehicle).bestFor || []).length > 0;
}

function hasStrengths(vehicle) {
  return (buildScoreExplanation(vehicle).strengths || []).length > 0;
}

function hasTradeOffContent(vehicle) {
  const explanation = buildScoreExplanation(vehicle);
  const recommendation = buildRecommendationEngine(vehicle);
  return (
    (explanation.weaknesses || []).length > 0 ||
    (recommendation.avoidFor || []).length > 0
  );
}

function TitledIntelligenceItem({ title, children, className = "" }) {
  if (!children) return null;

  return (
    <article
      className={["unified-ev-intelligence__item", className]
        .filter(Boolean)
        .join(" ")}
    >
      <h3 className="unified-ev-intelligence__item-title">{title}</h3>
      {children}
    </article>
  );
}

const cardClass = "unified-ev-intelligence__item unified-ev-intelligence__card";

/**
 * Cohesive EV advisor block — positive insights first, trade-offs on demand.
 */
export default function UnifiedEvIntelligenceSection({
  vehicle = null,
  showAnchor = true,
}) {
  const [tradeOffsOpen, setTradeOffsOpen] = useState(false);

  const showBestFor = useMemo(
    () => Boolean(vehicle && hasBestFor(vehicle)),
    [vehicle]
  );
  const showPersonality = useMemo(
    () => Boolean(vehicle && hasPersonas(vehicle)),
    [vehicle]
  );
  const showStrengths = useMemo(
    () => Boolean(vehicle && hasStrengths(vehicle)),
    [vehicle]
  );
  const showTradeOffs = useMemo(
    () => Boolean(vehicle && hasTradeOffContent(vehicle)),
    [vehicle]
  );

  if (!vehicle) {
    return null;
  }

  return (
    <section
      className="unified-ev-intelligence"
      aria-labelledby="unified-ev-intelligence-title"
    >
      <header className="unified-ev-intelligence__header">
        <h2
          id="unified-ev-intelligence-title"
          className="cd-section__title unified-ev-intelligence__title"
        >
          EV Intelligence
        </h2>
        <p className="cd-section__intro unified-ev-intelligence__subtitle">
          Insights to help you decide whether this EV matches your lifestyle
          and driving needs.
        </p>
      </header>

      {showAnchor ? (
        <div
          id="ev-intelligence"
          className="cd-ev-intelligence-anchor"
          aria-hidden="true"
        />
      ) : null}

      <div className="unified-ev-intelligence__grid">
        {showBestFor ? (
          <TitledIntelligenceItem
            title="Best For"
            className="unified-ev-intelligence__item--best-for"
          >
            <RecommendationInsightsCard
              vehicle={vehicle}
              layout="card"
              maxAvoidFor={0}
              className="unified-ev-intelligence__card unified-ev-intelligence__card--suppress-subheading"
            />
          </TitledIntelligenceItem>
        ) : null}

        {showPersonality ? (
          <TitledIntelligenceItem title="EV Personality">
            <PersonaChips
              vehicle={vehicle}
              layout="card"
              className="unified-ev-intelligence__card"
              ariaLabel="EV personality"
            />
          </TitledIntelligenceItem>
        ) : null}

        {showStrengths ? (
          <TitledIntelligenceItem
            title="Why Owners Like It"
            className="unified-ev-intelligence__item--strengths"
          >
            <ScoreStrengthsWeaknesses
              vehicle={vehicle}
              layout="card"
              showWeaknesses={false}
              className="unified-ev-intelligence__card unified-ev-intelligence__card--suppress-subheading"
            />
          </TitledIntelligenceItem>
        ) : null}

        <OwnershipIntelligenceCard
          vehicle={vehicle}
          layout="card"
          title="Ownership Experience"
          className={cardClass}
        />

        <ChargingIntelligenceCard
          vehicle={vehicle}
          layout="card"
          title="Charging Experience"
          className={cardClass}
        />

        <HighwayConfidenceCard
          vehicle={vehicle}
          layout="card"
          title="Long-distance Travel"
          className={cardClass}
        />

        <FamilyIntelligenceCard
          vehicle={vehicle}
          layout="card"
          title="Family Suitability"
          className={cardClass}
        />

        <ServiceConfidenceCard
          vehicle={vehicle}
          layout="card"
          title="Service Confidence"
          className={cardClass}
        />
      </div>

      {showTradeOffs ? (
        <div className="unified-ev-intelligence__tradeoffs">
          <button
            type="button"
            className="unified-ev-intelligence__tradeoffs-toggle"
            aria-expanded={tradeOffsOpen}
            aria-controls="unified-ev-intelligence-tradeoffs"
            onClick={() => setTradeOffsOpen((open) => !open)}
          >
            {tradeOffsOpen ? "See trade-offs ▲" : "See trade-offs ▼"}
          </button>

          {tradeOffsOpen ? (
            <div
              id="unified-ev-intelligence-tradeoffs"
              className="unified-ev-intelligence__tradeoffs-panel"
            >
              <ScoreStrengthsWeaknesses
                vehicle={vehicle}
                layout="card"
                showWeaknesses={true}
                maxStrengths={0}
                className="unified-ev-intelligence__card"
              />
              <RecommendationInsightsCard
                vehicle={vehicle}
                layout="card"
                maxBestFor={0}
                className="unified-ev-intelligence__card"
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
