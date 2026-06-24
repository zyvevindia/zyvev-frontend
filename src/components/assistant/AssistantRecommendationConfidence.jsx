import { buildRecommendationConfidence } from "../../aiAssistant/buildRecommendationConfidence.js";

/**
 * @param {{ state: import("../../aiAssistant/types.js").BuyerConversationState }} props
 */
export default function AssistantRecommendationConfidence({ state }) {
  const confidence = buildRecommendationConfidence(state);

  if (!confidence.reasons.length) {
    return null;
  }

  return (
    <section
      className="assistant-card assistant-confidence"
      aria-label="Why these recommendations appeared"
    >
      <p className="assistant-card__eyebrow">Why these recommendations appeared</p>
      <h2 className="assistant-card__title">{confidence.intro}</h2>
      <ul className="assistant-confidence__list">
        {confidence.reasons.map((reason) => (
          <li key={reason} className="assistant-confidence__item">
            <span className="assistant-confidence__check" aria-hidden="true">
              ✓
            </span>
            {reason}
          </li>
        ))}
      </ul>
    </section>
  );
}
