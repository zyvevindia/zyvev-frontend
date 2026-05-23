import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useParams,
  useLocation,
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import CarCard from "../components/CarCard";
import SeoHead from "../components/SEO/SeoHead";
import { buildListingPageMeta } from "../seo/pageMetadata";

import CarCardSkeleton from "../components/skeletons/CarCardSkeleton";

import normalizeCar from "../utils/normalizeCar";

import {
  aggregateModelFamilies,
  familyToListingCard,
  sortFamilies,
} from "../utils/modelFamily";

import { API_URL } from "../config";

import { saveCompareCars } from "../utils/compareCarsStorage";

import { safeFetchJsonWithRetry } from "../utils/safeFetch";

import useCompareCars from "../hooks/useCompareCars";

import EvDiscoveryFilters from "../components/discovery/EvDiscoveryFilters";
import EvRecommendationWidget from "../components/discovery/EvRecommendationWidget";

import {
  filterEnrichedFamilies,
  parseIntelligenceFiltersFromParams,
  writeIntelligenceFiltersToParams,
} from "../intelligence/filterMatcher.js";
import { trackIntelligenceFilterApplied, trackSearchZeroResults } from "../analytics/funnel";

import "../styles/ev-discovery.css";

function resolveListingCategory(pathname, categoryParam) {
  if (categoryParam) return categoryParam;
  const segment = String(pathname || "")
    .replace(/^\//, "")
    .split("/")[0];
  if (
    ["bikes", "scooters", "popular", "latest", "upcoming"].includes(
      segment
    )
  ) {
    return segment;
  }
  return null;
}

/* =========================================================
   ===================== LISTING PAGE =======================
   ========================================================= */

export default function ListingPage() {

  const { category } =
    useParams();

  const { pathname } =
    useLocation();

  const navigate =
    useNavigate();

  const [searchParams, setSearchParams] =
    useSearchParams();

  const compareMode =
    searchParams.get(
      "compareMode"
    ) === "true";

  const [cars, setCars] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [brand, setBrand] =
    useState("");

  const [sortBy, setSortBy] =
    useState("");

  const [error, setError] =
    useState("");

  const [compareHint, setCompareHint] =
    useState("");

  const [fetchRetryKey, setFetchRetryKey] =
    useState(0);

  const {
    compareList,
    toggleCompare: toggleCompareCar,
  } = useCompareCars();

  /* =========================================================
     ======================= FETCH CARS ======================
     ========================================================= */

  useEffect(() => {

    async function fetchCars() {

      try {

        setLoading(true);

        setError("");

        const response = await safeFetchJsonWithRetry(
          `${API_URL}/cars?limit=50`,
          {
            label: "listing_catalog",
            timeoutMs: 18000,
          }
        );

        if (!response.ok) {
          throw new Error(
            response.error || "Failed to fetch EVs"
          );
        }

        const data = response.data;

        const normalized =
          (data?.cars || []).map(
            normalizeCar
          );

        setCars(normalized);

      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("ListingPage Error:", error);
        }

        setError(
          "Unable to load EV listings."
        );

      } finally {

        setLoading(false);
      }
    }

    fetchCars();

  }, [fetchRetryKey]);

  const toggleCompare = (car) => {
    const { limitReached } = toggleCompareCar(car);

    if (limitReached) {
      setCompareHint(
        "You can compare up to 3 EVs. Remove one to add another."
      );
      return;
    }

    setCompareHint("");
  };

  const openComparePage = () => {
    const list = saveCompareCars(compareList);
    navigate("/compare", {
      state: { cars: list },
    });
  };

  /* =========================================================
     ===================== FILTERED DATA =====================
     ========================================================= */

  const listingCategory = useMemo(
    () => resolveListingCategory(pathname, category),
    [pathname, category]
  );

  const intelligenceFilterIds = useMemo(
    () => parseIntelligenceFiltersFromParams(searchParams),
    [searchParams]
  );

  const setIntelligenceFilters = (ids) => {
    const next = writeIntelligenceFiltersToParams(
      ids,
      searchParams
    );
    setSearchParams(next, { replace: true });
  };

  const families = useMemo(
    () => aggregateModelFamilies(cars),
    [cars]
  );

  const filteredFamilies = useMemo(() => {
    let list = filterEnrichedFamilies(families, {
      brand,
      search,
      intelligenceFilterIds,
    });

    if (listingCategory) {
      list = list.filter((f) =>
        (f.category || "")
          .toLowerCase()
          .includes(listingCategory.toLowerCase())
      );
    }

    const sortKey =
      sortBy === "price-low"
        ? "priceLow"
        : sortBy === "price-high"
          ? "priceHigh"
          : sortBy === "range-high"
            ? "rangeHigh"
            : "";

    return sortFamilies(list, sortKey);
  }, [
    families,
    listingCategory,
    search,
    brand,
    sortBy,
    intelligenceFilterIds,
  ]);

  const hasActiveListingFilters = useMemo(
    () =>
      Boolean(search?.trim()) ||
      Boolean(brand) ||
      Boolean(sortBy) ||
      intelligenceFilterIds.length > 0,
    [search, brand, sortBy, intelligenceFilterIds]
  );

  const clearListingFilters = () => {
    setSearch("");
    setBrand("");
    setSortBy("");
    setIntelligenceFilters([]);
  };

  const lastSearchZeroKeyRef = useRef("");

  useEffect(() => {
    if (loading || error) return;
    const q = search.trim();
    if (!q) {
      lastSearchZeroKeyRef.current = "";
      return;
    }
    if (filteredFamilies.length > 0) return;
    const key = `${pathname}|${q}`;
    if (lastSearchZeroKeyRef.current === key) return;
    lastSearchZeroKeyRef.current = key;
    trackSearchZeroResults({ query: q, sourcePage: pathname || "/cars" });
  }, [loading, error, search, filteredFamilies.length, pathname]);

  /* =========================================================
     ======================= BRANDS ==========================
     ========================================================= */

  const brands = [

    ...new Set(
      (families || [])
        .map(
          (f) => f?.brand
        )
        .filter(Boolean)
    ),
  ];

  /* =========================================================
     ======================== SEO ============================
     ========================================================= */

  const seo = useMemo(
    () =>
      buildListingPageMeta({
        pathname: pathname || "/cars",
        category,
      }),
    [pathname, category]
  );

  /* =========================================================
     ========================= RENDER ========================
     ========================================================= */

  return (

    <div
      style={{
        background: "#f5f7fb",
        minHeight: "100vh",
      }}
    >

      <SeoHead meta={seo} />

      {/* ================= HERO ================= */}

      <section
        style={{
          background:
            "linear-gradient(135deg,#071129,#1d4ed8)",

          color: "white",

          padding:
            "120px 20px 80px",

          textAlign: "center",
        }}
      >

        <h1
          style={{
            fontSize: "52px",

            fontWeight: "800",

            marginBottom: "20px",
          }}
        >
          Explore Electric Vehicles
        </h1>

        <p
          style={{
            fontSize: "20px",

            opacity: 0.9,

            maxWidth: "800px",

            margin: "0 auto",

            lineHeight: "1.7",
          }}
        >
          Compare premium EVs,
          discover specifications,
          and find your next
          electric ride.
        </p>

      </section>

      {/* ================= FILTER BAR ================= */}

      <section
        style={{
          maxWidth: "1300px",

          margin:
            "-35px auto 0 auto",

          padding: "0 20px",

          position: "relative",

          zIndex: 5,
        }}
      >

        <div
          style={{
            background: "white",

            borderRadius: "24px",

            padding: "25px",

            display: "grid",

            gridTemplateColumns:
              "repeat(auto-fit,minmax(240px,1fr))",

            gap: "20px",

            boxShadow:
              "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >

          <input
            type="text"

            placeholder="Search by EV or brand..."

            value={search}

            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }

            style={inputStyle}
          />

          <select
            value={brand}

            onChange={(e) =>
              setBrand(
                e.target.value
              )
            }

            style={inputStyle}
          >

            <option value="">
              All Brands
            </option>

            {brands.map((b) => (

              <option
                key={b}
                value={b}
              >
                {b}
              </option>
            ))}

          </select>

          <select
            value={sortBy}

            onChange={(e) =>
              setSortBy(
                e.target.value
              )
            }

            style={inputStyle}
          >

            <option value="">
              Sort By
            </option>

            <option value="price-low">
              Price Low to High
            </option>

            <option value="price-high">
              Price High to Low
            </option>

            <option value="range-high">
              Best Range
            </option>

          </select>

          <EvDiscoveryFilters
            families={families}
            activeFilterIds={intelligenceFilterIds}
            onChange={setIntelligenceFilters}
            onFilterToggleAnalytics={(filterId, active) =>
              trackIntelligenceFilterApplied({
                filterId,
                active,
                sourcePage: pathname || "/cars",
                activeCount: intelligenceFilterIds.length,
              })
            }
          />

        </div>

      </section>

      {!compareMode && families.length > 0 && (
        <section
          style={{
            maxWidth: "1300px",
            margin: "24px auto 0",
            padding: "0 20px",
          }}
        >
          <EvRecommendationWidget
            families={families}
            sourcePage={pathname || "/cars"}
          />
        </section>
      )}

      {compareMode && (

        <section
          style={{
            maxWidth: "1300px",

            margin: "28px auto 0",

            padding: "0 20px",
          }}
        >

          <div
            style={{
              background:
                "linear-gradient(135deg,#eff6ff,#dbeafe)",

              border: "1px solid #93c5fd",

              borderRadius: "18px",

              padding: "16px 20px",

              color: "#0f172a",
            }}
          >

            <strong
              style={{
                fontSize: "15px",
              }}
            >
              Select 2–3 EVs to compare
            </strong>

            <p
              style={{
                margin: "8px 0 0",

                fontSize: "14px",

                lineHeight: 1.65,

                color: "#334155",
              }}
            >

              Tap{" "}

              <strong>
                Compare
              </strong>

              {" "}
              on the cards below. When you have at
              least two, use the floating{" "}

              <strong>
                Compare
              </strong>

              {" "}
              button to view them side by side.
            </p>

            {compareHint && (
              <p
                style={{
                  margin: "10px 0 0",
                  fontSize: "13px",
                  color: "#b45309",
                  fontWeight: 600,
                }}
              >
                {compareHint}
              </p>
            )}

            {compareList.length >=
              2 && (

              <button
                type="button"
                onClick={openComparePage}
                style={{
                  display: "inline-block",
                  marginTop: "12px",
                  fontWeight: 700,
                  color: "#1d4ed8",
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Open compare page →
              </button>
            )}

          </div>

        </section>

      )}

      {/* ================= LISTINGS ================= */}

      <section
        style={{
          maxWidth: "1300px",

          margin: "70px auto",

          padding: "0 20px",
        }}
      >

        {loading ? (

          <div
            style={{
              display: "grid",

              gridTemplateColumns:
                "repeat(auto-fit,minmax(320px,1fr))",

              gap: "30px",
            }}
          >

            {Array.from({
              length: 6,
            }).map((_, index) => (

              <CarCardSkeleton
                key={index}
              />
            ))}

          </div>

        ) : error ? (

          <div style={emptyState}>

            <h2 style={emptyTitle}>
              Something Went Wrong
            </h2>

            <p style={emptyText}>
              {error}
            </p>

            <button
              type="button"
              onClick={() => setFetchRetryKey((k) => k + 1)}
              style={{
                marginTop: "1rem",
                padding: "0.55rem 1.25rem",
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

        ) : filteredFamilies.length ===
          0 ? (

          <div style={emptyState}>

            <h2 style={emptyTitle}>
              No EVs Found
            </h2>

            <p style={emptyText}>
              Try adjusting filters, search, or explore EVSavari compare and guides.
            </p>

            <div
              style={{
                marginTop: "1.25rem",
                display: "flex",
                flexWrap: "wrap",
                gap: "0.75rem",
                justifyContent: "center",
              }}
            >
              {hasActiveListingFilters ? (
                <button
                  type="button"
                  onClick={clearListingFilters}
                  style={{
                    padding: "0.55rem 1.25rem",
                    borderRadius: "8px",
                    border: "none",
                    background: "#2563eb",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Clear filters and search
                </button>
              ) : null}
              <Link
                to="/compare"
                style={{
                  padding: "0.55rem 1.25rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  color: "#0f172a",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Open compare
              </Link>
              <Link
                to="/guides"
                style={{
                  padding: "0.55rem 1.25rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  color: "#0f172a",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Browse guides
              </Link>
            </div>
          </div>

        ) : (

          <div
            style={{
              display: "grid",

              gridTemplateColumns:
                "repeat(auto-fit,minmax(320px,1fr))",

              gap: "30px",
            }}
          >

            {filteredFamilies.map(
              (family) => {
                const card = familyToListingCard(family);
                const compareCar =
                  family.defaultVariant || card;

                return (
                  <CarCard
                    key={family.familySlug}
                    car={card}
                    compareList={compareList}
                    toggleCompare={toggleCompare}
                    compareModeActive={compareMode}
                  />
                );
              }
            )}

          </div>
        )}

      </section>

      <>

        {compareList.length ===
          1 && (

          <div
            style={compareHelperBox}
          >
            Select 1 more EV to compare
          </div>
        )}

        {compareList.length >=
          2 && (

          <button
            type="button"
            style={
              floatingCompareButton
            }
            onClick={openComparePage}
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
  );
}

/* =========================================================
   ========================= STYLES =========================
   ========================================================= */

const inputStyle = {

  height: "58px",

  borderRadius: "16px",

  border:
    "1px solid #dbe2ea",

  padding: "0 18px",

  fontSize: "16px",

  outline: "none",
};

const emptyState = {

  background: "white",

  borderRadius: "28px",

  padding: "60px 30px",

  textAlign: "center",

  boxShadow:
    "0 18px 40px rgba(15,23,42,0.06)",
};

const emptyTitle = {

  fontSize: "36px",

  fontWeight: "800",

  color: "#0f172a",

  marginBottom: "16px",
};

const emptyText = {

  color: "#64748b",

  fontSize: "16px",

  lineHeight: "1.8",
};

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