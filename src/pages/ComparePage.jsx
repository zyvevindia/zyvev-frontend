import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Helmet,
} from "react-helmet-async";

import JsonLd from "../components/SEO/JsonLd";

import {
  buildBreadcrumbSchema,
  buildCompareItemListSchema,
} from "../utils/structuredData";

import CompactCarCard from "../components/CompactCarCard";

import CompareInsightCard from "../components/catalog/CompareInsightCard";

import CompareScenarioPanel from "../components/catalog/CompareScenarioPanel";

import CompareTrustPanel from "../components/catalog/CompareTrustPanel";

import { formatIndianPriceCompact } from "../utils/formatIndianPrice";

import LeadInquiryModal from "../components/LeadInquiryModal";

import {
  COMPARE_CARS_STORAGE_KEY,
  loadCompareCarsFromStorage,
  notifyCompareCarsSync,
} from "../utils/compareCarsStorage";

import { trackBuyerEvent } from "../event-tracking/trackBuyerEvent";

import { BUYER_EVENTS } from "../event-tracking/eventTypes";

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

    const score =

      (
        c.startingPrice || 1
      ) /

      (
        c.specifications
          ?.range || 1
      );

    if (
      score < bestScore
    ) {

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

  const cars =
    useMemo(() => {

      if (
        location.state?.cars !=
        null
      ) {

        return Array.isArray(
          location.state.cars
        )
          ? location.state.cars
          : [];
      }

      return loadCompareCarsFromStorage();
    }, [
      location.state,

      location.key,
    ]);

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
        cars
      );
    }, [cars]);

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

  const compareListSchema = useMemo(
    () =>
      cars.length >= 2
        ? buildCompareItemListSchema(cars)
        : null,
    [cars]
  );

  useEffect(() => {
    if (!compareSlugsKey) return;

    const slugs = compareSlugsKey.split("|");

    if (slugs.length >= 2) {
      trackBuyerEvent(BUYER_EVENTS.COMPARE_STARTED, {
        sourcePage: "compare",
        vehicleSlugs: slugs,
        compareDepth: slugs.length,
      });
    }
  }, [compareSlugsKey]);

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

    trackBuyerEvent(BUYER_EVENTS.LEAD_CTA_INITIATED, {
      sourcePage: "compare",
      vehicleSlugs: slugs,
    });

    trackBuyerEvent(BUYER_EVENTS.COMPARE_COMPLETED, {
      sourcePage: "compare",
      vehicleSlugs: slugs,
      compareDepth: cars.length,
    });
  };

  const clearComparison =
    useCallback(() => {

      try {

        localStorage.removeItem(
          COMPARE_CARS_STORAGE_KEY
        );
      } catch {

        /* ignore */
      }

      notifyCompareCarsSync();

      navigate(
        "/compare",

        {
          replace: true,

          state: {},
        }
      );
    }, [navigate]);

  /* =========================================================
     ===================== EMPTY STATE =======================
     ========================================================= */

  if (cars.length === 0) {

    return (

      <>
        <Helmet>

          <title>
            Compare Electric Vehicles | EVSavari
          </title>

          <meta
            name="description"
            content="Compare electric cars, scooters and bikes side-by-side including battery range, pricing, charging and specifications."
          />

          <meta
            name="robots"
            content="index, follow"
          />

          <link
            rel="canonical"
            href="https://evsavari.com/compare"
          />

        </Helmet>

        <div style={emptyCompareWrapper}>

          <div style={emptyCompareCard}>

            <div style={emptyCompareIcon}>
              ⚡
            </div>

            <h2 style={emptyCompareTitle}>
              No EVs Selected
            </h2>

            <p style={emptyCompareText}>
              Select at least 2 electric
              vehicles to unlock premium
              side-by-side comparison.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/cars?compareMode=true"
                )
              }

              style={primaryButton}
            >
              Explore EVs
            </button>

          </div>

        </div>
      </>
    );
  }

  /* =========================================================
     ========================= RENDER ========================
     ========================================================= */

  return (

    <>
      <Helmet>

        <title>
          Compare Electric Vehicles | EVSavari
        </title>

        <meta
          name="description"
          content="Compare electric cars, scooters and bikes side-by-side including battery range, pricing, charging and specifications."
        />

        <meta
          name="robots"
          content="index, follow"
        />

        <link
          rel="canonical"
          href="https://evsavari.com/compare"
        />

      </Helmet>

      <JsonLd data={compareBreadcrumb} />
      {compareListSchema && (
        <JsonLd data={compareListSchema} />
      )}

      <div style={comparePage}>

        {/* ================= HERO ================= */}

        <section style={compareHeroSection}>

          <div style={compareHeroGlow} />

          <div style={compareHeroGlowBottom} />

          <div style={compareHeroContent}>

            <div style={compareBadge}>
              Premium EV Comparison
            </div>

            <h1 style={compareHeroTitle}>
              Compare Electric Vehicles
            </h1>

            <p style={compareHeroSubtitle}>
              Analyze pricing,
              battery range,
              charging speed,
              and specifications
              side-by-side to discover
              the perfect EV for your lifestyle.
            </p>

            <div style={compareButtons}>

              <button
                type="button"
                onClick={() =>
                  openInquiry(
                    "Request a callback",
                    "Request callback"
                  )
                }

                style={secondaryButton}
              >
                Request callback
              </button>

              <button
                type="button"
                onClick={() =>
                  openInquiry(
                    "Get the best deal",
                    "Get best deal"
                  )
                }

                style={secondaryButton}
              >
                Get best deal
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/cars?compareMode=true"
                  )
                }

                style={secondaryButton}
              >
                Explore More EVs
              </button>

              <button
                type="button"
                onClick={
                  clearComparison
                }

                style={primaryButton}
              >
                Clear Comparison
              </button>

            </div>

          </div>

        </section>

        {/* ================= MAIN ================= */}

        <section style={compareSection}>

          {/* ================= CARD GRID ================= */}

          <div style={compareGrid}>

            {cars.map((car) => {

              const isBest =
                car._id === bestId;

              return (

                <div
                  key={car._id}

                  style={{
                    ...compareCardWrapper,

                    ...(isBest
                      ? bestCompareCard
                      : {}),
                  }}
                >

                  {isBest && (

                    <div style={bestBadge}>
                      Best Value
                    </div>
                  )}

                  <CompactCarCard
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

                  <CompareInsightCard car={car} />

                </div>
              );
            })}

          </div>

          <CompareTrustPanel cars={cars} />

          <CompareScenarioPanel cars={cars} />

          {/* ================= SPEC TABLE ================= */}

          <div style={specSection}>

            <div style={specHeaderRow}>

              <h2 style={specHeading}>
                Detailed Specifications
              </h2>

              <div style={mobileHint}>
                ← Swipe horizontally →
              </div>

            </div>

            <div style={specTableWrapper}>

              <table style={specTable}>

                <thead>

                  <tr>

                    <th style={specHeaderLeft}>
                      Specifications
                    </th>

                    {cars.map((car) => {

                      const isBest =
                        car._id === bestId;

                      return (

                        <th
                          key={car._id}

                          style={{
                            ...specHeader,

                            ...(isBest
                              ? bestSpecHeader
                              : {}),
                          }}
                        >
                          {car.name}
                        </th>
                      );
                    })}

                  </tr>

                </thead>

                <tbody>

                  {/* ================= PRICE ================= */}

                  <tr>

                    <td style={specLabel}>
                      Starting Price
                    </td>

                    {cars.map((car) => {

                      const isBest =
                        car._id === bestId;

                      return (

                        <td
                          key={car._id}

                          style={{
                            ...specValue,

                            ...(isBest
                              ? bestSpecValue
                              : {}),
                          }}
                        >
                          {formatIndianPriceCompact(
                            car.startingPrice ||
                              0
                          )}
                        </td>
                      );
                    })}

                  </tr>

                  {/* ================= RANGE ================= */}

                  <tr>

                    <td style={specLabel}>
                      Driving Range
                    </td>

                    {cars.map((car) => {

                      const range =
                        car
                          .specifications
                          ?.range || 0;

                      const maxRange =
                        Math.max(

                          ...cars.map(
                            (c) =>

                              c
                                .specifications
                                ?.range || 0
                          )
                        );

                      return (

                        <td
                          key={car._id}

                          style={{
                            ...specValue,

                            ...(range === maxRange
                              ? greenHighlight
                              : {}),
                          }}
                        >
                          {range} km
                        </td>
                      );
                    })}

                  </tr>

                  {/* ================= BATTERY ================= */}

                  <tr>

                    <td style={specLabel}>
                      Battery Pack
                    </td>

                    {cars.map((car) => (

                      <td
                        key={car._id}

                        style={specValue}
                      >
                        {
                          car
                            .specifications
                            ?.batteryPack
                        }
                      </td>
                    ))}

                  </tr>

                  {/* ================= CHARGING ================= */}

                  <tr>

                    <td style={specLabel}>
                      Charging Time
                    </td>

                    {cars.map((car) => (

                      <td
                        key={car._id}

                        style={specValue}
                      >
                        {
                          car
                            .specifications
                            ?.chargingTime
                        }
                      </td>
                    ))}

                  </tr>

                  {/* ================= TOP SPEED ================= */}

                  <tr>

                    <td style={specLabel}>
                      Top Speed
                    </td>

                    {cars.map((car) => (

                      <td
                        key={car._id}

                        style={specValue}
                      >
                        {
                          car
                            .specifications
                            ?.topSpeed
                        }
                      </td>
                    ))}

                  </tr>

                </tbody>

              </table>

            </div>

          </div>

        </section>

      </div>

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
    "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",

  gap: "30px",

  alignItems: "stretch",
};

const compareCardWrapper = {
  position: "relative",
};

const bestCompareCard = {
  transform:
    "translateY(-6px)",
};

const bestBadge = {
  position: "absolute",

  top: "-14px",

  right: "18px",

  zIndex: 20,

  background:
    "linear-gradient(135deg, #16a34a, #15803d)",

  color: "white",

  padding: "10px 16px",

  borderRadius: "999px",

  fontSize: "12px",

  fontWeight: "700",

  boxShadow:
    "0 14px 28px rgba(22,163,74,0.28)",
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