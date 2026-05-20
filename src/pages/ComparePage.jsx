import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import "../styles/compare-page.css";

import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import JsonLd from "../components/SEO/JsonLd";
import SeoHead from "../components/SEO/SeoHead";
import { buildCompareToolMeta } from "../seo/pageMetadata";
import { canonicalCompareHubUrl } from "../seo/canonical";

import {
  buildBreadcrumbSchema,
  buildCompareItemListSchema,
} from "../utils/structuredData";

import CompactCarCard from "../components/CompactCarCard";

import CompareInsightCard from "../components/catalog/CompareInsightCard";

import CompareTrustPanel from "../components/catalog/CompareTrustPanel";

const CompareBelowFoldSections = lazy(() =>
  import("../components/catalog/CompareBelowFoldSections")
);

import { formatIndianPriceCompact } from "../utils/formatIndianPrice";

import { vehicleDetailPath } from "../utils/vehicleRoutes";

import { GENERATED_COMPARE_SLUGS } from "../content/generated/manifest";
import { compareGuidePath } from "../seo/slugs";

import LeadInquiryModal from "../components/LeadInquiryModal";
import WhatsAppLeadCta from "../components/leads/WhatsAppLeadCta";

import {
  COMPARE_CARS_SYNC_EVENT,
  loadCompareCarsFromStorage,
  saveCompareCars,
} from "../utils/compareCarsStorage";

import { trackBuyerEvent } from "../event-tracking/trackBuyerEvent";
import {
  trackLaunchCompareCta,
  trackLaunchCompareStarted,
} from "../launch/launchTelemetry";

import { BUYER_EVENTS } from "../event-tracking/eventTypes";

import {
  attachIntelligenceToCompareCars,
  getActiveCompareRows,
  formatCompareCellValue,
  getCompareHighlightWinnerId,
} from "../intelligence/compareSpecRows";

import {
  trackCompareAbandoned,
  trackIntelligenceCompareEngaged,
} from "../analytics/funnel";
import UsefulnessFeedback from "../components/feedback/UsefulnessFeedback";

const POPULAR_COMPARE_SLUGS = (GENERATED_COMPARE_SLUGS || []).slice(0, 6);

