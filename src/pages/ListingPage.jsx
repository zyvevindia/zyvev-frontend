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

import {
  aggregateModelFamilies,
  familyToListingCard,
  sortFamilies,
} from "../utils/modelFamily";

import { fetchListingCatalogVariants } from "../utils/vehicleDetailResolver.js";
import { getCatalogBrandOptions } from "../utils/catalogListingBrands.js";

import useCompareCars from "../hooks/useCompareCars";

import ListingCatalogMoreFilters from "../components/discovery/ListingCatalogMoreFilters";
import CatalogPagination from "../components/catalog/CatalogPagination";

import useDebouncedValue from "../hooks/useDebouncedValue";
import {
  paginateCatalogItems,
  parsePageFromParams,
  getCatalogTotalPages,
  resetPageInParams,
} from "../utils/catalogPagination.js";
import {
  parseListingSearchFromParams,
  parseListingBrandFromParams,
  parseListingSortFromParams,
  writeListingFiltersToParams,
  clearListingFilterParams,
} from "../utils/catalogListingUrl.js";

import {
  filterEnrichedFamilies,
  parseIntelligenceFiltersFromParams,
  writeIntelligenceFiltersToParams,
} from "../intelligence/filterMatcher.js";
import {
  parsePriceRangeFromParams,
  writePriceRangeToParams,
} from "../intelligence/catalogPriceFilters.js";
import { parseBodyTypeFilterId } from "../intelligence/bodyTypeCatalog.js";
import { trackSearchZeroResults } from "../analytics/funnel";
import { trackFilterUsed, trackSearchUsed } from "../analytics/traffic";

import "../styles/ev-discovery.css";
import "../styles/catalog-ux-wave-b.css";
import "../styles/catalog-listing-a11y.css";

import {
  resolveListingSegment,
  shouldFilterFamiliesByListingSegment,
  resolveListingCompareMode,
  isBrowseOnlyListingSegment,
  applyBrowseSegmentFamilies,
} from "../utils/listingBrowseMode";
import { UPCOMING_EV_CATALOG } from "../data/upcomingEvCatalog";
import UpcomingCarCard from "../components/UpcomingCarCard";

/* =========================================================
   ===================== LISTING PAGE =======================
   ========================================================= */

