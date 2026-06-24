import { buildAssistantBuyerProfile } from "../../aiAssistant/buildAssistantBuyerProfile.js";

/**
 * @param {{
 *   state: import("../../aiAssistant/types.js").BuyerConversationState,
 *   journey: import("../../buyerJourney/types.js").BuyerJourneyResult,
 * }} props
 */
export default function AssistantBuyerProfile({ state, journey }) {
  const profile = buildAssistantBuyerProfile(state, journey);

  return (
    <section className="assistant-card assistant-buyer-profile" aria-label="Your buyer profile">
      <p className="assistant-card__eyebrow">Your Buyer Profile</p>
      <div className="assistant-buyer-profile__tags">
        {profile.headlineTags.map((tag) => (
          <span key={tag} className="assistant-profile-tag">
            {tag}
          </span>
        ))}
      </div>

      <dl className="assistant-buyer-profile__details">
        <div className="assistant-buyer-profile__row">
          <dt>Primary archetype</dt>
          <dd>{profile.primaryArchetype}</dd>
        </div>
        {profile.secondaryArchetype ? (
          <div className="assistant-buyer-profile__row">
            <dt>Secondary archetype</dt>
            <dd>{profile.secondaryArchetype}</dd>
          </div>
        ) : null}
        <div className="assistant-buyer-profile__row">
          <dt>Usage profile</dt>
          <dd>{profile.usageProfile}</dd>
        </div>
        <div className="assistant-buyer-profile__row">
          <dt>Ownership profile</dt>
          <dd>{profile.ownershipProfile}</dd>
        </div>
        {profile.familyProfile ? (
          <div className="assistant-buyer-profile__row">
            <dt>Household</dt>
            <dd>{profile.familyProfile}</dd>
          </div>
        ) : null}
        {profile.budgetProfile ? (
          <div className="assistant-buyer-profile__row">
            <dt>Budget</dt>
            <dd>{profile.budgetProfile}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
