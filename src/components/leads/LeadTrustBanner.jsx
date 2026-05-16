const wrap = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  padding: "0.75rem 1rem",
  borderRadius: "10px",
  background: "linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%)",
  border: "1px solid #bbf7d0",
  marginBottom: "1rem",
  fontSize: "0.875rem",
  color: "#334155",
};

const row = {
  display: "flex",
  alignItems: "flex-start",
  gap: "0.5rem",
};

export default function LeadTrustBanner({ compact = false }) {
  const items = [
    { icon: "🛡️", text: "No spam — one verified dealer partner per enquiry" },
    { icon: "✓", text: "Dealer verified — EVSavari onboarding review" },
    {
      icon: "📋",
      text: "Editorial independence — guides are not pay-to-rank",
    },
  ];

  return (
    <div style={wrap} role="note" aria-label="Lead trust information">
      {!compact && (
        <strong style={{ color: "#166534", fontSize: "0.9rem" }}>
          Your enquiry is protected
        </strong>
      )}
      {items.map((item) => (
        <div key={item.text} style={row}>
          <span aria-hidden="true">{item.icon}</span>
          <span>{item.text}</span>
        </div>
      ))}
    </div>
  );
}