function formatCompareGuideLabel(slug) {
  return String(slug || "")
    .replace(/-vs-/gi, " vs ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* =========================================================
   ===================== BEST VALUE (PURE) ===================
   ========================================================= */

function getBestValueId(
  cars
) {

  if (
    !cars?.length
  ) {

    return null;
  }

  let best =
    cars[0];

  let bestScore =

    (
      best.startingPrice || 1
    ) /

    (
      best.specifications
        ?.range || 1
    );

  cars.forEach((c) => {
    const catalogScore = c.catalogMeta?.compareValueScore;
    const score =
      catalogScore != null
        ? -Number(catalogScore)
        : (c.startingPrice || 1) /
          (c.specifications?.range || c.range || 1);

    if (score < bestScore) {
      best = c;
      bestScore = score;
    }
  });

  return best._id;
}

/* =========================================================
   ===================== COMPARE PAGE =======================
   ========================================================= */

export default function ComparePage() {

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [inquiryOpen,
    setInquiryOpen] =
    useState(false);

  const [inquiryHeadline,
    setInquiryHeadline] =
    useState(
      "Request a callback"
    );

  const [inquirySubmit,
    setInquirySubmit] =
    useState(
      "Request callback"
    );

  const [cars, setCars] = useState(
    () => loadCompareCarsFromStorage()
  );

  const intelligentCars = useMemo(
    () => attachIntelligenceToCompareCars(cars),
    [cars]
  );

  const compareSpecRows = useMemo(
    () => getActiveCompareRows(intelligentCars),
    [intelligentCars]
  );

  useEffect(() => {
    if (Array.isArray(location.state?.cars)) {
      setCars(saveCompareCars(location.state.cars));
      return;
    }

    setCars(loadCompareCarsFromStorage());
  }, [location.key, location.state?.cars]);

  useEffect(() => {
    const onSync = () => {
      setCars(loadCompareCarsFromStorage());
    };

    window.addEventListener(
      COMPARE_CARS_SYNC_EVENT,
      onSync
    );

    return () => {
      window.removeEventListener(
        COMPARE_CARS_SYNC_EVENT,
        onSync
      );
    };
  }, []);

  const compareVehicleLabel =
    useMemo(() => {

      return cars
        .map(
          (c) =>
            c?.name
        )
        .filter(Boolean)
        .join(" vs ");
    }, [cars]);

  const compareVehicleIds =
    useMemo(() => {

      return cars
        .map(
          (c) =>
            String(
              c?._id || ""
            )
        )
        .filter(Boolean)
        .join(",");
    }, [cars]);

  const bestId =
    useMemo(() => {

      return getBestValueId(
        intelligentCars
      );
    }, [intelligentCars]);

  const intelligenceTrackedRef = useRef(false);
  useEffect(() => {
    if (intelligentCars.length < 2) return;
    if (intelligenceTrackedRef.current) return;
    intelligenceTrackedRef.current = true;
    trackIntelligenceCompareEngaged({
      vehicleSlugs: intelligentCars.map((c) => c.slug),
      sourcePage: "compare",
      rowCount: compareSpecRows.length,
    });
  }, [intelligentCars, compareSpecRows.length]);

  const primaryMongoCarId =
    useMemo(() => {

      return cars[0]?._id
        ? String(
          cars[0]._id
        )
        : "";
    }, [cars]);

  const compareSlugsKey = useMemo(
    () =>
      cars
        .map((c) => c?.slug)
        .filter(Boolean)
        .sort()
        .join("|"),
    [cars]
  );

  const compareBreadcrumb = useMemo(
    () =>
      buildBreadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Compare EVs", url: "/compare" },
      ]),
    []
  );

  const comparePageMeta = useMemo(
    () => buildCompareToolMeta({ cars }),
    [cars]
  );

  const compareListSchema = useMemo(
    () =>
      cars.length >= 2
        ? buildCompareItemListSchema(
            cars,
            undefined,
            canonicalCompareHubUrl()
          )
        : null,
    [cars]
  );

  useEffect(() => {
    if (!compareSlugsKey) return;

    const slugs = compareSlugsKey.split("|");

    if (slugs.length >= 2) {
      trackLaunchCompareStarted({
        sourcePage: "compare",
        vehicleSlugs: slugs,
        compareDepth: slugs.length,
      });
    }
  }, [compareSlugsKey]);

  const compareAbandonTracked = useRef(false);
  const inquiryOpenRef = useRef(inquiryOpen);
  inquiryOpenRef.current = inquiryOpen;
  useEffect(() => {
    if (cars.length < 2) return undefined;
    const slugs = cars.map((c) => c.slug).filter(Boolean);
    const depth = cars.length;
    return () => {
      if (compareAbandonTracked.current || inquiryOpenRef.current) return;
      compareAbandonTracked.current = true;
      trackCompareAbandoned({
        vehicleSlugs: slugs,
        compareDepth: depth,
        sourcePage: "compare",
      });
    };
  }, [cars]);

  const openInquiry = (
    headline,
    submit
  ) => {

    setInquiryHeadline(
      headline
    );

    setInquirySubmit(
      submit
    );

    setInquiryOpen(
      true
    );

    const slugs = cars
      .map((c) => c?.slug)
      .filter(Boolean);

    trackLaunchCompareCta({
      sourcePage: "compare",
      headline,
      vehicleSlugs: slugs,
    });

    trackBuyerEvent(BUYER_EVENTS.LEAD_CTA_INITIATED, {
      sourcePage: "compare",
      vehicleSlugs: slugs,
    });

  };

  const clearComparison =
    useCallback(() => {
      saveCompareCars([]);

      navigate("/compare", {
        replace: true,
        state: {},
      });
    }, [navigate]);

  const goToExploreCompare = useCallback(() => {
    if (cars.length) {
      saveCompareCars(cars);
    }
    navigate("/cars?compareMode=true");
  }, [cars, navigate]);

  const removeFromCompare = useCallback(
    (target) => {
      const key = target?._id || target?.slug;
      const next = cars.filter(
        (c) => (c?._id || c?.slug) !== key
      );
      saveCompareCars(next);
      navigate("/compare", {
        replace: true,
        state: { cars: next },
      });
    },
    [cars, navigate]
  );

  /* =========================================================
     ===================== EMPTY STATE =======================
     ========================================================= */

  if (cars.length < 2) {

    return (

      <>
        <SeoHead meta={comparePageMeta} />

        <div className="compare-empty">

          <div className="compare-empty__card">

            <div className="compare-empty__icon" aria-hidden>
              ⚡
            </div>

            <h2 className="compare-empty__title">
              {cars.length === 1
                ? "Add one more EV"
                : "No EVs selected"}
            </h2>

            <p className="compare-empty__text">
              {cars.length === 1
                ? "You need at least 2 vehicles for a side-by-side comparison. Add another EV from the catalog."
                : "Select at least 2 electric vehicles to unlock premium side-by-side comparison."}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/cars?compareMode=true"
                )
              }

              className="compare-hero__btn compare-hero__btn--primary"
            >
              Explore EVs
            </button>

            {POPULAR_COMPARE_SLUGS.length > 0 ? (
              <div style={{ marginTop: "1.75rem" }}>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "#64748b",
                    margin: "0 0 0.5rem",
                  }}
                >
                  Popular comparisons
                </p>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    justifyContent: "center",
                  }}
                >
                  {POPULAR_COMPARE_SLUGS.map((slug) => (
                    <Link
                      key={slug}
                      to={compareGuidePath(slug)}
                      style={{
                        fontSize: "0.8125rem",
                        padding: "0.35rem 0.65rem",
                        borderRadius: "999px",
                        border: "1px solid #e2e8f0",
                        background: "#fff",
                        color: "#0f172a",
                        textDecoration: "none",
                        fontWeight: 500,
                      }}
                    >
                      {formatCompareGuideLabel(slug)}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

          </div>

        </div>
      </>
    );
  }

  const gridClass =
    cars.length === 3
      ? "compare-page-grid compare-page-grid--cols-3"
      : "compare-page-grid";

  return (

    <>
      <SeoHead meta={comparePageMeta} />

      <JsonLd data={compareBreadcrumb} />
      {compareListSchema && (
        <JsonLd data={compareListSchema} />
      )}

      <div className="compare-page compare-page--with-fab">

        {/* ================= HERO ================= */}

        <section className="compare-hero">
          <div
            className="compare-hero__glow compare-hero__glow--tr"
            aria-hidden
          />
          <div
            className="compare-hero__glow compare-hero__glow--bl"
            aria-hidden
          />

          <div className="compare-hero__content">
            <span className="compare-hero__badge">
              Premium EV Comparison
            </span>

            <h1 className="compare-hero__title">
              Compare Electric Vehicles
            </h1>

            <p className="compare-hero__subtitle">
              Side-by-side pricing, range, charging, and specs to
              find the right EV for your needs.
            </p>

            {cars.length === 2 ? (
              <p
                style={{
                  margin: "0.35rem auto 0",
                  fontSize: "0.875rem",
                  color: "#64748b",
                  maxWidth: "36rem",
                }}
              >
                You can compare up to three EVs — add one more from{" "}
                <Link to="/cars?compareMode=true" style={{ color: "#2563eb", fontWeight: 600 }}>
                  Browse
                </Link>{" "}
                for charging and ownership context side by side.
              </p>
            ) : null}

            <div className="compare-hero__actions">

              <button
                type="button"
                onClick={() =>
                  openInquiry(
                    "Request a callback",
                    "Request callback"
                  )
                }

                className="compare-hero__btn compare-hero__btn--ghost"
              >
                Request callback
              </button>

              <button
                type="button"
                className="compare-hero__btn compare-hero__btn--ghost"
                onClick={() =>
                  openInquiry(
                    "Get the best deal",
                    "Get best deal"
                  )
                }
              >
                Get best deal
              </button>

              <WhatsAppLeadCta
                sourcePage="/compare"
                compareSlugs={cars.map((c) => c.slug).filter(Boolean)}
                vehicleName={compareVehicleLabel || "EV comparison"}
                intent="compare"
                label="WhatsApp enquiry"
                variant="secondary"
              />

              <button
                type="button"
                onClick={goToExploreCompare}
                className="compare-hero__btn compare-hero__btn--ghost"
              >
                Explore More EVs
              </button>

              <button
                type="button"
                className="compare-hero__btn compare-hero__btn--primary"
                onClick={clearComparison}
              >
                Clear Comparison
              </button>
            </div>
          </div>
        </section>

        <section className="compare-main">
          <div className={gridClass}>

            {cars.map((car, cardIndex) => {

              const isBest =
                car._id === bestId;

              return (

                <div
                  key={car._id || car.slug}
                  className={`compare-page-card${isBest ? " compare-page-card--best" : ""}`}
                >

                  {isBest && (
                    <div className="compare-page-card__badge">
                      Best Value
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => removeFromCompare(car)}
                    aria-label={`Remove ${car.name} from comparison`}
                    className="compare-page-card__remove"
                  >
                    Remove
                  </button>

                  <div className="compare-page-card__body">
                    <div className="compare-page-card__vehicle">
                      <CompactCarCard
                        variant="compare"
                        eagerImage={cardIndex === 0}
                        car={{
                      ...car,

                      image:
                        car.heroImage ||
                        car.image,

                      price:
                        car.startingPrice,

                      range:
                        car
                          .specifications
                          ?.range || 0,

                      battery:
                        car
                          .specifications
                          ?.batteryPack ||

                        "EV Battery",

                      badge:
                        isBest
                          ? "Recommended"
                          : car.catalogMeta
                            ?.compareValueScore !=
                            null
                          ? `Value ${car.catalogMeta.compareValueScore}`
                          : "Compared",
                        }}
                      />
                    </div>

                    <div className="compare-page-card__insight">
                      <CompareInsightCard car={car} />
                    </div>

                    <div className="compare-page-card__cta-wrap">
                      <Link
                        to={vehicleDetailPath(car, car._id)}
                        className="compare-page-card__cta"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}

          </div>

          <div className="compare-trust-panel">
            <CompareTrustPanel cars={cars} />
          </div>

          <UsefulnessFeedback
            context="compare"
            sourcePage="/compare"
            metadata={{
              vehicleSlugs: cars.map((c) => c.slug).filter(Boolean),
              compareDepth: cars.length,
            }}
          />

          <Suspense
            fallback={
              <div
                className="compare-deferred-skeleton"
                aria-busy="true"
                aria-label="Loading comparison insights"
              />
            }
          >
            <CompareBelowFoldSections
              cars={cars}
              intelligentCars={intelligentCars}
            />
          </Suspense>

          <div className="compare-spec">
            <div className="compare-spec__header">
              <h2 className="compare-spec__title">
                Detailed Specifications
              </h2>
              <span className="compare-spec__hint">
                Swipe horizontally on mobile
              </span>
            </div>

            <div className="compare-spec__table-wrap">
              <table className="compare-spec__table">

                <thead>

                  <tr>

                    <th>Specifications</th>

                    {cars.map((car) => {
                      const isBest = car._id === bestId;
                      return (
                        <th
                          key={car._id}
                          className={
                            isBest
                              ? "compare-spec__th--best"
                              : undefined
                          }
                        >
                          {car.name}
                        </th>
                      );
                    })}

                  </tr>

                </thead>

                <tbody>
                  {compareSpecRows.map((row) => {
                    const highlightId =
                      getCompareHighlightWinnerId(
                        intelligentCars,
                        row
                      );
                    return (
                      <tr key={row.id}>
                        <td className="compare-spec__label">
                          {row.label}
                          {row.estimated ? (
                            <span className="ev-intel-est">
                              {" "}
                              Est.
                            </span>
                          ) : null}
                        </td>
                        {intelligentCars.map((car) => {
                          const raw = row.getRaw(car);
                          const isBest =
                            highlightId === car._id;
                          const isValueBest =
                            row.id === "price" &&
                            car._id === bestId;
                          return (
                            <td
                              key={car._id}
                              className={`compare-spec__value${
                                isBest || isValueBest
                                  ? " compare-spec__value--highlight"
                                  : ""
                              }${
                                isValueBest
                                  ? " compare-spec__value--best"
                                  : ""
                              }`}
                            >
                              {formatCompareCellValue(
                                raw,
                                row
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>

              </table>

            </div>
            {compareSpecRows.some((r) => r.estimated) && (
              <p className="compare-spec__estimate-hint">
                * Estimated values use configurable assumptions — not OEM
                quotes. Confirm specs with the dealer.
              </p>
            )}

          </div>

        </section>

      </div>

      <button
        type="button"
        className="compare-add-more-fab"
        onClick={goToExploreCompare}
        aria-label="Add more EVs to comparison"
      >
        <span className="compare-add-more-fab__icon" aria-hidden>
          +
        </span>
        Add more EVs
      </button>

      <LeadInquiryModal
        isOpen={inquiryOpen}
        onClose={() =>
          setInquiryOpen(
            false
          )
        }
        sourcePage="compare"
        vehicleName={
          compareVehicleLabel ||
          "EV comparison"
        }
        vehicleId={
          compareVehicleIds
        }
        mongoCarId={
          primaryMongoCarId
        }
        headline={inquiryHeadline}
        submitLabel={inquirySubmit}
      />

    </>
  );
}

/* =========================================================
   ========================= STYLES =========================
   ========================================================= */

const comparePage = {
  minHeight: "100vh",

  background:
    "linear-gradient(to bottom, #f8fafc, #eef2ff)",
};

/* =========================================================
   ========================= BUTTONS ========================
   ========================================================= */

const primaryButton = {
  background:
    "linear-gradient(135deg, #2563eb, #1d4ed8)",

  color: "white",

  border: "none",

  padding: "15px 22px",

  borderRadius: "16px",

  cursor: "pointer",

  fontWeight: "700",

  fontSize: "14px",

  whiteSpace: "nowrap",

  boxShadow:
    "0 14px 32px rgba(37,99,235,0.24)",
};

const secondaryButton = {
  background:
    "rgba(255,255,255,0.08)",

  color: "white",

  border:
    "1px solid rgba(255,255,255,0.12)",

  padding: "15px 22px",

  borderRadius: "16px",

  cursor: "pointer",

  fontWeight: "700",

  fontSize: "14px",

  backdropFilter:
    "blur(12px)",

  whiteSpace: "nowrap",
};

const compareButtons = {
  display: "flex",

  justifyContent: "center",

  gap: "18px",

  marginTop: "40px",

  flexWrap: "wrap",
};

/* =========================================================
   ========================== HERO ==========================
   ========================================================= */

const compareHeroSection = {
  position: "relative",

  overflow: "hidden",

  background:
    "linear-gradient(135deg, #020617 0%, #0f172a 40%, #1d4ed8 100%)",

  padding:
    "clamp(70px, 9vw, 120px) 20px 70px",

  textAlign: "center",
};

const compareHeroGlow = {
  position: "absolute",

  top: "-160px",

  right: "-120px",

  width: "360px",

  height: "360px",

  background:
    "radial-gradient(circle, rgba(37,99,235,0.24), transparent 70%)",
};

const compareHeroGlowBottom = {
  position: "absolute",

  bottom: "-180px",

  left: "-120px",

  width: "360px",

  height: "360px",

  background:
    "radial-gradient(circle, rgba(96,165,250,0.18), transparent 70%)",
};

const compareHeroContent = {
  position: "relative",

  zIndex: 2,

  maxWidth: "900px",

  margin: "0 auto",
};

const compareBadge = {
  display: "inline-flex",

  alignItems: "center",

  justifyContent: "center",

  padding: "12px 20px",

  borderRadius: "999px",

  background:
    "rgba(255,255,255,0.12)",

  color: "white",

  fontSize: "13px",

  fontWeight: "700",

  marginBottom: "24px",

  backdropFilter:
    "blur(10px)",
};

const compareHeroTitle = {
  fontSize:
    "clamp(42px, 7vw, 78px)",

  fontWeight: "800",

  color: "white",

  lineHeight: "1.02",

  marginBottom: "22px",

  letterSpacing: "-2px",
};

const compareHeroSubtitle = {
  color: "#dbeafe",

  fontSize:
    "clamp(16px, 2vw, 20px)",

  lineHeight: "1.9",

  maxWidth: "760px",

  margin: "0 auto",
};

/* =========================================================
   =========================== MAIN =========================
   ========================================================= */

const compareSection = {
  maxWidth: "1500px",

  margin: "0 auto",

  padding:
    "50px clamp(18px, 3vw, 36px) 100px",
};

/* =========================================================
   ======================= CARD GRID ========================
   ========================================================= */

const compareGrid = {
  display: "grid",

  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",

  gap: "28px",

  alignItems: "stretch",
};

const compareCardWrapper = {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  minHeight: "100%",
  height: "100%",
};

/* =========================================================
   ====================== SPEC SECTION ======================
   ========================================================= */

const specSection = {
  marginTop: "70px",
};

const specHeaderRow = {
  display: "flex",

  justifyContent:
    "space-between",

  alignItems: "center",

  gap: "20px",

  flexWrap: "wrap",

  marginBottom: "28px",
};

const specHeading = {
  fontSize:
    "clamp(28px, 4vw, 42px)",

  fontWeight: "800",

  color: "#0f172a",

  letterSpacing: "-1px",

  margin: 0,
};

const mobileHint = {
  color: "#64748b",

  fontSize: "14px",

  fontWeight: "600",

  background: "white",

  padding: "10px 14px",

  borderRadius: "14px",

  border:
    "1px solid #e2e8f0",
};

const specTableWrapper = {
  overflowX: "auto",

  background: "white",

  borderRadius: "28px",

  border:
    "1px solid #e2e8f0",

  boxShadow:
    "0 20px 50px rgba(15,23,42,0.06)",
};

const specTable = {
  width: "100%",

  borderCollapse:
    "collapse",

  minWidth: "760px",
};

const specHeaderLeft = {
  padding: "22px",

  textAlign: "left",

  background: "#0f172a",

  color: "white",

  fontSize: "15px",

  whiteSpace: "nowrap",
};

const specHeader = {
  padding: "22px",

  background: "#111827",

  color: "white",

  fontSize: "15px",

  fontWeight: "700",

  whiteSpace: "nowrap",
};

const bestSpecHeader = {
  background:
    "linear-gradient(135deg, #16a34a, #15803d)",
};

const specLabel = {
  padding: "20px 22px",

  fontWeight: "700",

  color: "#0f172a",

  borderBottom:
    "1px solid #e2e8f0",

  background: "#f8fafc",

  whiteSpace: "nowrap",
};

const specValue = {
  padding: "20px 22px",

  textAlign: "center",

  color: "#334155",

  fontWeight: "600",

  borderBottom:
    "1px solid #e2e8f0",

  minWidth: "180px",
};

const bestSpecValue = {
  color: "#16a34a",

  fontWeight: "800",
};

const greenHighlight = {
  color: "#16a34a",

  fontWeight: "800",
};

/* =========================================================
   ======================= EMPTY STATE ======================
   ========================================================= */

const emptyCompareWrapper = {
  minHeight: "80vh",

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  padding: "40px 20px",

  background:
    "linear-gradient(to bottom, #f8fafc, #eef2ff)",
};

const emptyCompareCard = {
  background: "white",

  borderRadius: "32px",

  padding:
    "clamp(40px, 6vw, 60px) clamp(26px, 5vw, 40px)",

  textAlign: "center",

  maxWidth: "520px",

  width: "100%",

  border:
    "1px solid #e2e8f0",

  boxShadow:
    "0 24px 60px rgba(15,23,42,0.08)",
};

const emptyCompareIcon = {
  width: "90px",

  height: "90px",

  margin:
    "0 auto 26px",

  borderRadius: "28px",

  background:
    "linear-gradient(135deg, #2563eb, #1d4ed8)",

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  fontSize: "40px",

  color: "white",

  boxShadow:
    "0 18px 40px rgba(37,99,235,0.28)",
};

const emptyCompareTitle = {
  fontSize:
    "clamp(32px, 5vw, 42px)",

  fontWeight: "800",

  color: "#0f172a",

  marginBottom: "18px",
};

const emptyCompareText = {
  color: "#64748b",

  lineHeight: "1.9",

  marginBottom: "30px",

  fontSize: "16px",
};