/**
 * Lightweight trust signals from catalogMeta (non-blocking).
 */

const badgeRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginTop: "12px",
};

const pill = (bg, color, border) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "6px 12px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "600",
  background: bg,
  color,
  border: `1px solid ${border}`,
});

export default function CatalogTrustBadge({
  catalogMeta,
  catalogSource,
}) {
  if (!catalogMeta) return null;

  const score =
    catalogMeta.dataQualityScore;

  const status =
    catalogMeta.governanceStatus;

  const confidence =
    catalogMeta.confidence;

  const isPublished =
    status === "published";

  return (
    <div
      style={badgeRow}
      aria-label="Catalog data quality indicators"
    >
      {catalogSource === "master" && (
        <span
          style={pill(
            "#eff6ff",
            "#1d4ed8",
            "#93c5fd"
          )}
        >
          EVSavari catalog
        </span>
      )}

      {score != null && (
        <span
          style={pill(
            score >= 90
              ? "#ecfdf5"
              : score >= 85
                ? "#f0fdf4"
                : "#fffbeb",
            score >= 85
              ? "#166534"
              : "#92400e",
            score >= 85
              ? "#86efac"
              : "#fcd34d"
          )}
          title="Editorial data quality score"
        >
          Quality {score}/100
        </span>
      )}

      {isPublished ? (
        <span
          style={pill(
            "#ecfdf5",
            "#047857",
            "#6ee7b7"
          )}
        >
          Verified listing
        </span>
      ) : status ? (
        <span
          style={pill(
            "#f8fafc",
            "#475569",
            "#cbd5e1"
          )}
        >
          {status.replace(/_/g, " ")}
        </span>
      ) : null}

      {confidence && confidence !== "legacy" && (
        <span
          style={pill(
            "#f8fafc",
            "#334155",
            "#e2e8f0"
          )}
        >
          {confidence} confidence
        </span>
      )}
    </div>
  );
}
