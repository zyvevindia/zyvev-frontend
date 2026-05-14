import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import Footer from "../components/Footer";

import CarCard from "../components/CarCard";

import CarCardSkeleton from "../components/skeletons/CarCardSkeleton";

import normalizeCar from "../utils/normalizeCar";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

/* =========================================================
   ===================== LISTING PAGE =======================
   ========================================================= */

export default function ListingPage() {

  const { category } =
    useParams();

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

        console.log(
          "Cars API Response:",
          data
        );

        const normalized =
          (data?.cars || []).map(
            normalizeCar
          );

        setCars(normalized);

      } catch (error) {

        console.error(error);

        setError(
          "Unable to load EV listings."
        );

      } finally {

        setLoading(false);
      }
    }

    fetchCars();

  }, []);

  /* =========================================================
     ===================== FILTERED DATA =====================
     ========================================================= */

  const filteredCars =
    useMemo(() => {

      let filtered = [...cars];

      /* ================= CATEGORY ================= */

      if (category) {

        filtered =
          filtered.filter(
            (car) =>
              car.category
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
              car.name
                ?.toLowerCase()
                .includes(
                  search.toLowerCase()
                ) ||

              car.brand
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
              car.brand === brand
          );
      }

      /* ================= SORT ================= */

      if (
        sortBy ===
        "price-low"
      ) {

        filtered.sort(
          (a, b) =>
            a.price - b.price
        );
      }

      if (
        sortBy ===
        "price-high"
      ) {

        filtered.sort(
          (a, b) =>
            b.price - a.price
        );
      }

      if (
        sortBy ===
        "range-high"
      ) {

        filtered.sort(
          (a, b) =>
            b.range - a.range
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
      cars
        .map(
          (car) => car.brand
        )
        .filter(Boolean)
    ),
  ];

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

      {/* ================= HERO ================= */}

      <section
        style={{
          background:
            "linear-gradient(135deg,#071129,#1d4ed8)",

          color: "white",

          padding:
            "100px 20px 70px",

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

            lineHeight: 1.7,
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
                  key={car._id}
                  car={car}
                />
              )
            )}

          </div>
        )}

      </section>

      <Footer />

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