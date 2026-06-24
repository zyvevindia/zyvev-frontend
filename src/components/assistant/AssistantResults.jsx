import { Link } from "react-router-dom";

import { resolveAssistantVehicleDisplay } from "../../aiAssistant/index.js";
import { ANALYTICS_EVENTS } from "../../analytics/events.js";
import { trackAnalytics } from "../../analytics/track.js";
import { vehicleDetailPath } from "../../utils/vehicleRoutes.js";
import VehicleImage from "../media/VehicleImage";
import AssistantActionCenter from "./AssistantActionCenter.jsx";
import AssistantBuyerProfile from "./AssistantBuyerProfile.jsx";
import AssistantBuyerReadiness from "./AssistantBuyerReadiness.jsx";
import AssistantProfileInsights from "./AssistantProfileInsights.jsx";
import AssistantRecommendationConfidence from "./AssistantRecommendationConfidence.jsx";

function AssistantVehicleCard({
  recommendation,
  journey,
  state,
  sourcePage,
}) {
  const display = resolveAssistantVehicleDisplay(recommendation.vehicleSlug);

  const handleVehicleClick = () => {
    trackAnalytics(ANALYTICS_EVENTS.ASSISTANT_VEHICLE_CLICKED, {
      source_page: sourcePage,
      vehicle_slug: recommendation.vehicleSlug,
      bucket: recommendation.bucket,
    });
  };

  return (
    <article className="assistant-vehicle-card">
      <Link
        to={vehicleDetailPath(recommendation.vehicleSlug)}
        className="assistant-vehicle-card__media-link"
        onClick={handleVehicleClick}
      >
        <VehicleImage
          src={display.imageUrl}
          alt={display.displayName}
          className="assistant-vehicle-card__image"
          loading="lazy"
        />
      </Link>

      <div className="assistant-vehicle-card__body">
        <h3 className="assistant-vehicle-card__name">{display.displayName}</h3>
        <p className="assistant-vehicle-card__price">{display.priceLabel}</p>
        <p className="assistant-vehicle-card__headline">{recommendation.headline}</p>

        <Link
          to={vehicleDetailPath(recommendation.vehicleSlug)}
          className="assistant-btn assistant-btn--secondary assistant-vehicle-card__cta"
          onClick={handleVehicleClick}
        >
          View Vehicle
        </Link>

        <AssistantActionCenter
          vehicleSlug={recommendation.vehicleSlug}
          vehicleName={recommendation.vehicleName}
          journey={journey}
          sourcePage={sourcePage}
        />
      </div>
    </article>
  );
}

function AssistantResultsSection({
  title,
  recommendations,
  journey,
  state,
  sourcePage,
  primary = false,
}) {
  if (!recommendations.length) {
    return null;
  }

  return (
    <section
      className={`assistant-results__section${
        primary ? " assistant-results__section--primary" : ""
      }`}
    >
      <h2 className="assistant-results__section-title">{title}</h2>
      <div className="assistant-results__grid">
        {recommendations.map((recommendation) => (
          <AssistantVehicleCard
            key={recommendation.vehicleSlug}
            recommendation={recommendation}
            journey={journey}
            state={state}
            sourcePage={sourcePage}
          />
        ))}
      </div>
    </section>
  );
}

export default function AssistantResults({
  groupedRecommendations,
  journey,
  state,
  sourcePage,
}) {
  const strongMatches = groupedRecommendations.strongMatches || [];
  const goodAlternatives = groupedRecommendations.goodAlternatives || [];
  const worthConsidering = groupedRecommendations.worthConsidering || [];
  const weakFits = groupedRecommendations.weakFits || [];
  const noStrongMatches = strongMatches.length === 0;

  return (
    <section className="assistant-results" aria-label="Assistant recommendations">
      <header className="assistant-results__header">
        <p className="assistant-card__eyebrow">Your matches</p>
        <h2 className="assistant-card__title">EVs that fit your brief</h2>
        <p className="assistant-card__copy">
          Grouped by fit — not ranked. Use the action row on each EV to compare,
          estimate costs, read reviews, and build your shortlist.
        </p>
      </header>

      <AssistantBuyerProfile state={state} journey={journey} />
      <AssistantRecommendationConfidence state={state} />
      <AssistantBuyerReadiness />
      <AssistantProfileInsights journey={journey} />

      {noStrongMatches ? (
        <div className="assistant-results__notice" role="status">
          We couldn&apos;t find a clear strong match based on your inputs.
        </div>
      ) : null}

      <AssistantResultsSection
        title="Strong Matches"
        recommendations={strongMatches}
        journey={journey}
        state={state}
        sourcePage={sourcePage}
      />

      <AssistantResultsSection
        title="Good Alternatives"
        recommendations={goodAlternatives}
        journey={journey}
        state={state}
        sourcePage={sourcePage}
        primary={noStrongMatches}
      />

      <AssistantResultsSection
        title="Worth Considering"
        recommendations={worthConsidering}
        journey={journey}
        state={state}
        sourcePage={sourcePage}
      />

      <AssistantResultsSection
        title="Weak Fits"
        recommendations={weakFits}
        journey={journey}
        state={state}
        sourcePage={sourcePage}
      />
    </section>
  );
}
