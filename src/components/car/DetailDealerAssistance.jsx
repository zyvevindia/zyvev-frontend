import WhatsAppLeadCta from "../leads/WhatsAppLeadCta";

export default function DetailDealerAssistance({
  vehicle,
  familySlug,
  selectedVariantSlug,
  onRequestCallback,
  onGetBestDeal,
}) {
  return (
    <section
      id="detail-dealer-assistance"
      className="cd-section cd-dealer cd-card"
      aria-labelledby="detail-dealer-title"
    >
      <h2 id="detail-dealer-title" className="cd-section__title">
        Dealer assistance
      </h2>
      <p className="cd-section__intro">
        Verified EV dealers will contact you with pricing and availability.
        Your details are used only for this enquiry.
      </p>

      <ul className="cd-dealer__trust">
        <li>Verified dealer network</li>
        <li>No spam — one enquiry at a time</li>
        <li>On-road price &amp; availability</li>
      </ul>

      <div className="cd-dealer__actions">
        <button
          type="button"
          className="cd-dealer__btn"
          onClick={onRequestCallback}
        >
          Request callback
        </button>
        <button
          type="button"
          className="cd-dealer__btn cd-dealer__btn--primary"
          onClick={onGetBestDeal}
        >
          Get best deal
        </button>
        <WhatsAppLeadCta
          vehicleName={vehicle.name}
          vehicleSlug={familySlug}
          familySlug={familySlug}
          variantSlug={selectedVariantSlug}
          sourcePage={`/cars/${familySlug}`}
          intent="inquiry"
          label="WhatsApp enquiry"
          variant="secondary"
        />
      </div>
    </section>
  );
}
