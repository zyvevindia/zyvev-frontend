/**
 * Subtle trust row for listing/compare cards.
 */

const row = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  marginTop: "8px",
};

const pill = {
  fontSize: "10px",
  fontWeight: "600",
  padding: "4px 8px",
  borderRadius: "6px",
  letterSpacing: "0.3px",
  textTransform: "uppercase",
  lineHeight: 1.2,
};

export default function CatalogCardTrust({
  catalogMeta,
  catalogSource,
}) {
  if (!catalogMeta) return null;

  const items = [];
  const score = catalogMeta.dataQualityScore;
  const status = catalogMeta.governanceStatus;
  const confidence = catalogMeta.confidence;
  const updated =
    catalogMeta.priceLastUpdated ||
    catalogMeta.lastUpdatedAt;

  if (
    catalogSource === "master" &&
    score != null &&
    score >= 85
  ) {
    items.push({
      key: "verified-specs",
      label: "Verified Specs",
      bg: "#f0fdf4",
      color: "#166534",
    });
  }

  if (status === "published") {
    items.push({
      key: "evsavari-verified",
      label: "EVSavari Verified",
      bg: "#eff6ff",
      color: "#1d4ed8",
    });
  }

  if (updated) {
    const days =
      (Date.now() - new Date(updated).getTime()) /
      (1000 * 60 * 60 * 24);
    if (days <= 120) {
      items.push({
        key: "updated",
        label: "Updated Recently",
        bg: "#f8fafc",
        color: "#475569",
      });
    }
  }

  if (
    confidence &&
    confidence !== "legacy" &&
    confidence !== "low"
  ) {
    items.push({
      key: "confidence",
      label:
        confidence === "high"
          ? "High Confidence"
          : "Data Confidence",
      bg: "#faf5ff",
      color: "#6b21a8",
    });
  }

  if (!items.length) return null;

  return (
    <div style={row} aria-label="Listing trust indicators">
      {items.slice(0, 2).map((item) => (
        <span
          key={item.key}
          style={{
            ...pill,
            background: item.bg,
            color: item.color,
          }}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
}
