import { useMemo } from "react";

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
import OwnershipToolIntelLinks from "../tools/OwnershipToolIntelLinks.jsx";
import { normalizeVehicleSlug } from "../../utils/vehicleRoutes.js";

import { normalizeInsightLabels } from "../../utils/normalizeInsightLabels.js";

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

function safeIntelligenceBuild(buildFn) {
  try {
    return buildFn();
  } catch {
    return null;
  }
}

function hasBestFor(vehicle) {
  const recommendation = safeIntelligenceBuild(() =>
    buildRecommendationEngine(vehicle)
  );
  return (recommendation?.bestFor ?? []).filter(Boolean).length > 0;
}

function hasPersonas(vehicle) {
  const personaResult = safeIntelligenceBuild(() => buildPersonas(vehicle));
  return (personaResult?.personas ?? []).length > 0;
}

function resolveStrengthExplanation(vehicle, evSavariScores = null) {
  if (!vehicle) return null;

  const built = safeIntelligenceBuild(() => buildScoreExplanation(vehicle)) ?? {
    strengths: [],
    weaknesses: [],
    confidence: "",
  };
  const builtStrengths = normalizeInsightLabels(built.strengths);
  if (builtStrengths.length > 0) {
    return {
      ...built,
      strengths: builtStrengths,
      weaknesses: normalizeInsightLabels(built.weaknesses),
    };
  }

  const scoreStrengths = normalizeInsightLabels(
    evSavariScores?.explanation?.strengths
  );
  if (scoreStrengths.length > 0) {
    return {
      ...built,
      strengths: scoreStrengths,
      weaknesses: normalizeInsightLabels(built.weaknesses),
    };
  }

  return {
    ...built,
    strengths: builtStrengths,
    weaknesses: normalizeInsightLabels(built.weaknesses),
  };
}

function hasWeaknesses(vehicle) {
  const explanation = safeIntelligenceBuild(() => buildScoreExplanation(vehicle));
  return normalizeInsightLabels(explanation?.weaknesses).length > 0;
}

function hasAvoidFor(vehicle) {
  const recommendation = safeIntelligenceBuild(() =>
    buildRecommendationEngine(vehicle)
  );
  return (recommendation?.avoidFor ?? []).filter(Boolean).length > 0;
}

