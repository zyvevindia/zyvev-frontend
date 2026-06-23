import { RECOMMENDATION_PERSONAS } from "../../score2/constants.js";
import ScoreTierBadge from "./ScoreTierBadge.jsx";
import { PERSONA_FIELD_LABELS } from "./score2DisplayUtils.js";
import "./score2.css";

export default function ScorePersonaCard({
  recommendation = null,
  className = "",
}) {
  if (!recommendation) return null;

  return (
    <section className={`score2-card score2-persona-card ${className}`.trim()}>
      <h3 className="score2-card__title">Buyer fit</h3>
      <ul className="score2-persona-card__list">
        {RECOMMENDATION_PERSONAS.map((personaKey) => {
          const tier = recommendation[personaKey];
          if (!tier) return null;

          return (
            <li key={personaKey} className="score2-persona-card__row">
              <span className="score2-persona-card__label">
                {PERSONA_FIELD_LABELS[personaKey]}
              </span>
              <ScoreTierBadge tier={tier} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
