import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import SEO from "../components/SEO/SEO";

import { API_URL } from "../config";

import { LOCAL_FALLBACK_EV } from "../utils/imageUtils";

import normalizeCar from "../utils/normalizeCar";

import {
  COMPARE_CARS_STORAGE_KEY,
  COMPARE_CARS_SYNC_EVENT,
  loadCompareCarsFromStorage,
} from "../utils/compareCarsStorage";

import HomeSection from "../components/HomeSection";

import CompactCarCard from "../components/CompactCarCard";

import UpcomingCarCard from "../components/UpcomingCarCard";

import JsonLd from "../components/SEO/JsonLd";

import CarCardSkeleton from "../components/skeletons/CarCardSkeleton";

/* =========================================================
   ===================== GLOBAL DATA ========================
   ========================================================= */

const upcomingCars = [
  {
    _id: "u1",

    name: "Tata Sierra EV",

    image: LOCAL_FALLBACK_EV,

    launchDate: "October 2025",

    price: 2500000,
  },

  {
    _id: "u2",

    name: "Mahindra BE.05",

    image:
      "https://cdn.evsavari.com/catalog/_fallbacks/mahindra-suv.jpg",

    launchDate: "December 2025",

    price: 2700000,
  },

  {
    _id: "u3",

    name: "Maruti eVX",

    image: LOCAL_FALLBACK_EV,

    launchDate: "January 2026",

    price: 2200000,
  },
];

/* =========================================================
   ======================== HOME ============================
   ========================================================= */

