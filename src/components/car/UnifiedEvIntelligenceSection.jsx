import { useMemo, useState } from "react";

import { buildRecommendationEngine } from "../../intelligence/buildRecommendationEngine.js";
import { buildScoreExplanation } from "../../intelligence/buildScoreExplanation.js";
import { buildPersonas } from "../../intelligence/buildPersonas.js";
import { buildEvSavariVerdict } from "../../intelligence/buildEvSavariVerdict.js";
import { buildOwnershipCostScore } from "../../intelligence/buildOwnershipCostScore.js";
import { buildChargingPracticalityScore } from "../../intelligence/buildChargingPracticalityScore.js";
import { buildHighwayConfidenceScore, buildHighwayConfidenceContext } from "../../intelligence/buildHighwayConfidenceScore.js";
import { buildFamilyScore, buildFamilyContext } from "../../intelligence/buildFamilyScore.js";
import { buildServiceNetworkScore, resolveServiceNetworkBrand } from "../../intelligence/buildServiceNetworkScore.js";
import { scrollToDetailSection } from "../../utils/detailPageNav.js";
import RecommendationInsightsCard from "../scoring/RecommendationInsightsCard.jsx";
import PersonaChips from "../scoring/PersonaChips.jsx";
import ScoreStrengthsWeaknesses from "../scoring/ScoreStrengthsWeaknesses.jsx";
import ConfidenceBadge from "../scoring/ConfidenceBadge.jsx";

import "./unified-ev-intelligence.css";

const ICONS = {
  ownership: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 8h4.5a2.5 2.5 0 0 1 0 5H9v-5zM9 13h5a2.5 2.5 0 0 1 0 5H9v-5z" />
    </svg>
  ),
  charging: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
    </svg>
  ),
  highway: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 19h16M6 19l3-14M18 19l-3-14M10 10h4M9 14h6" />
    </svg>
  ),
  family: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="9" cy="8" r="2.5" />
      <circle cx="16" cy="9" r="2" />
      <path d="M4 19c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5M14 19c0-2 1.6-3.5 3.5-3.5" />
    </svg>
  ),
  service: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
};

function hasPersonas(vehicle) {
  return (buildPersonas(vehicle).personas || []).length > 0;
}

function hasBestFor(vehicle) {
  return (buildRecommendationEngine(vehicle).bestFor || []).length > 0;
}

function hasStrengths(vehicle) {
  return (buildScoreExplanation(vehicle).strengths || []).length > 0;
}

function hasWeaknesses(vehicle) {
  return (buildScoreExplanation(vehicle).weaknesses || []).length > 0;
}

function hasAvoidFor(vehicle) {
  return (buildRecommendationEngine(vehicle).avoidFor || []).length > 0;
}

