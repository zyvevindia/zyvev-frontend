import "./lead-generation-cta-strip.css";

/**
 * Primary lead-generation CTAs — always visible below hero summary.
 */
export default function LeadGenerationCtaStrip({
  onBookTestDrive = () => {},
  onGetBestDeal = () => {},
  onRequestCallback = () => {},
  onGetDealerAssistance = () => {},
}) {
  return (
    <div
      className="lead-cta-strip"
      role="group"
      aria-label="Book and dealer assistance"
    >
      <div className="lead-cta-strip__row lead-cta-strip__row--primary">
        <button
          type="button"
          className="lead-cta-strip__btn lead-cta-strip__btn--primary"
          onClick={onBookTestDrive}
        >
          Book Test Drive
        </button>

        <button
          type="button"
          className="lead-cta-strip__btn lead-cta-strip__btn--deal"
          onClick={onGetBestDeal}
        >
          Get Best Deal
        </button>
      </div>

      <div className="lead-cta-strip__row lead-cta-strip__row--secondary">
        <button
          type="button"
          className="lead-cta-strip__btn lead-cta-strip__btn--secondary"
          onClick={onRequestCallback}
        >
          Request Call Back
        </button>

        <button
          type="button"
          className="lead-cta-strip__btn lead-cta-strip__btn--secondary"
          onClick={onGetDealerAssistance}
        >
          Get Dealer Assistance
        </button>
      </div>
    </div>
  );
}