export default function Home() {

  const [page, setPage] =
    useState(1);

  const [totalPages,
    setTotalPages] =
    useState(1);

  const navigate =
    useNavigate();

  const [cars, setCars] =
    useState([]);

  const [loading,
    setLoading] =
    useState(true);

  const [error,
    setError] =
    useState("");

  const [compareList,
    setCompareList] =
    useState(
      loadCompareCarsFromStorage
    );

  const [filters,
    setFilters] =
    useState({
      brand: "",
      priceRange: "",
      sortBy: "",
      search: "",
    });

  /* =========================================================
     =================== HOME SECTIONS DATA ==================
     ========================================================= */

  const featuredCars =
    cars.filter(
      (car) =>
        car.isFeatured
    );

  const latestCars =
    [...cars]

      .sort(
        (a, b) =>
          new Date(
            b.createdAt
          ) -
          new Date(
            a.createdAt
          )
      )

      .slice(0, 6);

  const premiumRangeCars =
    [...cars]

      .sort(
        (a, b) =>

          (
            b.specifications
              ?.range || 0
          ) -

          (
            a.specifications
              ?.range || 0
          )
      )

      .slice(0, 6);

  /* =========================================================
     ======================= FETCH CARS ======================
     ========================================================= */

  useEffect(() => {

    const query =
      new URLSearchParams({
        ...filters,
        page,
        limit: 6,
      }).toString();

    setLoading(true);

    setError("");

    fetch(
      `${API_URL}/cars?${query}`
    )

      .then((res) =>
        res.json()
      )

      .then((data) => {

        setCars(
          (
            data.cars || []
          ).map(
            normalizeCar
          )
        );

        setTotalPages(
          data.totalPages || 1
        );

        setLoading(false);
      })

      .catch((err) => {

        console.error(err);

        setError(
          "Unable to load EV data right now."
        );

        setLoading(false);
      });

  }, [filters, page]);

  /* =========================================================
     ======================= SCROLL TOP ======================
     ========================================================= */

  useEffect(() => {

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

  }, [page]);

  /* =========================================================
     ======================= RESET PAGE ======================
     ========================================================= */

  useEffect(() => {

    setPage(1);

  }, [filters]);

  /* =========================================================
     ======================= SAVE COMPARE ====================
     ========================================================= */

  useEffect(() => {

    localStorage.setItem(
      COMPARE_CARS_STORAGE_KEY,

      JSON.stringify(
        compareList
      )
    );

  }, [compareList]);

  useEffect(() => {

    const onCompareSync =
      () => {

        setCompareList(
          loadCompareCarsFromStorage()
        );
      };

    window.addEventListener(
      COMPARE_CARS_SYNC_EVENT,

      onCompareSync
    );

    return () => {

      window.removeEventListener(
        COMPARE_CARS_SYNC_EVENT,

        onCompareSync
      );
    };
  }, []);

  /* =========================================================
     ======================= COMPARE =========================
     ========================================================= */

  const toggleCompare =
    (car) => {

      if (
        compareList.find(
          (c) =>
            c._id ===
            car._id
        )
      ) {

        setCompareList(
          compareList.filter(
            (c) =>
              c._id !==
              car._id
          )
        );

      } else {

        if (
          compareList.length >=
          3
        ) {

          alert(
            "Maximum 3 EVs can be compared."
          );

          return;
        }

        setCompareList([
          ...compareList,
          car,
        ]);
      }
    };

  /* =========================================================
     ======================= JSON-LD =========================
     ========================================================= */

  const homeSchema = {

    "@context":
      "https://schema.org",

    "@type":
      "WebSite",

    name:
      "EVSavari",

    url:
      "https://evsavari.com",

    description:
      "India's premium EV marketplace for electric cars, scooters and bikes.",

    potentialAction: {

      "@type":
        "SearchAction",

      target:
        "https://evsavari.com/cars?search={search_term_string}",

      "query-input":
        "required name=search_term_string",
    },
  };

  /* =========================================================
     ========================= RENDER ========================
     ========================================================= */

  return (

    <>
      <SEO
        title="EVSavari | India's Premium EV Marketplace"

        description="Explore electric cars, scooters and bikes in India. Compare EV prices, battery range, charging time, specifications and reviews on EVSavari."

        keywords="EV India, electric cars India, EV marketplace, Tata EV, MG EV, Mahindra EV, electric scooters, EVSavari"

        canonical="https://evsavari.com"
      />

      <JsonLd
        data={homeSchema}
      />

      <div style={pageContainer}>

        {/* ================= HERO ================= */}

        <section style={heroSection}>

          <div style={heroGlowLeft} />

          <div style={heroGlowRight} />

          <div style={heroOverlay}>

            <div style={heroBadge}>
              ⚡ India's Next-Gen EV Marketplace
            </div>

            <h1 style={heroTitle}>
              Discover The Future Of
              Electric Mobility
            </h1>

            <p style={heroSubtitle}>
              Compare premium EVs,
              calculate EMI,
              explore range,
              and connect with
              verified dealers —
              all in one place.
            </p>

            {/* ================= CTA ================= */}

            <div style={heroCTAWrapper}>

              <button
                style={primaryHeroButton}

                onClick={() =>
                  navigate("/cars")
                }
              >
                Explore EVs
              </button>

              <button
                style={secondaryHeroButton}

                onClick={() =>
                  navigate("/compare")
                }
              >
                Compare EVs
              </button>

            </div>

          </div>

        </section>

        {/* ================= FILTERS ================= */}

        <div style={filterSection}>

          <div style={filterWrapper}>

            <input
              type="text"

              placeholder="Search by EV or brand..."

              value={filters.search}

              onChange={(e) =>
                setFilters({
                  ...filters,

                  search:
                    e.target.value,
                })
              }

              style={searchInput}
            />

            <select
              value={filters.brand}

              onChange={(e) =>
                setFilters({
                  ...filters,

                  brand:
                    e.target.value,
                })
              }

              style={selectStyle}
            >

              <option value="">
                All Brands
              </option>

              <option value="Tata">
                Tata
              </option>

              <option value="MG">
                MG
              </option>

              <option value="Mahindra">
                Mahindra
              </option>

            </select>

            <select
              value={
                filters.priceRange
              }

              onChange={(e) =>
                setFilters({
                  ...filters,

                  priceRange:
                    e.target.value,
                })
              }

              style={selectStyle}
            >

              <option value="">
                All Prices
              </option>

              <option value="low">
                Below ₹10L
              </option>

              <option value="mid">
                ₹10L - ₹20L
              </option>

              <option value="high">
                Above ₹20L
              </option>

            </select>

            <select
              value={filters.sortBy}

              onChange={(e) =>
                setFilters({
                  ...filters,

                  sortBy:
                    e.target.value,
                })
              }

              style={selectStyle}
            >

              <option value="">
                Sort By
              </option>

              <option value="priceLow">
                Price: Low → High
              </option>

              <option value="priceHigh">
                Price: High → Low
              </option>

              <option value="rangeLow">
                Range: Low → High
              </option>

              <option value="rangeHigh">
                Range: High → Low
              </option>

            </select>

            <button
              style={secondaryButton}

              onClick={() =>
                setFilters({
                  brand: "",
                  priceRange: "",
                  sortBy: "",
                  search: "",
                })
              }
            >
              Reset
            </button>

          </div>

        </div>

        {/* ================= ERROR ================= */}

        {!loading &&
          error && (

            <div style={errorBox}>
              {error}
            </div>
          )}

        {/* ================= EMPTY ================= */}

        {!loading &&
          !error &&
          cars.length === 0 && (

            <div style={statusBox}>

              No EVs found matching your filters.

            </div>
          )}

        {/* ================= POPULAR ================= */}

        <HomeSection
          title="Most Popular EVs"

          subtitle="Explore India's most loved and trending electric vehicles."

          viewAllLink="/popular"
        >

          {loading ? (

            Array.from({
              length: 6,
            }).map(
              (_, index) => (

                <CarCardSkeleton
                  key={index}
                />
              )
            )

          ) : (

            !error &&

            (
              featuredCars.length >
              0

                ? featuredCars

                : cars
            )

              .slice(0, 6)

              .map((car) => (

                <CompactCarCard
                  key={car._id}

                  car={{
                    ...car,

                    badge:
                      car.isFeatured
                        ? "Popular"
                        : "Trending",
                  }}

                  onCompare={() =>
                    toggleCompare(
                      car
                    )
                  }
                />
              ))
          )}

        </HomeSection>

        {/* ================= LATEST ================= */}

        <HomeSection
          title="Recently Added EVs"

          subtitle="Fresh electric vehicle listings recently added to EVSavari."

          viewAllLink="/latest"
        >

          {loading ? (

            Array.from({
              length: 6,
            }).map(
              (_, index) => (

                <CarCardSkeleton
                  key={index}
                />
              )
            )

          ) : (

            !error &&

            latestCars.map(
              (car) => (

                <CompactCarCard
                  key={car._id}

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
                      "EV",

                    badge:
                      "New",
                  }}

                  onCompare={() =>
                    toggleCompare(
                      car
                    )
                  }
                />
              )
            )
          )}

        </HomeSection>

        {/* ================= LONG RANGE ================= */}

        <HomeSection
          title="Best Range EVs"

          subtitle="Electric vehicles offering the highest driving range in India."
        >

          {loading ? (

            Array.from({
              length: 6,
            }).map(
              (_, index) => (

                <CarCardSkeleton
                  key={index}
                />
              )
            )

          ) : (

            !error &&

            premiumRangeCars.map(
              (car) => (

                <CompactCarCard
                  key={car._id}

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
                      "EV",

                    badge:
                      "Long Range",
                  }}

                  onCompare={() =>
                    toggleCompare(
                      car
                    )
                  }
                />
              )
            )
          )}

        </HomeSection>

        {/* ================= UPCOMING ================= */}

        <HomeSection
          title="Upcoming EVs"

          subtitle="Stay ahead with upcoming electric vehicles expected to launch soon in India."

          viewAllLink="/upcoming"
        >

          {upcomingCars.map(
            (car) => (

              <UpcomingCarCard
                key={car._id}
                car={car}
              />
            )
          )}

        </HomeSection>

        {/* ================= PAGINATION ================= */}

        <div style={paginationWrapper}>

          <button
            disabled={page === 1}

            onClick={() =>
              setPage(page - 1)
            }

            style={secondaryButton}
          >
            ⬅ Prev
          </button>

          <span style={paginationText}>
            Page {page} of {totalPages}
          </span>

          <button
            disabled={
              page === totalPages
            }

            onClick={() =>
              setPage(page + 1)
            }

            style={secondaryButton}
          >
            Next ➡
          </button>

        </div>

        {/* ================= FLOATING COMPARE ================= */}

        <>
          {compareList.length ===
            1 && (

            <div style={compareHelperBox}>

              Select 1 more EV to compare

            </div>
          )}

          {compareList.length >=
            2 && (

            <button
              style={
                floatingCompareButton
              }

              onClick={() =>
                navigate(
                  "/compare",

                  {
                    state: {
                      cars:
                        compareList,
                    },
                  }
                )
              }
            >
              Compare (
              {
                compareList.length
              }
              )
            </button>
          )}
        </>

      </div>
    </>
  );
}