export default function ListingPage() {

  const { category } =
    useParams();

  const { pathname, hash } =
    useLocation();

  const navigate =
    useNavigate();

  const [searchParams, setSearchParams] =
    useSearchParams();

  const compareModeRequested =
    searchParams.get(
      "compareMode"
    ) === "true";

  const listingSegment = useMemo(
    () => resolveListingSegment(pathname, category),
    [pathname, category]
  );

  const browseOnlyListing = isBrowseOnlyListingSegment(listingSegment);

  const compareMode = resolveListingCompareMode(
    listingSegment,
    compareModeRequested
  );

  const [cars, setCars] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] = useState(() =>
    parseListingSearchFromParams(searchParams)
  );

  const [brand, setBrand] = useState(() =>
    parseListingBrandFromParams(searchParams)
  );

  const [sortBy, setSortBy] = useState(() =>
    parseListingSortFromParams(searchParams)
  );

  const debouncedSearch = useDebouncedValue(search, 400);
  const searchInputRef = useRef(null);

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

        const normalized = await fetchListingCatalogVariants({
          limit: 120,
        });

        if (!normalized.length) {
          throw new Error("Failed to fetch EVs");
        }

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

  const intelligenceFilterIds = useMemo(
    () => parseIntelligenceFiltersFromParams(searchParams),
    [searchParams]
  );

  const priceRange = useMemo(
    () => parsePriceRangeFromParams(searchParams),
    [searchParams]
  );

  const bodyType = searchParams.get("body") || "";

  useEffect(() => {
    if (!compareModeRequested) return;
    if (!listingSegment) return;
    if (browseOnlyListing) return;

    const next = new URLSearchParams(searchParams);
    next.delete("compareMode");
    setSearchParams(next, { replace: true });
  }, [
    compareModeRequested,
    listingSegment,
    browseOnlyListing,
    searchParams,
    setSearchParams,
  ]);

  const skipListingUrlSyncRef = useRef(false);

  useEffect(() => {
    if (skipListingUrlSyncRef.current) {
      skipListingUrlSyncRef.current = false;
      return;
    }
    setSearch(parseListingSearchFromParams(searchParams));
    setBrand(parseListingBrandFromParams(searchParams));
    setSortBy(parseListingSortFromParams(searchParams));
  }, [searchParams]);

  useEffect(() => {
    setSearchParams((prev) => {
      const next = writeListingFiltersToParams(
        { search: debouncedSearch, brand, sort: sortBy },
        prev
      );
      if (next.toString() === prev.toString()) return prev;
      skipListingUrlSyncRef.current = true;
      return next;
    }, { replace: true });
  }, [debouncedSearch, brand, sortBy, setSearchParams]);

  useEffect(() => {
    if (hash !== "#catalog-search") return;
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [hash]);

  const setPriceRange = (rangeId) => {
    const base = resetPageInParams(searchParams);
    const next = writePriceRangeToParams(rangeId, base);
    if (!compareMode && next.has("compareMode")) {
      next.delete("compareMode");
    }
    setSearchParams(next, { replace: true });
  };

  const setBodyType = (nextBodyType) => {
    const base = resetPageInParams(searchParams);
    const next = new URLSearchParams(base);
    if (nextBodyType) {
      next.set("body", nextBodyType);
    } else {
      next.delete("body");
    }
    const intel = parseIntelligenceFiltersFromParams(next).filter(
      (id) => !parseBodyTypeFilterId(id)
    );
    const merged = writeIntelligenceFiltersToParams(intel, next);
    if (!compareMode && merged.has("compareMode")) {
      merged.delete("compareMode");
    }
    setSearchParams(merged, { replace: true });
  };

  const families = useMemo(
    () => aggregateModelFamilies(cars),
    [cars]
  );

  const filteredFamilies = useMemo(() => {
    let list = filterEnrichedFamilies(families, {
      brand,
      search,
      priceRange,
      bodyType,
      intelligenceFilterIds,
    });

    if (shouldFilterFamiliesByListingSegment(listingSegment)) {
      list = list.filter((f) =>
        (f.category || "")
          .toLowerCase()
          .includes(String(listingSegment).toLowerCase())
      );
    }

    list = applyBrowseSegmentFamilies(list, listingSegment);

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
    listingSegment,
    search,
    brand,
    sortBy,
    priceRange,
    bodyType,
    intelligenceFilterIds,
  ]);

  const hasActiveListingFilters = useMemo(
    () =>
      Boolean(search?.trim()) ||
      Boolean(brand) ||
      Boolean(sortBy) ||
      Boolean(priceRange) ||
      Boolean(bodyType) ||
      intelligenceFilterIds.length > 0,
    [search, brand, sortBy, priceRange, bodyType, intelligenceFilterIds]
  );

  const showUpcomingCatalogFallback = useMemo(
    () =>
      listingSegment === "upcoming" &&
      !hasActiveListingFilters &&
      filteredFamilies.length === 0 &&
      UPCOMING_EV_CATALOG.length > 0,
    [listingSegment, hasActiveListingFilters, filteredFamilies.length]
  );

  const clearListingFilters = () => {
    setSearch("");
    setBrand("");
    setSortBy("");
    skipListingUrlSyncRef.current = true;
    setSearchParams(clearListingFilterParams(searchParams), {
      replace: true,
    });
  };

  const hasActiveMoreFilters = Boolean(brand) || Boolean(priceRange) || Boolean(bodyType);

  const clearMoreFilters = () => {
    skipListingUrlSyncRef.current = true;
    setBrand("");
    let next = resetPageInParams(searchParams);
    next = writeListingFiltersToParams(
      { search: debouncedSearch, brand: "", sort: sortBy },
      next
    );
    next = writePriceRangeToParams("", next);
    next.delete("body");
    const intel = parseIntelligenceFiltersFromParams(next).filter(
      (id) => !parseBodyTypeFilterId(id)
    );
    next = writeIntelligenceFiltersToParams(intel, next);
    if (!compareMode && next.has("compareMode")) {
      next.delete("compareMode");
    }
    setSearchParams(next, { replace: true });
  };

  const totalPages = useMemo(
    () => getCatalogTotalPages(filteredFamilies.length),
    [filteredFamilies.length]
  );

  const currentPage = useMemo(
    () => parsePageFromParams(searchParams, totalPages),
    [searchParams, totalPages]
  );

  const paginatedFamilies = useMemo(
    () => paginateCatalogItems(filteredFamilies, currentPage),
    [filteredFamilies, currentPage]
  );

  useEffect(() => {
    if (loading) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage, loading]);

  const lastSearchZeroKeyRef = useRef("");
  const lastSearchUsedKeyRef = useRef("");

  useEffect(() => {
    if (loading || error) return;
    const q = debouncedSearch.trim();
    if (!q || filteredFamilies.length === 0) return;
    const key = `${pathname}|${q}|${filteredFamilies.length}`;
    if (lastSearchUsedKeyRef.current === key) return;
    lastSearchUsedKeyRef.current = key;
    trackSearchUsed({
      query: q,
      resultCount: filteredFamilies.length,
      sourcePage: pathname || "/cars",
    });
  }, [loading, error, debouncedSearch, filteredFamilies.length, pathname]);

  const lastFilterKeyRef = useRef("");

  useEffect(() => {
    if (loading) return;
    const parts = [];
    if (brand) parts.push(`brand:${brand}`);
    if (sortBy && sortBy !== "default") parts.push(`sort:${sortBy}`);
    if (priceRange) parts.push(`price:${priceRange}`);
    if (bodyType) parts.push(`body:${bodyType}`);
    for (const id of intelligenceFilterIds) {
      parts.push(`intel:${id}`);
    }
    if (!parts.length) {
      lastFilterKeyRef.current = "";
      return;
    }
    const key = parts.join("|");
    if (lastFilterKeyRef.current === key) return;
    lastFilterKeyRef.current = key;
    trackFilterUsed({
      filterType: parts[0]?.split(":")[0] || "mixed",
      filterValue: key.slice(0, 120),
      activeCount: parts.length,
      sourcePage: pathname || "/cars",
    });
  }, [
    loading,
    brand,
    sortBy,
    priceRange,
    bodyType,
    intelligenceFilterIds,
    pathname,
  ]);

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

  const brands = useMemo(
    () => getCatalogBrandOptions(families),
    [families]
  );

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
        className="listing-page-hero"
        style={{
          background:
            "linear-gradient(135deg,#071129,#1d4ed8)",

          color: "white",

          padding:
            "clamp(72px, 14vw, 120px) clamp(16px, 4vw, 20px) clamp(48px, 10vw, 80px)",

          textAlign: "center",
        }}
      >

        <h1
          className="listing-page-hero__title"
          style={{
            fontSize: "clamp(1.75rem, 5vw + 0.5rem, 3.25rem)",

            fontWeight: "800",

            marginBottom: "clamp(12px, 2vw, 20px)",

            lineHeight: 1.15,

            padding: "0 clamp(8px, 3vw, 24px)",

            wordBreak: "break-word",
          }}
        >
          Explore Electric Vehicles
        </h1>

        <p
          className="listing-page-hero__subtitle"
          style={{
            fontSize: "clamp(1rem, 2.2vw + 0.35rem, 1.25rem)",

            opacity: 0.9,

            maxWidth: "800px",

            margin: "0 auto",

            lineHeight: 1.65,

            padding: "0 clamp(8px, 3vw, 16px)",
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
        className="listing-filter-bar"
        style={{
          maxWidth: "1300px",
          margin: "-28px auto 0 auto",
          padding: "0 20px",
          position: "relative",
          zIndex: 5,
        }}
      >
        <div className="listing-filter-card listing-filter-toolbar">
          <div className="listing-filter-search listing-filter-field">
            <label htmlFor="catalog-search" className="listing-filter-label">
              Search
            </label>
            <input
              id="catalog-search"
              ref={searchInputRef}
              type="search"
              placeholder="Search EV or brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="listing-filter-input"
              style={inputStyle}
              aria-label="Search electric vehicles by name or brand"
            />
          </div>

          <ListingCatalogMoreFilters
            brand={brand}
            brands={brands}
            onBrandChange={setBrand}
            priceRange={priceRange}
            onPriceRangeChange={setPriceRange}
            bodyType={bodyType}
            onBodyTypeChange={setBodyType}
            onClearFilters={clearMoreFilters}
            sortBy={sortBy}
            onSortChange={setSortBy}
            inputStyle={inputStyle}
            hasActiveFilters={hasActiveMoreFilters}
          />
        </div>
      </section>

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

            {compareMode && compareList.length >=
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
          margin: "32px auto 0",
          padding: compareMode ? "0 20px 84px" : "0 20px",
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

        ) : showUpcomingCatalogFallback ? (

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(320px,1fr))",
              gap: "30px",
            }}
          >
            {UPCOMING_EV_CATALOG.map((car) => (
              <UpcomingCarCard key={car._id} car={car} />
            ))}
          </div>

        ) : filteredFamilies.length ===
          0 ? (

          <div style={emptyState}>

            <h2 style={emptyTitle}>
              {listingSegment === "upcoming"
                ? "Upcoming EVs Coming Soon"
                : "No EVs Found"}
            </h2>

            <p style={emptyText}>
              {listingSegment === "upcoming"
                ? "We are adding more launch previews. Check back soon or browse the full catalog."
                : "Try adjusting filters, search, or explore EVSavari compare and guides."}
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

          <>
          {!loading && filteredFamilies.length > 0 ? (
            <p className="listing-results-status" role="status">
              <strong>{filteredFamilies.length}</strong> EV
              {filteredFamilies.length === 1 ? "" : "s"} match your filters
              {totalPages > 1 ? (
                <>
                  {" "}
                  · Page <strong>{currentPage}</strong> of{" "}
                  <strong>{totalPages}</strong>
                </>
              ) : null}
            </p>
          ) : null}

          <div
            style={{
              display: "grid",

              gridTemplateColumns:
                "repeat(auto-fit,minmax(320px,1fr))",

              gap: "30px",
            }}
          >

            {paginatedFamilies.map(
              (family, index) => {
                const card = familyToListingCard(family);

                return (
                  <CarCard
                    key={family.familySlug}
                    car={card}
                    compareList={compareList}
                    toggleCompare={toggleCompare}
                    compareModeActive={compareMode}
                    eagerImage={index < 4}
                  />
                );
              }
            )}

          </div>

          <CatalogPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredFamilies.length}
          />
          </>
        )}

      </section>

      <>

        {compareMode && compareList.length ===
          1 && (

          <div
            style={compareHelperBox}
          >
            Select 1 more EV to compare
          </div>
        )}

        {compareMode && compareList.length >=
          2 && (

          <button
            type="button"
            style={
              floatingCompareButton
            }
            onClick={openComparePage}
            aria-label={`Compare ${compareList.length} selected EVs`}
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






