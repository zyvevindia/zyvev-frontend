import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
  useLocation,
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  Helmet,
} from "react-helmet-async";

import CarCard from "../components/CarCard";

import CarCardSkeleton from "../components/skeletons/CarCardSkeleton";

import normalizeCar from "../utils/normalizeCar";

import {
  API_URL,
  SITE_ORIGIN,
  APP_CONFIG,
} from "../config";

import {
  COMPARE_CARS_STORAGE_KEY,
  COMPARE_CARS_SYNC_EVENT,
  loadCompareCarsFromStorage,
} from "../utils/compareCarsStorage";

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

  const [searchParams] =
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

  const [compareList,
    setCompareList] =
    useState(
      loadCompareCarsFromStorage
    );

  /* =========================================================
     ======================= FETCH CARS ======================
     ========================================================= */

  useEffect(() => {

    async function fetchCars() {

      try {

        setLoading(true);

        setError("");

        const response =
          await fetch(
            `${API_URL}/cars`
          );

        if (!response.ok) {

          throw new Error(
            "Failed to fetch EVs"
          );
        }

        const data =
          await response.json();

        const normalized =
          (data?.cars || []).map(
            normalizeCar
          );

        setCars(normalized);

      } catch (error) {

        console.error(
          "ListingPage Error:",
          error
        );

        setError(
          "Unable to load EV listings."
        );

      } finally {

        setLoading(false);
      }
    }

    fetchCars();

  }, []);

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

  const toggleCompare =
    (car) => {

      setCompareList(
        (prev) => {

          if (
            prev.find(
              (c) =>
                c._id ===
                car._id
            )
          ) {

            return prev.filter(
              (c) =>
                c._id !==
                car._id
            );
          }

          if (
            prev.length >=
            3
          ) {

            alert(
              "Maximum 3 EVs can be compared."
            );

            return prev;
          }

          return [
            ...prev,

            car,
          ];
        }
      );
    };

  /* =========================================================
     ===================== FILTERED DATA =====================
     ========================================================= */

  const filteredCars =
    useMemo(() => {

      let filtered =
        Array.isArray(cars)
          ? [...cars]
          : [];

      /* ================= CATEGORY ================= */

      if (category) {

        filtered =
          filtered.filter(
            (car) =>
              car?.category
                ?.toLowerCase()
                .includes(
                  category.toLowerCase()
                )
          );
      }

      /* ================= SEARCH ================= */

      if (search) {

        filtered =
          filtered.filter(
            (car) =>
              car?.name
                ?.toLowerCase()
                .includes(
                  search.toLowerCase()
                ) ||

              car?.brand
                ?.toLowerCase()
                .includes(
                  search.toLowerCase()
                )
          );
      }

      /* ================= BRAND ================= */

      if (brand) {

        filtered =
          filtered.filter(
            (car) =>
              car?.brand === brand
          );
      }

      /* ================= SORT ================= */

      if (
        sortBy ===
        "price-low"
      ) {

        filtered.sort(
          (a, b) =>
            (a?.price || 0) -
            (b?.price || 0)
        );
      }

      if (
        sortBy ===
        "price-high"
      ) {

        filtered.sort(
          (a, b) =>
            (b?.price || 0) -
            (a?.price || 0)
        );
      }

      if (
        sortBy ===
        "range-high"
      ) {

        filtered.sort(
          (a, b) =>
            (b?.range || 0) -
            (a?.range || 0)
        );
      }

      return filtered;

    }, [
      cars,
      category,
      search,
      brand,
      sortBy,
    ]);

  /* =========================================================
     ======================= BRANDS ==========================
     ========================================================= */

  const brands = [

    ...new Set(
      (cars || [])
        .map(
          (car) => car?.brand
        )
        .filter(Boolean)
    ),
  ];

  /* =========================================================
     ======================== SEO ============================
     ========================================================= */

  const seo =
    useMemo(() => {

      const origin =
        SITE_ORIGIN;

      const path =
        pathname || "/cars";

      const normalizedPath =

        path.length > 1 &&
        path.endsWith("/")
          ? path.slice(0, -1)
          : path;

      const canonical =
        `${origin}${normalizedPath}`;

      const baseDesc =
        "Browse, filter, and compare electric cars, scooters, and bikes in India on EVSavari.";

      const byPath = {

        "/popular": {

          title:
            "Popular electric vehicles | EVSavari",

          description:
            `Discover trending and best-selling EVs in India. ${baseDesc}`,
        },

        "/latest": {

          title:
            "Latest electric vehicles | EVSavari",

          description:
            `New arrivals and recently listed electric vehicles. ${baseDesc}`,
        },

        "/upcoming": {

          title:
            "Upcoming electric vehicles | EVSavari",

          description:
            `Future EV launches and models to watch. ${baseDesc}`,
        },

        "/cars": {

          title:
            "Browse electric cars & EVs | EVSavari",

          description:
            `Explore electric cars and SUVs. ${baseDesc}`,
        },

        "/bikes": {

          title:
            "Electric bikes in India | EVSavari",

          description:
            `Compare electric two-wheelers and e-bikes. ${baseDesc}`,
        },

        "/scooters": {

          title:
            "Electric scooters in India | EVSavari",

          description:
            `Find e-scooters by range, price, and brand. ${baseDesc}`,
        },
      };

      const match =
        byPath[normalizedPath];

      if (match) {

        return {

          ...match,

          canonical,
        };
      }

      if (category) {

        const label =

          category
            .replace(
              /-/g,
              " "
            )
            .replace(
              /\b\w/g,
              (c) =>
                c.toUpperCase()
            );

        return {

          title:
            `${label} — Electric vehicles | EVSavari`,

          description:
            `${label} listings on EVSavari. ${baseDesc}`,

          canonical:
            `${origin}${normalizedPath}`,
        };
      }

      return {

        title:
          `Electric vehicles | ${APP_CONFIG.appName}`,

        description: baseDesc,

        canonical,
      };

    }, [
      pathname,
      category,
    ]);

  const ogImage =
    `${SITE_ORIGIN}/og-image.jpg`;

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

      <Helmet>

        <title>
          {seo.title}
        </title>

        <meta
          name="description"
          content={seo.description}
        />

        <link
          rel="canonical"
          href={seo.canonical}
        />

        <meta
          property="og:type"
          content="website"
        />

        <meta
          property="og:title"
          content={seo.title}
        />

        <meta
          property="og:description"
          content={seo.description}
        />

        <meta
          property="og:url"
          content={seo.canonical}
        />

        <meta
          property="og:image"
          content={ogImage}
        />

        <meta
          property="og:site_name"
          content={APP_CONFIG.appName}
        />

        <meta
          name="twitter:card"
          content="summary_large_image"
        />

        <meta
          name="twitter:title"
          content={seo.title}
        />

        <meta
          name="twitter:description"
          content={seo.description}
        />

        <meta
          name="twitter:image"
          content={ogImage}
        />

      </Helmet>

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

            {compareList.length >=
              2 && (

              <Link
                to="/compare"

                state={{
                  cars:
                    compareList,
                }}

                style={{
                  display:
                    "inline-block",

                  marginTop: "12px",

                  fontWeight: 700,

                  color: "#1d4ed8",

                  textDecoration: "none",
                }}
              >
                Open compare page →
              </Link>
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

          </div>

        ) : filteredCars.length ===
          0 ? (

          <div style={emptyState}>

            <h2 style={emptyTitle}>
              No EVs Found
            </h2>

            <p style={emptyText}>
              Try adjusting filters or
              search terms.
            </p>

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

            {filteredCars.map(
              (car) => (

                <CarCard
                  key={
                    car?._id ||
                    car?.id
                  }
                  car={car}
                  compareList={
                    compareList
                  }
                  toggleCompare={
                    toggleCompare
                  }
                  compareModeActive={
                    compareMode
                  }
                />
              )
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