/* =========================================================
   ======================== STYLES ==========================
   ========================================================= */

const pageContainer = {
  minHeight: "100vh",
  background:
    "#f5f7fb",
  paddingBottom: "70px",
};

/* =========================================================
   ========================= HERO ===========================
   ========================================================= */

const heroSection = {
  position: "relative",
  overflow: "hidden",

  background:
    "linear-gradient(135deg, #020617 0%, #172554 52%, #2563eb 100%)",

  padding:
    "clamp(70px, 10vw, 130px) 20px clamp(60px, 8vw, 100px)",

  textAlign: "center",
};

const heroGlowLeft = {
  position: "absolute",
  top: "-160px",
  left: "-120px",
  width: "320px",
  height: "320px",

  background:
    "radial-gradient(circle, rgba(37,99,235,0.34), transparent 72%)",

  pointerEvents: "none",
};

const heroGlowRight = {
  position: "absolute",
  bottom: "-160px",
  right: "-120px",
  width: "320px",
  height: "320px",

  background:
    "radial-gradient(circle, rgba(96,165,250,0.26), transparent 72%)",

  pointerEvents: "none",
};

const heroOverlay = {
  position: "relative",
  zIndex: 5,
  maxWidth: "980px",
  margin: "0 auto",
};

const heroBadge = {
  display: "inline-flex",
  alignItems: "center",
  gap: "10px",

  background:
    "rgba(255,255,255,0.10)",

  color: "#dbeafe",

  padding: "12px 18px",

  borderRadius: "999px",

  fontWeight: "700",

  fontSize: "14px",

  marginBottom: "28px",

  backdropFilter:
    "blur(12px)",

  border:
    "1px solid rgba(255,255,255,0.12)",
};

