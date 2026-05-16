import { openWhatsAppLead, isWhatsAppLeadEnabled } from "../../utils/whatsappLead";

const styles = {
  wrap: {
    display: "inline-block",
  },
  button: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.25rem",
    borderRadius: "10px",
    border: "none",
    background: "#25D366",
    color: "#fff",
    fontWeight: 600,
    fontSize: "0.95rem",
    cursor: "pointer",
  },
  buttonSecondary: {
    background: "#fff",
    color: "#15803d",
    border: "2px solid #25D366",
  },
  hint: {
    fontSize: "0.8rem",
    color: "#64748b",
    marginTop: "0.35rem",
  },
};

export default function WhatsAppLeadCta({
  vehicleName = "",
  vehicleSlug = "",
  city = "",
  sourcePage = "",
  seoPageSlug = "",
  compareSlugs = [],
  intent = "inquiry",
  label = "Chat on WhatsApp",
  variant = "primary",
  className = "",
  style = {},
}) {
  if (!isWhatsAppLeadEnabled()) return null;

  const handleClick = () => {
    openWhatsAppLead({
      vehicleName,
      vehicleSlug,
      city,
      sourcePage,
      seoPageSlug,
      compareSlugs,
      intent,
    });
  };

  return (
    <div className={className} style={styles.wrap}>
      <button
        type="button"
        style={{
          ...styles.button,
          ...(variant === "secondary" ? styles.buttonSecondary : {}),
          ...style,
        }}
        onClick={handleClick}
        aria-label={label}
      >
        <span aria-hidden="true">💬</span>
        {label}
      </button>
      <p style={styles.hint}>
        Opens WhatsApp with your vehicle and page context pre-filled.
      </p>
    </div>
  );
}

