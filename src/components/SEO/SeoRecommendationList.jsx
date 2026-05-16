import { Link } from "react-router-dom";

import { formatIndianPriceCompact } from "../../utils/formatIndianPrice";

import { vehicleDetailPath } from "../../utils/vehicleRoutes";

import { trackBuyerEvent } from "../../event-tracking/trackBuyerEvent";

import { BUYER_EVENTS } from "../../event-tracking/eventTypes";

import { appendJourneyStep } from "../../buyer-intelligence/journeyBuffer";

function trackSeoToDetail(targetSlug, seoPageSlug) {
  appendJourneyStep({
    type: "seo_to_detail",
    seoPageSlug,
    targetSlug,
  });
  trackBuyerEvent(BUYER_EVENTS.SEO_TO_DETAIL, {
    seoPageSlug,
    targetSlug,
    vehicleSlugs: targetSlug ? [targetSlug] : [],
    sourcePage: seoPageSlug
      ? `/cars/${seoPageSlug}`
      : "",
    sessionIntent: inferSeoIntent(seoPageSlug),
  });
}

function inferSeoIntent(slug) {
  if (!slug) return undefined;
  if (slug.includes("family")) return "family_usage";
  if (slug.includes("first-time")) return "first_time_buyer";
  if (slug.includes("under-10")) return "budget_conscious";
  if (slug.includes("apartment")) return "apartment_charging";
  if (slug.includes("city")) return "city_commute";
  return undefined;
}

export default function SeoRecommendationList({
  rankedVehicles = [],
  isCompare = false,
  seoPageSlug = "",
}) {
  if (!rankedVehicles.length) {
    return (
      <p style={styles.empty}>
        No catalog variants matched this page at this time.
      </p>
    );
  }

  return (
    <section style={styles.section}>
      <h2 style={styles.heading}>
        {isCompare
          ? "Variants in this comparison"
          : "Recommendations (data-driven)"}
      </h2>

      <ol style={styles.list}>
        {rankedVehicles.map((item) => (
          <li key={item.slug} style={styles.card}>
            <div style={styles.header}>
              <span style={styles.rank}>#{item.rank}</span>
              <Link
                to={vehicleDetailPath(item.slug)}
                style={styles.titleLink}
                onClick={() =>
                  trackSeoToDetail(item.slug, seoPageSlug)
                }
              >
                {item.displayName}
              </Link>
            </div>

            <div style={styles.meta}>
              {item.exShowroom != null && (
                <span>
                  Ex-showroom:{" "}
                  {formatIndianPriceCompact(item.exShowroom)}
                </span>
              )}
              {item.claimedRangeKm != null && (
                <span> · {item.claimedRangeKm} km (claimed)</span>
              )}
              <span style={styles.confidence}>
                · {item.confidence} alignment
              </span>
            </div>

            <p style={styles.explanation}>{item.explanation}</p>
            <p style={styles.tradeoff}>{item.tradeoff}</p>

            <Link
              to={vehicleDetailPath(item.slug)}
              style={styles.cta}
              onClick={() =>
                trackSeoToDetail(item.slug, seoPageSlug)
              }
            >
              View full details →
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

const styles = {
  section: { marginBottom: "2rem" },
  heading: {
    fontSize: "1.25rem",
    fontWeight: 600,
    marginBottom: "1rem",
    color: "#0f172a",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  header: {
    display: "flex",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: "0.25rem",
  },
  card: {
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "1.25rem",
    background: "#fff",
  },
  rank: {
    fontWeight: 700,
    color: "#2563eb",
    marginRight: "0.5rem",
  },
  titleLink: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "#0f172a",
    textDecoration: "none",
  },
  meta: {
    fontSize: "0.875rem",
    color: "#64748b",
    margin: "0.5rem 0",
  },
  confidence: { textTransform: "capitalize" },
  explanation: {
    margin: "0.5rem 0",
    lineHeight: 1.55,
    color: "#334155",
  },
  tradeoff: {
    margin: "0 0 0.75rem",
    fontSize: "0.9rem",
    lineHeight: 1.5,
    color: "#64748b",
    fontStyle: "italic",
  },
  cta: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#2563eb",
    textDecoration: "none",
  },
  empty: { color: "#64748b" },
};