const heroTitle = {
  fontSize:
    "clamp(42px, 7vw, 74px)",

  fontWeight: "800",

  lineHeight: "1.02",

  color: "white",

  letterSpacing: "-1.8px",

  marginBottom: "26px",
};

const heroSubtitle = {
  fontSize:
    "clamp(17px, 2.2vw, 22px)",

  lineHeight: "1.9",

  color: "#dbeafe",

  maxWidth: "760px",

  margin: "0 auto",

  fontWeight: "400",
};

const heroCTAWrapper = {
  marginTop: "38px",

  display: "flex",

  justifyContent: "center",

  gap: "16px",

  flexWrap: "wrap",
};

const primaryHeroButton = {
  background:
    "linear-gradient(135deg, #2563eb, #1d4ed8)",

  color: "white",

  border: "none",

  padding: "16px 28px",

  borderRadius: "18px",

  cursor: "pointer",

  fontWeight: "700",

  fontSize: "15px",

  boxShadow:
    "0 18px 38px rgba(37,99,235,0.32)",
};

const secondaryHeroButton = {
  background:
    "rgba(255,255,255,0.08)",

  color: "white",

  border:
    "1px solid rgba(255,255,255,0.12)",

  padding: "16px 28px",

  borderRadius: "18px",

  cursor: "pointer",

  fontWeight: "700",

  fontSize: "15px",

  backdropFilter:
    "blur(12px)",
};

/* =========================================================
   ========================= FILTERS ========================
   ========================================================= */