function formatCostPerKmRange(min, max) {
  const fmt = (n) => {
    const value = Number(n);
    if (!Number.isFinite(value)) return null;
    const rounded = Math.round(value * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  };
  const minLabel = fmt(min);
  const maxLabel = fmt(max);
  if (minLabel == null && maxLabel == null) return "";
  if (minLabel != null && maxLabel != null) {
    return `₹${minLabel}–${maxLabel}/km`;
  }
  return `₹${minLabel ?? maxLabel}/km`;
}

function buildHighwaySupportLines(vehicle) {
  const ctx = safeIntelligenceBuild(() => buildHighwayConfidenceContext(vehicle));
  const lines = [];

  if (ctx?.highwayPlanningRangeKm) {
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
  const ctx = safeIntelligenceBuild(() => buildFamilyContext(vehicle));
  const lines = ["Comfortable for 4–5 adults"];

  if (ctx?.bootSpaceL) {
    lines.push(`Good boot space (~${Math.round(ctx.bootSpaceL)}L).`);
  } else {
    lines.push("Good boot space.");
  }

  return lines;
}

function buildServiceSupportLines(vehicle) {
  const brand = safeIntelligenceBuild(() => resolveServiceNetworkBrand(vehicle));
  const lines = [];

  if (brand) {
    lines.push(`Strong ${brand} presence`);
  }

  lines.push("Wide service network.");
  return lines;
}

function joinSupportLines(lines = []) {
  return lines.filter(Boolean).join(" ");
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
      <div className="unified-ev-intelligence__top-card-head">
        <h3 className="unified-ev-intelligence__top-card-title">{title}</h3>
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
      </div>
      <div className="unified-ev-intelligence__top-card-body">{children}</div>
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

  const supportCopy = joinSupportLines(supportLines);

  return (
    <article className="unified-ev-intelligence__experience-card">
      <div className="unified-ev-intelligence__experience-icon">{icon}</div>
      <h3 className="unified-ev-intelligence__experience-title">{title}</h3>
      <div className="unified-ev-intelligence__experience-body">
        <div className="unified-ev-intelligence__experience-content">{children}</div>
        <div className="unified-ev-intelligence__experience-footer">
          {supportCopy ? (
            <p className="unified-ev-intelligence__experience-support">
              {supportCopy}
            </p>
          ) : null}
          <ConfidenceBadge
            vehicle={vehicle}
            dimension={confidenceDimension}
            className="unified-ev-intelligence__card-confidence"
          />
        </div>
      </div>
    </article>
  );
}

function OurTakePanel({ verdict }) {
  const headline = verdict?.headline ?? "";
  const summary = verdict?.summary ?? "";
  const copy = [headline, summary].filter(Boolean).join(" ");

  if (!copy) {
    return null;
  }

  return (
    <article className="unified-ev-intelligence__our-take">
      <div className="unified-ev-intelligence__our-take-icon">{ICONS.shield}</div>
      <h3 className="unified-ev-intelligence__our-take-title">Our Take</h3>
      <p className="unified-ev-intelligence__our-take-copy">{copy}</p>
    </article>
  );
}

function StaticInsightPanel({ title, tone, children, confidence = null }) {
  if (!children) return null;

  return (
    <article
      className={[
        "unified-ev-intelligence__static-panel",
        `unified-ev-intelligence__static-panel--${tone}`,
      ].join(" ")}
    >
      <div className="unified-ev-intelligence__static-panel-head">
        <h3 className="unified-ev-intelligence__static-panel-title">{title}</h3>
        {confidence}
      </div>
      <div className="unified-ev-intelligence__static-panel-body">{children}</div>
    </article>
  );
}

/**
 * Cohesive EV advisor block — positive insights first, trade-offs on demand.
 */
export default function UnifiedEvIntelligenceSection({
  vehicle = null,
  layout = "default",
  evSavariScores = null,
  catalogMeta: _catalogMeta = null,
  familyOverviewMode: _familyOverviewMode = false,
}) {
  const verdict = useMemo(
    () =>
      vehicle
        ? safeIntelligenceBuild(() => buildEvSavariVerdict(vehicle))
        : null,
    [vehicle]
  );

  const scoreConfidence = useMemo(() => {
    if (!vehicle) return null;
    const explanation = safeIntelligenceBuild(() =>
      buildScoreExplanation(vehicle)
    );
    return explanation?.confidence ?? null;
  }, [vehicle]);

  const ownershipData = useMemo(
    () =>
      vehicle
        ? safeIntelligenceBuild(() => buildOwnershipCostScore(vehicle))
        : null,
    [vehicle]
  );

  const chargingData = useMemo(
    () =>
      vehicle
        ? safeIntelligenceBuild(() => buildChargingPracticalityScore(vehicle))
        : null,
    [vehicle]
  );

  const highwayData = useMemo(
    () =>
      vehicle
        ? safeIntelligenceBuild(() => buildHighwayConfidenceScore(vehicle))
        : null,
    [vehicle]
  );

  const familyData = useMemo(
    () =>
      vehicle ? safeIntelligenceBuild(() => buildFamilyScore(vehicle)) : null,
    [vehicle]
  );

  const serviceData = useMemo(
    () =>
      vehicle
        ? safeIntelligenceBuild(() => buildServiceNetworkScore(vehicle))
        : null,
    [vehicle]
  );

  const strengthExplanation = useMemo(
    () => resolveStrengthExplanation(vehicle, evSavariScores),
    [vehicle, evSavariScores]
  );

  const familySlug = normalizeVehicleSlug(
    vehicle?.familySlug || vehicle?.slug || ""
  );

  const showBestFor = useMemo(
    () => Boolean(vehicle && hasBestFor(vehicle)),
    [vehicle]
  );
  const showPersonality = useMemo(
    () => Boolean(vehicle && hasPersonas(vehicle)),
    [vehicle]
  );
  const showWhyOwnersCard = useMemo(
    () => normalizeInsightLabels(strengthExplanation?.strengths).length > 0,
    [strengthExplanation]
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
    <div
      className={[
        "unified-ev-intelligence",
        layout === "hero" ? "unified-ev-intelligence--hero" : "",
      ]
        .filter(Boolean)
        .join(" ")}
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
          {layout === "hero" ? (
            <p className="cd-section__intro unified-ev-intelligence__subtitle">
              Actionable insights to help you decide whether this EV is right for
              you.
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="unified-ev-intelligence__how-btn"
          onClick={() => scrollToDetailSection("faqs")}
        >
          How we calculate
        </button>
      </header>

      <div className="unified-ev-intelligence__top-row">
        {showBestFor ? (
          <PremiumTopCard
            title="Best For"
            vehicle={vehicle}
            className="unified-ev-intelligence__best-for-card"
          >
            <RecommendationInsightsCard
              vehicle={vehicle}
              layout="inline"
              maxAvoidFor={0}
              className="unified-ev-intelligence__insights-inline"
            />
          </PremiumTopCard>
        ) : null}

        {showPersonality ? (
          <PremiumTopCard
            title="EV Personality"
            vehicle={vehicle}
            className="unified-ev-intelligence__personality-card"
          >
            <PersonaChips
              vehicle={vehicle}
              layout="inline"
              className="unified-ev-intelligence__persona-chips"
              ariaLabel="EV personality"
            />
          </PremiumTopCard>
        ) : null}

        {showWhyOwnersCard ? (
          <PremiumTopCard
            title="Why Owners Like It"
            vehicle={vehicle}
            confidenceLabel={scoreConfidence}
            className="unified-ev-intelligence__why-owners-card"
          >
            <ScoreStrengthsWeaknesses
              explanation={strengthExplanation}
              layout="inline"
              showWeaknesses={false}
              maxStrengths={4}
              className="unified-ev-intelligence__insights-inline unified-ev-intelligence__insights-inline--why-owners"
            />
          </PremiumTopCard>
        ) : null}
      </div>

      <div className="unified-ev-intelligence__experience-block">
        <div className="unified-ev-intelligence__experience-grid unified-ev-intelligence__experience-grid--quad">
        {ownershipData?.label ? (
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
            {formatCostPerKmRange(
              ownershipData.costPerKmMin,
              ownershipData.costPerKmMax
            ) ? (
              <p className="unified-ev-intelligence__experience-metric">
                {formatCostPerKmRange(
                  ownershipData.costPerKmMin,
                  ownershipData.costPerKmMax
                )}
              </p>
            ) : null}
          </PremiumExperienceCard>
        ) : null}

        {chargingData?.label ? (
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

        {highwayData?.label ? (
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

        {familyData?.label ? (
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
        </div>

        <div className="unified-ev-intelligence__experience-grid unified-ev-intelligence__experience-grid--dual unified-ev-intelligence__service-take-row">
        {serviceData?.label ? (
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

        <div className="unified-ev-intelligence__our-take-wrap">
          <OurTakePanel verdict={verdict} />
          <OwnershipToolIntelLinks vehicleSlug={familySlug} />
        </div>
        </div>
      </div>

      <div className="unified-ev-intelligence__bottom-row">
      {showTradeOffs ? (
        <StaticInsightPanel
          title="Trade-offs (Not Dealbreakers)"
          tone="tradeoffs"
          confidence={
            <ConfidenceBadge
              label={scoreConfidence}
              className="unified-ev-intelligence__card-confidence"
            />
          }
        >
          <ScoreStrengthsWeaknesses
            vehicle={vehicle}
            layout="inline"
            showWeaknesses={true}
            maxStrengths={0}
            className="unified-ev-intelligence__insights-inline"
          />
        </StaticInsightPanel>
      ) : null}

      {showAvoidIf ? (
        <StaticInsightPanel
          title="Avoid If"
          tone="avoid"
          confidence={
            <ConfidenceBadge
              dimension="overall"
              vehicle={vehicle}
              className="unified-ev-intelligence__card-confidence"
            />
          }
        >
          <RecommendationInsightsCard
            vehicle={vehicle}
            layout="inline"
            maxBestFor={0}
            className="unified-ev-intelligence__insights-inline unified-ev-intelligence__insights-inline--avoid"
          />
        </StaticInsightPanel>
      ) : null}
      </div>
    </div>
  );
}
