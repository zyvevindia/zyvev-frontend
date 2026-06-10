import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import SeoHead from "../components/SEO/SeoHead";
import { buildHomePageMeta } from "../seo/pageMetadata";

import { API_URL_MISCONFIGURED_FOR_PROD } from "../config";
import { catalogUnavailableMessage } from "../utils/apiDiagnostics";

import { UPCOMING_EV_CATALOG } from "../data/upcomingEvCatalog";

import {
  aggregateModelFamilies,
  familyToListingCard,
  filterFamilies,
  sortFamilies,
} from "../utils/modelFamily";

import { fetchListingCatalogVariants } from "../utils/vehicleDetailResolver.js";
import { getCatalogBrandOptions } from "../utils/catalogListingBrands.js";


import HomeSection from "../components/HomeSection";

import HomeCategoryTiles from "../components/home/HomeCategoryTiles";

import {
  CatalogBodyTypeSelect,
  CatalogBrandSelect,
  CatalogPriceSelect,
} from "../components/discovery/CatalogFilterSelects";

import CompactCarCard from "../components/CompactCarCard";

import UpcomingCarCard from "../components/UpcomingCarCard";

import JsonLd from "../components/SEO/JsonLd";

import CarCardSkeleton from "../components/skeletons/CarCardSkeleton";

import useDebouncedValue from "../hooks/useDebouncedValue";

import "../styles/catalog-ux-wave-b.css";

/* =========================================================
   ===================== GLOBAL DATA ========================
   ========================================================= */

/* =========================================================
   ======================== HOME ============================
   ========================================================= */

export default function Home() {

  const navigate =
    useNavigate();

  const [variants, setVariants] =
    useState([]);

  const [loading,
    setLoading] =
    useState(true);

  const [error,
    setError] =
    useState("");

  const [fetchRetryKey, setFetchRetryKey] =
    useState(0);

  const [filters,
    setFilters] =
    useState({
      brand: "",
      priceRange: "",
      bodyType: "",
      sortBy: "",
      search: "",
    });

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 400);

  useEffect(() => {
    setFilters((prev) =>
      prev.search === debouncedSearch
        ? prev
        : { ...prev, search: debouncedSearch }
    );
  }, [debouncedSearch]);

  const allFamilies = useMemo(
    () => aggregateModelFamilies(variants),
    [variants]
  );

  const brands = useMemo(
    () => getCatalogBrandOptions(allFamilies),
    [allFamilies]
  );

  /* =========================================================
     =================== HOME SECTIONS DATA ==================
     ========================================================= */

  const families = useMemo(() => {
    const filtered = filterFamilies(allFamilies, filters);
    return sortFamilies(filtered, filters.sortBy);
  }, [allFamilies, filters]);

  const featuredFamilies = useMemo(
    () =>
      [...families]
        .filter((f) => f.isFeatured)
        .slice(0, 6),
    [families]
  );

  const premiumRangeFamilies = useMemo(
    () =>
      [...families]
        .sort((a, b) => b.maxRange - a.maxRange)
        .slice(0, 6),
    [families]
  );

  const popularFamilies = useMemo(
    () =>
      featuredFamilies.length > 0
        ? featuredFamilies
        : families.slice(0, 6),
    [featuredFamilies, families]
  );

  /* =========================================================
     ======================= FETCH CARS ======================
     ========================================================= */

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");

    (async () => {
      try {
        const normalized = await fetchListingCatalogVariants({
          limit: 120,
        });

        if (cancelled) return;

        if (!normalized.length) {
          throw new Error("empty catalog");
        }

        setVariants(normalized);
        setError("");
      } catch {
        if (cancelled) return;
        setVariants([]);
        setError(
          API_URL_MISCONFIGURED_FOR_PROD
            ? "Catalog API is misconfigured for production (localhost). Update VITE_API_URL on Vercel and redeploy."
            : catalogUnavailableMessage({})
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchRetryKey]);

  /* =========================================================
     ======================= SAVE COMPARE ====================
     ========================================================= */

  const renderFamilyCard = (family, badge) => {
    const card = familyToListingCard(family);

    return (
      <CompactCarCard
        key={family.familySlug}
        car={{
          ...card,
          badge:
            badge ||
            (family.variantCount > 1
              ? `${family.variantCount} variants`
              : undefined),
          range: family.maxRange,
          price: family.startingPrice,
        }}
      />
    );
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
      <SeoHead meta={buildHomePageMeta()} />

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
                  navigate("/cars?compareMode=true")
                }
              >
                Compare EVs
              </button>

            </div>

          </div>

        </section>

        <HomeCategoryTiles />

        {/* ================= FILTERS ================= */}

        <div style={filterSection}>

          <div style={filterWrapper}>

            <input
              type="search"

              placeholder="Search by EV or brand..."

              value={searchQuery}

              onChange={(e) =>
                setSearchQuery(e.target.value)
              }

              aria-label="Search electric vehicles"

              style={searchInput}
            />

            <CatalogBrandSelect
              value={filters.brand}
              onChange={(brand) =>
                setFilters({
                  ...filters,
                  brand,
                })
              }
              brands={brands}
              style={selectStyle}
            />

            <CatalogPriceSelect
              value={filters.priceRange}
              onChange={(priceRange) =>
                setFilters({
                  ...filters,
                  priceRange,
                })
              }
              style={selectStyle}
            />

            <CatalogBodyTypeSelect
              value={filters.bodyType}
              onChange={(bodyType) =>
                setFilters({
                  ...filters,
                  bodyType,
                })
              }
              style={selectStyle}
            />

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

              onClick={() => {
                setSearchQuery("");
                setFilters({
                  brand: "",
                  priceRange: "",
                  bodyType: "",
                  sortBy: "",
                  search: "",
                });
              }}
            >
              Reset
            </button>

          </div>

        </div>

        {/* ================= ERROR ================= */}

        {!loading &&
          error && (

            <div style={errorBox}>
              <p style={{ margin: "0 0 0.75rem" }}>{error}</p>
              <button
                type="button"
                onClick={() => setFetchRetryKey((k) => k + 1)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  border: "none",
                  background: "#2563eb",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Try again
              </button>
            </div>
          )}

        {/* ================= EMPTY ================= */}

        {!loading &&
          !error &&
          families.length === 0 && (

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

          ) : error ? null : (
            popularFamilies.map((family) =>
              renderFamilyCard(
                family,
                family.isFeatured
                  ? "Popular"
                  : "Trending"
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

          ) : error ? null : (
            premiumRangeFamilies.map((family) =>
              renderFamilyCard(family, "Long Range")
            )
          )}

        </HomeSection>

        {/* ================= UPCOMING ================= */}

        <HomeSection
          title="Upcoming EVs"

          subtitle="Stay ahead with upcoming electric vehicles expected to launch soon in India."

          viewAllLink="/upcoming"
          compactBottom
        >

          {UPCOMING_EV_CATALOG.map(
            (car) => (

              <UpcomingCarCard
                key={car._id}
                car={car}
              />
            )
          )}

        </HomeSection>

        {/* Curated sections end — homepage has no pagination */}

      </div>
    </>
  );
}

/* =========================================================
   ======================== STYLES ==========================
   ========================================================= */

const pageContainer = {
  minHeight: "100vh",
  background: "#f5f7fb",
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
