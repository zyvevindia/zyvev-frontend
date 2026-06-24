import { buildProfileInsights } from "../../aiAssistant/buildProfileInsights.js";

/**
 * @param {{ journey: import("../../buyerJourney/types.js").BuyerJourneyResult }} props
 */
export default function AssistantProfileInsights({ journey }) {
  const insights = buildProfileInsights(journey);

  if (!insights.length) {
    return null;
  }

  return (
    <section
      className="assistant-card assistant-insights"
      aria-label="What matters most for your profile"
    >
      <p className="assistant-card__eyebrow">What matters most for your profile</p>
      <ul className="assistant-insights__list">
        {insights.map((insight) => (
          <li key={insight} className="assistant-insights__item">
            {insight}
          </li>
        ))}
      </ul>
    </section>
  );
}
