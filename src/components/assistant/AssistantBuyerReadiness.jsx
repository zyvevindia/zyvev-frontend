import { READINESS_LABELS } from "../../aiAssistant/assistantIntentSignals.js";
import { useAssistantIntent } from "./AssistantIntentProvider.jsx";

const READINESS_ORDER = Object.freeze([
  "exploring",
  "comparing",
  "shortlisting",
  "ready_to_buy",
]);

export default function AssistantBuyerReadiness() {
  const { readiness } = useAssistantIntent();
  const activeIndex = READINESS_ORDER.indexOf(readiness);

  return (
    <section className="assistant-card assistant-readiness" aria-label="Buyer readiness">
      <p className="assistant-card__eyebrow">Buyer Readiness</p>
      <h2 className="assistant-card__title">{READINESS_LABELS[readiness]}</h2>
      <div className="assistant-readiness__track" role="list">
        {READINESS_ORDER.map((state, index) => {
          const active = index <= activeIndex;
          const current = state === readiness;

          return (
            <div
              key={state}
              className={`assistant-readiness__step${
                active ? " assistant-readiness__step--active" : ""
              }${current ? " assistant-readiness__step--current" : ""}`}
              role="listitem"
              aria-current={current ? "step" : undefined}
            >
              <span className="assistant-readiness__dot" aria-hidden="true" />
              <span className="assistant-readiness__label">
                {READINESS_LABELS[state]}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