const filterSection = {
  marginTop: "-34px",
  padding: "0 18px",
  position: "relative",
  zIndex: 20,
};

const filterWrapper = {
  background:
    "rgba(255,255,255,0.96)",

  backdropFilter:
    "blur(14px)",

  maxWidth: "1260px",

  margin: "0 auto",

  padding: "24px",

  borderRadius: "30px",

  boxShadow:
    "0 20px 54px rgba(15,23,42,0.08)",

  display: "flex",

  gap: "14px",

  flexWrap: "wrap",

  justifyContent: "center",

  alignItems: "center",

  border:
    "1px solid rgba(255,255,255,0.5)",
};

const searchInput = {
  padding: "16px 18px",

  minWidth: "220px",

  flex: "1 1 320px",

  borderRadius: "18px",

  border:
    "1px solid #dbe2ea",

  outline: "none",

  fontSize: "15px",

  width: "100%",

  maxWidth: "360px",

  boxSizing: "border-box",

  background: "#f8fafc",
};

const selectStyle = {
  padding: "16px 18px",

  borderRadius: "18px",

  border:
    "1px solid #dbe2ea",

  outline: "none",

  fontSize: "15px",

  minWidth: "160px",

  flex: "1 1 190px",

  boxSizing: "border-box",

  background: "#f8fafc",
};

/* =========================================================
   ========================= BUTTONS ========================
   ========================================================= */

const secondaryButton = {
  background: "#0f172a",

  color: "white",

  border: "none",

  padding: "15px 22px",

  borderRadius: "16px",

  cursor: "pointer",

  fontWeight: "700",

  fontSize: "14px",

  whiteSpace: "nowrap",
};

/* =========================================================
   ======================== PAGINATION ======================
   ========================================================= */

const paginationWrapper = {
  display: "flex",

  justifyContent: "center",

  alignItems: "center",

  gap: "18px",

  flexWrap: "wrap",

  padding:
    "34px 20px 10px",
};

const paginationText = {
  fontWeight: "700",

  color: "#0f172a",

  fontSize: "15px",

  background: "white",

  padding: "12px 18px",

  borderRadius: "16px",

  boxShadow:
    "0 8px 20px rgba(15,23,42,0.05)",
};

/* =========================================================
   ==================== FLOATING COMPARE ===================
   ========================================================= */

const compareHelperBox = {
  position: "fixed",

  bottom: "22px",

  right: "22px",

  background:
    "rgba(15,23,42,0.92)",

  color: "white",

  padding: "14px 18px",

  borderRadius: "18px",

  fontWeight: "600",

  fontSize: "14px",

  backdropFilter:
    "blur(14px)",

  boxShadow:
    "0 14px 34px rgba(0,0,0,0.24)",

  zIndex: 999,

  border:
    "1px solid rgba(255,255,255,0.08)",

  maxWidth: "280px",

  lineHeight: "1.5",
};

const floatingCompareButton = {
  position: "fixed",

  bottom: "22px",

  right: "22px",

  background:
    "linear-gradient(135deg, #2563eb, #1d4ed8)",

  color: "white",

  border: "none",

  padding: "16px 24px",

  borderRadius: "18px",

  cursor: "pointer",

  fontWeight: "700",

  fontSize: "15px",

  boxShadow:
    "0 16px 36px rgba(37,99,235,0.34)",

  zIndex: 1000,
};

/* =========================================================
   ====================== STATUS / ERROR ===================
   ========================================================= */

const statusBox = {
  maxWidth: "1200px",

  margin: "40px auto 10px",

  background: "white",

  padding: "24px",

  borderRadius: "24px",

  textAlign: "center",

  fontWeight: "600",

  color: "#334155",

  boxShadow:
    "0 10px 30px rgba(15,23,42,0.05)",
};

const errorBox = {
  maxWidth: "1200px",

  margin: "40px auto 10px",

  background: "#fef2f2",

  color: "#b91c1c",

  padding: "24px",

  borderRadius: "24px",

  textAlign: "center",

  fontWeight: "700",

  border:
    "1px solid #fecaca",
};