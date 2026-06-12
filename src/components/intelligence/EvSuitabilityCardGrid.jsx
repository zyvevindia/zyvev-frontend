import { SUITABILITY_LEVEL } from "../../intelligence/suitabilityInsights";

const LEVEL_BADGE = {
  [SUITABILITY_LEVEL.STRONG]: "Ideal",
  [SUITABILITY_LEVEL.GOOD]: "Good",
  [SUITABILITY_LEVEL.MODERATE]: "Moderate",
  [SUITABILITY_LEVEL.LIMITED]: "Limited",
};

const LEVEL_MODIFIER = {
  [SUITABILITY_LEVEL.STRONG]: "ideal",
  [SUITABILITY_LEVEL.GOOD]: "good",
  [SUITABILITY_LEVEL.MODERATE]: "moderate",
  [SUITABILITY_LEVEL.LIMITED]: "limited",
};

const ICONS = {
  city_commute: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
    </svg>
  ),
  highway: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 19 8 5" />
      <path d="m12 19 4-14" />
      <path d="m16 19 4-14" />
      <path d="M4 15h4M12 15h4M16 15h4" />
    </svg>
  ),
  apartment: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M3 21h18" />
      <path d="M5 21V7l8-4v18" />
      <path d="M19 21V11l-6-4" />
      <path d="M9 9h1M9 13h1M9 17h1" />
    </svg>
  ),
  family: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  long_distance: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M3 11h3l2-7 4 14 2-7h8" />
    </svg>
  ),
  charging_convenience: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
};

const DEFAULT_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v4l2 2" />
  </svg>
);

function insightIcon(id) {
  return ICONS[id] || DEFAULT_ICON;
}

export default function EvSuitabilityCardGrid({ insights = [] }) {
  if (!insights.length) return null;

  return (
    <ul className="ev-suitability-grid" role="list">
      {insights.map((insight) => {
        const modifier = LEVEL_MODIFIER[insight.level] || "moderate";
        const badge = LEVEL_BADGE[insight.level] || "Moderate";

        return (
          <li key={insight.id} className="ev-suitability-grid__item">
            <article
              className={`ev-suitability-card ev-suitability-card--${modifier}`}
              tabIndex={0}
              aria-label={`${insight.title}: ${badge}`}
            >
              <div className="ev-suitability-card__icon" aria-hidden="true">
                {insightIcon(insight.id)}
              </div>
              <div className="ev-suitability-card__body">
                <h3 className="ev-suitability-card__title">{insight.title}</h3>
                <p className="ev-suitability-card__text">{insight.explanation}</p>
              </div>
              <span className="ev-suitability-card__badge">{badge}</span>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
