export default function DetailDealerTeaser({ onOpenDealer }) {
  return (
    <div className="cd-teaser-card">
      <span className="cd-teaser-card__label">
        Get dealer offers
      </span>
      <p className="cd-teaser-card__hint">
        Verified dealers share on-road price and availability.
      </p>
      <button
        type="button"
        className="cd-teaser-card__link"
        onClick={onOpenDealer}
      >
        Get Dealer Assistance →
      </button>
    </div>
  );
}
