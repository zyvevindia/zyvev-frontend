import { Link } from "react-router-dom";

import VehicleImage from "../media/VehicleImage";
import { formatIndianPriceCompact } from "../../utils/formatIndianPrice";

import { vehicleDetailPath } from "../../utils/vehicleRoutes";
import { extractFamilySlug } from "../../utils/modelFamily";

import { trackBuyerEvent } from "../../event-tracking/trackBuyerEvent";

import { BUYER_EVENTS } from "../../event-tracking/eventTypes";

import { appendJourneyStep } from "../../buyer-intelligence/journeyBuffer";
import { ensureArray } from "../../utils/compareArrayUtils";
import { trackVariantRecommendationClicked } from "../../analytics/traffic";

function isVariantRecommendationContext(seoPageSlug = "", item = {}) {
  const slug = String(seoPageSlug || "").toLowerCase();
  return (
    Boolean(item.variantName) ||
    slug.includes("variant") ||
    slug.includes("-agent")
  );
}

function trackSeoToDetail(targetSlug, seoPageSlug, sourcePage = "", item = {}) {
  appendJourneyStep({
    type: "seo_to_detail",
    seoPageSlug,
    targetSlug,
  });
  if (isVariantRecommendationContext(seoPageSlug, item)) {
    trackVariantRecommendationClicked({
      targetSlug,
      variantName: item.variantName,
      seoPageSlug,
      sourcePage,
      rank: item.rank,
    });
  }
  trackBuyerEvent(BUYER_EVENTS.SEO_TO_DETAIL, {
    seoPageSlug,
    targetSlug,
    vehicleSlugs: targetSlug ? [targetSlug] : [],
    sourcePage: sourcePage || (seoPageSlug ? `/cars/${seoPageSlug}` : ""),
    discoveryPath: sourcePage || "",
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

function rankedItemToCar(item) {
  const slug = item?.slug || "";
  const familySlug = extractFamilySlug(slug) || slug;
  return {
    slug,
    familySlug,
    name: item?.displayName || slug,
    catalogMeta: { slug, familySlug },
  };
}

export default function SeoRecommendationList({
  rankedVehicles = [],
  isCompare = false,
  seoPageSlug = "",
  sourcePage = "",
}) {
  const safeRanked = ensureArray(rankedVehicles);

  if (!safeRanked.length) {
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
        {safeRanked.map((item) => (
          <li key={item.slug} style={styles.card}>
            <div style={styles.cardRow}>
              <div style={styles.thumb}>
                <VehicleImage
                  car={rankedItemToCar(item)}
                  role="listing"
                  mediaChannel="seo"
                  alt={item.displayName || item.slug}
                  imgStyle={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  wrapperStyle={{
                    width: "100%",
                    height: "100%",
                    aspectRatio: "unset",
                  }}
                />
              </div>

              <div style={styles.cardBody}>
            <div style={styles.header}>
              <span style={styles.rank}>#{item.rank}</span>
              <Link
                to={vehicleDetailPath(item.slug)}
                style={styles.titleLink}
                onClick={() =>
                  trackSeoToDetail(item.slug, seoPageSlug, sourcePage, item)
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
              </div>
            </div>
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
  cardRow: {
    display: "flex",
    gap: "1rem",
    alignItems: "flex-start",
  },
  thumb: {
    flexShrink: 0,
    width: "112px",
    height: "70px",
    borderRadius: "8px",
    overflow: "hidden",
    background: "#f1f5f9",
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
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