function formatCostPerKmRange(min, max) {
  const fmt = (n) => {
    const rounded = Math.round(n * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  };
  return `₹${fmt(min)}–${fmt(max)}/km`;
}

function buildHighwaySupportLines(vehicle) {
  const ctx = buildHighwayConfidenceContext(vehicle);
  const lines = [];

  if (ctx.highwayPlanningRangeKm) {
    lines.push(
      `Good range for inter-city trips (~${Math.round(ctx.highwayPlanningRangeKm)} km planning range).`
    );
  } else {
    lines.push("Good range for inter-city trips.");
  }

  lines.push("Minimal charging stops.");
  return lines;
}

function buildFamilySupportLines(vehicle) {
  const ctx = buildFamilyContext(vehicle);
  const lines = ["Comfortable for 4–5 adults"];

  if (ctx.bootSpaceL) {
    lines.push(`Good boot space (~${Math.round(ctx.bootSpaceL)}L).`);
  } else {
    lines.push("Good boot space.");
  }

  return lines;
}

function buildServiceSupportLines(vehicle) {
  const brand = resolveServiceNetworkBrand(vehicle);
  const lines = [];

  if (brand) {
    lines.push(`Strong ${brand} presence`);
  }

  lines.push("Wide service network.");
  return lines;
}

function PremiumTopCard({
  title,
  children,
  vehicle,
  confidenceLabel = null,
  className = "",
}) {
  if (!children) return null;

  return (
    <article
      className={["unified-ev-intelligence__top-card", className]
        .filter(Boolean)
        .join(" ")}
    >
      <h3 className="unified-ev-intelligence__top-card-title">{title}</h3>
      <div className="unified-ev-intelligence__top-card-body">{children}</div>
      {confidenceLabel ? (
        <ConfidenceBadge
          label={confidenceLabel}
          className="unified-ev-intelligence__card-confidence"
        />
      ) : (
        <ConfidenceBadge
          vehicle={vehicle}
          dimension="overall"
          className="unified-ev-intelligence__card-confidence"
        />
      )}
    </article>
  );
}

function PremiumExperienceCard({
  icon,
  title,
  children,
  supportLines = [],
  vehicle,
  confidenceDimension,
}) {
  if (!children) return null;

  return (
    <article className="unified-ev-intelligence__experience-card">
      <div className="unified-ev-intelligence__experience-icon">{icon}</div>
      <div className="unified-ev-intelligence__experience-body">
        <h3 className="unified-ev-intelligence__experience-title">{title}</h3>
        {children}
        {supportLines.length > 0 ? (
          <ul className="unified-ev-intelligence__experience-support">
            {supportLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
        <ConfidenceBadge
          vehicle={vehicle}
          dimension={confidenceDimension}
          className="unified-ev-intelligence__card-confidence"
        />
      </div>
    </article>
  );
}

function OurTakePanel({ verdict }) {
  if (!verdict?.headline && !verdict?.summary) {
    return null;
  }

  return (
    <article className="unified-ev-intelligence__our-take">
      <div className="unified-ev-intelligence__our-take-icon">{ICONS.shield}</div>
      <div className="unified-ev-intelligence__our-take-copy">
        <h3 className="unified-ev-intelligence__our-take-title">Our Take</h3>
        {verdict.headline ? (
          <p className="unified-ev-intelligence__our-take-headline">
            {verdict.headline}
          </p>
        ) : null}
        {verdict.summary ? (
          <p className="unified-ev-intelligence__our-take-summary">
            {verdict.summary}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function CollapsiblePanel({
  title,
  tone,
  isOpen,
  onToggle,
  panelId,
  children,
}) {
  if (!children) return null;

  return (
    <div
      className={[
        "unified-ev-intelligence__collapsible",
        `unified-ev-intelligence__collapsible--${tone}`,
      ].join(" ")}
    >
      <button
        type="button"
        className="unified-ev-intelligence__collapsible-toggle"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span>{title}</span>
        <span className="unified-ev-intelligence__collapsible-chevron" aria-hidden>
          {isOpen ? "▲" : "▼"}
        </span>
      </button>

      {isOpen ? (
        <div id={panelId} className="unified-ev-intelligence__collapsible-panel">
          {children}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Cohesive EV advisor block — positive insights first, trade-offs on demand.
 */
export default function UnifiedEvIntelligenceSection({
  vehicle = null,
  showAnchor = true,
}) {
  const [tradeOffsOpen, setTradeOffsOpen] = useState(false);
  const [avoidIfOpen, setAvoidIfOpen] = useState(false);

  const verdict = useMemo(
    () => (vehicle ? buildEvSavariVerdict(vehicle) : null),
    [vehicle]
  );

  const scoreConfidence = useMemo(() => {
    if (!vehicle) return null;
    return buildScoreExplanation(vehicle).confidence || null;
  }, [vehicle]);

  const ownershipData = useMemo(
    () => (vehicle ? buildOwnershipCostScore(vehicle) : null),
    [vehicle]
  );

  const chargingData = useMemo(
    () => (vehicle ? buildChargingPracticalityScore(vehicle) : null),
    [vehicle]
  );

  const highwayData = useMemo(
    () => (vehicle ? buildHighwayConfidenceScore(vehicle) : null),
    [vehicle]
  );

  const familyData = useMemo(
    () => (vehicle ? buildFamilyScore(vehicle) : null),
    [vehicle]
  );

  const serviceData = useMemo(
    () => (vehicle ? buildServiceNetworkScore(vehicle) : null),
    [vehicle]
  );

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
    () => Boolean(vehicle && hasWeaknesses(vehicle)),
    [vehicle]
  );
  const showAvoidIf = useMemo(
    () => Boolean(vehicle && hasAvoidFor(vehicle)),
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
        <div className="unified-ev-intelligence__header-copy">
          <h2
            id="unified-ev-intelligence-title"
            className="cd-section__title unified-ev-intelligence__title"
          >
            EV Intelligence
          </h2>
          <p className="cd-section__intro unified-ev-intelligence__subtitle">
            Actionable insights to help you decide whether this EV is right for
            you.
          </p>
        </div>
        <button
          type="button"
          className="unified-ev-intelligence__how-btn"
          onClick={() => scrollToDetailSection("faqs")}
        >
          How we calculate
        </button>
      </header>

      {showAnchor ? (
        <div
          id="ev-intelligence"
          className="cd-ev-intelligence-anchor"
          aria-hidden="true"
        />
      ) : null}

      <div className="unified-ev-intelligence__top-row">
        {showBestFor ? (
          <PremiumTopCard title="Best For" vehicle={vehicle}>
            <RecommendationInsightsCard
              vehicle={vehicle}
              layout="inline"
              maxAvoidFor={0}
              className="unified-ev-intelligence__insights-inline"
            />
          </PremiumTopCard>
        ) : null}

        {showPersonality ? (
          <PremiumTopCard title="EV Personality" vehicle={vehicle}>
            <PersonaChips
              vehicle={vehicle}
              layout="inline"
              className="unified-ev-intelligence__persona-chips"
              ariaLabel="EV personality"
            />
          </PremiumTopCard>
        ) : null}

        {showStrengths ? (
          <PremiumTopCard
            title="Why Owners Like It"
            vehicle={vehicle}
            confidenceLabel={scoreConfidence}
          >
            <ScoreStrengthsWeaknesses
              vehicle={vehicle}
              layout="inline"
              showWeaknesses={false}
              maxStrengths={4}
              className="unified-ev-intelligence__insights-inline"
            />
          </PremiumTopCard>
        ) : null}
      </div>

      <div className="unified-ev-intelligence__experience-grid">
        {ownershipData ? (
          <PremiumExperienceCard
            icon={ICONS.ownership}
            title="Ownership Experience"
            vehicle={vehicle}
            confidenceDimension="ownership"
            supportLines={["Includes charging, service and maintenance."]}
          >
            <p className="unified-ev-intelligence__experience-label">
              {ownershipData.label}
            </p>
            <p className="unified-ev-intelligence__experience-metric">
              {formatCostPerKmRange(
                ownershipData.costPerKmMin,
                ownershipData.costPerKmMax
              )}
            </p>
          </PremiumExperienceCard>
        ) : null}

        {chargingData ? (
          <PremiumExperienceCard
            icon={ICONS.charging}
            title="Charging Experience"
            vehicle={vehicle}
            confidenceDimension="chargingPracticality"
          >
            <p className="unified-ev-intelligence__experience-label">
              {chargingData.label}
            </p>
            {chargingData.acChargingExperience ? (
              <p className="unified-ev-intelligence__experience-detail">
                {chargingData.acChargingExperience}
              </p>
            ) : null}
            {chargingData.dcChargingExperience ? (
              <p className="unified-ev-intelligence__experience-detail">
                {chargingData.dcChargingExperience}
              </p>
            ) : null}
          </PremiumExperienceCard>
        ) : null}

        {highwayData ? (
          <PremiumExperienceCard
            icon={ICONS.highway}
            title="Long-distance Travel"
            vehicle={vehicle}
            confidenceDimension="highwayConfidence"
            supportLines={buildHighwaySupportLines(vehicle)}
          >
            <p className="unified-ev-intelligence__experience-label">
              {highwayData.label}
            </p>
          </PremiumExperienceCard>
        ) : null}

        {familyData ? (
          <PremiumExperienceCard
            icon={ICONS.family}
            title="Family Suitability"
            vehicle={vehicle}
            confidenceDimension="familySuitability"
            supportLines={buildFamilySupportLines(vehicle)}
          >
            <p className="unified-ev-intelligence__experience-label">
              {familyData.label}
            </p>
          </PremiumExperienceCard>
        ) : null}

        {serviceData ? (
          <PremiumExperienceCard
            icon={ICONS.service}
            title="Service Confidence"
            vehicle={vehicle}
            confidenceDimension="serviceNetwork"
            supportLines={buildServiceSupportLines(vehicle)}
          >
            <p className="unified-ev-intelligence__experience-label">
              {serviceData.label}
            </p>
          </PremiumExperienceCard>
        ) : null}
      </div>

      <OurTakePanel verdict={verdict} />

      {showTradeOffs ? (
        <CollapsiblePanel
          title="Trade-offs (Not Dealbreakers)"
          tone="tradeoffs"
          isOpen={tradeOffsOpen}
          onToggle={() => setTradeOffsOpen((open) => !open)}
          panelId="unified-ev-intelligence-tradeoffs"
        >
          <ScoreStrengthsWeaknesses
            vehicle={vehicle}
            layout="inline"
            showWeaknesses={true}
            maxStrengths={0}
            className="unified-ev-intelligence__insights-inline"
          />
          <ConfidenceBadge
            label={scoreConfidence}
            className="unified-ev-intelligence__card-confidence"
          />
        </CollapsiblePanel>
      ) : null}

      {showAvoidIf ? (
        <CollapsiblePanel
          title="Avoid If"
          tone="avoid"
          isOpen={avoidIfOpen}
          onToggle={() => setAvoidIfOpen((open) => !open)}
          panelId="unified-ev-intelligence-avoid"
        >
          <RecommendationInsightsCard
            vehicle={vehicle}
            layout="inline"
            maxBestFor={0}
            className="unified-ev-intelligence__insights-inline unified-ev-intelligence__insights-inline--avoid"
          />
          <ConfidenceBadge
            dimension="overall"
            vehicle={vehicle}
            className="unified-ev-intelligence__card-confidence"
          />
        </CollapsiblePanel>
      ) : null}
    </section>
  );
}
