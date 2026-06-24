export default function AssistantWelcomeCard({ onStart }) {
  return (
    <section className="assistant-card assistant-welcome-card">
      <p className="assistant-card__eyebrow">EV Buyer Assistant</p>
      <h1 className="assistant-card__title">
        Find EVs that match how you actually drive
      </h1>
      <p className="assistant-card__copy">
        Answer five quick questions about budget, usage, family needs, charging,
        and priorities. We&apos;ll suggest relevant EVs using EVSavari intelligence —
        no chatbot, no guesswork.
      </p>
      <button type="button" className="assistant-btn assistant-btn--primary" onClick={onStart}>
        Get started
      </button>
    </section>
  );
}
