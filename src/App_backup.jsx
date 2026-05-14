import {
  lazy,
  Suspense,
  useEffect,
  useState,
} from "react";

import {
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { API_URL } from "./config";


/* =========================================================
   ===================== LAZY IMPORTS ======================
   ========================================================= */

const Admin = lazy(() =>
  import("./Admin")
);

const Login = lazy(() =>
  import("./Login")
);

const PrivateRoute = lazy(() =>
  import("./PrivateRoute")
);

const Users = lazy(() =>
  import("./pages/Users")
);

const SalesDashboard = lazy(() =>
  import("./pages/SalesDashboard")
);

const KanbanBoard = lazy(() =>
  import("./pages/KanbanBoard")
);

const CarDetails = lazy(() =>
  import("./pages/CarDetails")
);

const SalesAnalytics = lazy(() =>
  import("./pages/SalesAnalytics")
);

const ListingPage = lazy(() =>
  import("./pages/ListingPage")
);

/* =========================================================
   ================= NORMAL IMPORTS ========================
   ========================================================= */

//import Navbar from "./components/Navbar";

//import Footer from "./components/Footer";

import ScrollToTop from "./components/ScrollToTop";

import HomeSection from "./components/HomeSection";

import CarCard from "./components/CarCard";

import CompactCarCard from "./components/CompactCarCard";

import UpcomingCarCard from "./components/UpcomingCarCard";


/* =========================================================
   ===================== GLOBAL DATA ========================
   ========================================================= */

const upcomingCars = [
  {
    _id: "u1",
    name: "Tata Sierra EV",
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop",
    launchDate: "October 2025",
    price: 2500000,
  },

  {
    _id: "u2",
    name: "Mahindra BE.05",
    image:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1200&auto=format&fit=crop",
    launchDate: "December 2025",
    price: 2700000,
  },

  {
    _id: "u3",
    name: "Maruti eVX",
    image:
      "https://images.unsplash.com/photo-1553440569-bcc63803a83d?q=80&w=1200&auto=format&fit=crop",
    launchDate: "January 2026",
    price: 2200000,
  },
];




/* =========================================================
   ======================= HOME PAGE ========================
   ========================================================= */

function Home() {
  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();
  const location = useLocation();

  const [cars, setCars] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [compareList, setCompareList] = useState(() => {
    const saved = localStorage.getItem("compareCars");

    return saved ? JSON.parse(saved) : [];
  });

  const [filters, setFilters] = useState({
    brand: "",
    priceRange: "",
    sortBy: "",
    search: "",
  });

    /* =========================================================
     =================== HOME SECTIONS DATA ==================
     ========================================================= */

const featuredCars = cars.filter(
  (car) => car.isFeatured
);

const latestCars = [...cars]
  .sort(
    (a, b) =>
      new Date(b.createdAt) -
      new Date(a.createdAt)
  )
  .slice(0, 6);

const premiumRangeCars = [...cars]
  .sort(
    (a, b) =>
      (b.specifications?.range || 0) -
      (a.specifications?.range || 0)
  )
  .slice(0, 6);



  /* =========================================================
     ======================= FETCH CARS =======================
     ========================================================= */

    useEffect(() => {
      const query = new URLSearchParams({
        ...filters,
        page,
        limit: 6,
      }).toString();

      setLoading(true);

      setError("");

      fetch(`${API_URL}/cars?${query}`)
        .then((res) => res.json())
        .then((data) => {
          setCars(data.cars || []);

          setTotalPages(
            data.totalPages || 1
          );

          setLoading(false);
        })
        .catch((err) => {
          console.log(err);

          setError(
            "Unable to load EV data right now."
          );

          setLoading(false);
        });
    }, [filters, page]);

    useEffect(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, [page]);

  /* =========================================================
     ======================= RESET PAGE =======================
     ========================================================= */

  useEffect(() => {
    setPage(1);
  }, [filters]);

  /* =========================================================
     ======================= SAVE COMPARE =====================
     ========================================================= */

  useEffect(() => {
    localStorage.setItem(
      "compareCars",
      JSON.stringify(compareList)
    );
  }, [compareList]);

  /* =========================================================
     ======================= COMPARE ==========================
     ========================================================= */

  const toggleCompare = (car) => {
    if (compareList.find((c) => c._id === car._id)) {
      setCompareList(
        compareList.filter(
          (c) => c._id !== car._id
        )
      );
    } else {
      if (compareList.length < 3) {
        setCompareList([
          ...compareList,
          car,
        ]);
      }
    }
  };



  /* =========================================================
     ======================= RENDER ===========================
     ========================================================= */

  return (

      

    <div style={pageContainer}>
      {/* ================= HERO SECTION ================= */}

      <section style={heroSection}>
        <div style={heroOverlay}>
          <h1 style={heroTitle}>
            Discover The Future of Electric Mobility
          </h1>

          <p style={heroSubtitle}>
            Compare premium EVs, calculate EMI,
            and connect with verified dealers —
            all in one place.
          </p>
        </div>
      </section>

      {/* ================= FILTER SECTION ================= */}

      <div style={filterSection}>
        <div style={filterWrapper}>
          <input
            type="text"
            placeholder="Search by car or brand..."
            value={filters.search}
            onChange={(e) =>
              setFilters({
                ...filters,
                search: e.target.value,
              })
            }
            style={searchInput}
          />

          <select
            value={filters.brand}
            onChange={(e) =>
              setFilters({
                ...filters,
                brand: e.target.value,
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
            value={filters.priceRange}
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
                sortBy: e.target.value,
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
        

        {/* ================= LOADING ================= */}

        {loading && (
          <div style={statusBox}>
            Loading EV marketplace...
          </div>
        )}

        {/* ================= ERROR ================= */}

        {!loading && error && (
          <div style={errorBox}>
            {error}
          </div>
        )}

        {/* ================= EMPTY ================= */}

        {!loading &&
          !error &&
          cars.length === 0 && (
            <div style={statusBox}>
              No EVs found matching your
              filters.
            </div>
          )}

        {/* ================= MOST SEARCHED EVS ================= */}

        {/* ================= MOST POPULAR EVS ================= */}

        <HomeSection
          title="Most Popular EVs"
          subtitle="Explore India's most loved and trending electric vehicles."
          viewAllLink="/popular"
        >
          {!loading &&
            !error &&
            (featuredCars.length > 0
              ? featuredCars
              : cars
            ).slice(0, 6).map((car) => (

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
                    car.specifications
                      ?.range || 0,

                  battery:
                    car.specifications
                      ?.batteryPack ||
                    "EV",

                  badge:
                    car.isFeatured
                      ? "Popular"
                      : "Trending",
                }}
              />
            ))}
        </HomeSection>

        {/* ================= RECENTLY ADDED EVS ================= */}

        <HomeSection
          title="Recently Added EVs"
          subtitle="Fresh electric vehicle listings recently added to EVSavari."
          viewAllLink="/latest"
        >
          {!loading &&
            !error &&
            latestCars.map((car) => (

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
                    car.specifications
                      ?.range || 0,

                  battery:
                    car.specifications
                      ?.batteryPack ||
                    "EV",

                  badge: "New",
                }}
              />
            ))}
        </HomeSection>

        {/* ================= LONG RANGE EVS ================= */}

        <HomeSection
          title="Best Range EVs"
          subtitle="Electric vehicles offering the highest driving range in India."
        >
          {!loading &&
            !error &&
            premiumRangeCars.map((car) => (

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
                    car.specifications
                      ?.range || 0,

                  battery:
                    car.specifications
                      ?.batteryPack ||
                    "EV",

                  badge: "Long Range",
                }}
              />
            ))}
        </HomeSection>

        {/* ================= UPCOMING EVS ================= */}

        <HomeSection
          title="Upcoming EVs"
          subtitle="Stay ahead with upcoming electric vehicles expected to launch soon in India."
          viewAllLink="/upcoming"
        >
          {upcomingCars.map((car) => (
            <UpcomingCarCard
              key={car._id}
              car={car}
            />
          ))}
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


      {/* ================= FLOATING COMPARE CTA ================= */}

        
          <>
            {compareList.length === 1 && (
              <div style={compareHelperBox}>
                Select 1 more EV to compare
              </div>
            )}

            {compareList.length >= 2 && (
              <button
                style={floatingCompareButton}
                onClick={() => navigate("/compare")}
              >
                Compare ({compareList.length})
              </button>
            )}
          </>

    </div>
    
  );
}

/* =========================================================
   ===================== DETAILS PAGE =======================
   ========================================================= */


/* =========================================================
   ===================== COMPARE PAGE =======================
   ========================================================= */

function ComparePage() {
  const navigate = useNavigate();

  const location = useLocation();

  const cars =
    location.state?.cars ||
    JSON.parse(
      localStorage.getItem(
        "compareCars"
      )
    ) ||
    [];

  if (cars.length === 0) {
    return (
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
            onClick={() =>
              navigate("/")
            }
            style={primaryButton}
          >
            Explore EVs
          </button>
        </div>
      </div>
    );
  }

  const getBestValueId = (
    cars
  ) => {

    let best = cars[0];

    let bestScore =
      (best.startingPrice || 1) /
      (
        best.specifications
          ?.range || 1
      );

    cars.forEach((c) => {

      const score =
        (c.startingPrice || 1) /
        (
          c.specifications
            ?.range || 1
        );

      if (score < bestScore) {

        best = c;

        bestScore = score;
      }
    });

    return best._id;
  };

  const bestId =
    getBestValueId(cars);

  return (
    <div style={comparePage}>
      {/* ================= HERO ================= */}

      <section style={compareHeroSection}>
        <div style={compareHeroGlow} />

        <div style={compareHeroContent}>
          <div style={compareBadge}>
            Premium EV Comparison
          </div>

          <h1 style={compareHeroTitle}>
            Compare Electric Vehicles
          </h1>

          <p style={compareHeroSubtitle}>
            Compare pricing, battery,
            driving range, and premium EV
            features side by side to make
            smarter buying decisions.
          </p>
        </div>
      </section>

      {/* ================= CAR GRID ================= */}

      <section style={compareSection}>
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

                <CarCard
                  car={car}
                  compareList={cars}
                  toggleCompare={() => {}}
                />
              </div>
            );
          })}
        </div>

        {/* ================= SPECS TABLE ================= */}

        <div style={specSection}>
          <h2 style={specHeading}>
            Detailed Comparison
          </h2>

          <div style={specTableWrapper}>
            <table style={specTable}>
              <thead>
                <tr>
                  <th style={specHeaderLeft}>
                    Specification
                  </th>

                  {cars.map((car) => (
                    <th
                      key={car._id}
                      style={
                        car._id === bestId
                          ? {
                              ...specHeader,
                              ...bestSpecHeader,
                            }
                          : specHeader
                      }
                    >
                      {car.name}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td style={specLabel}>
                    Price
                  </td>

                  {cars.map((car) => (
                    <td
                      key={car._id}
                      style={
                        car._id === bestId
                          ? {
                              ...specValue,
                              ...bestSpecValue,
                            }
                          : specValue
                      }
                    >
                      ₹
                      {(
                        car.startingPrice || 0
                      ).toLocaleString()}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td style={specLabel}>
                    Driving Range
                  </td>

                  {cars.map((car) => (
                    <td
                      key={car._id}
                      style={
                        (car.specifications?.range || 0) ===
                        Math.max(
                          ...cars.map(
                            (c) =>
                              c.specifications
                                ?.range || 0
                          )
                        )
                          ? {
                              ...specValue,
                              ...greenHighlight,
                            }
                          : specValue
                      }
                    >
                      ⚡ {
                        car.specifications
                          ?.range || 0
                      } km
                    </td>
                  ))}
                </tr>

                <tr>
                  <td style={specLabel}>
                    Battery
                  </td>

                  {cars.map((car) => (
                    <td
                      key={car._id}
                      style={specValue}
                    >
                      🔋 {
                        car.specifications
                          ?.batteryPack ||
                        "EV Battery"
                      }
                    </td>
                  ))}
                </tr>

                <tr>
                  <td style={specLabel}>
                    Charging Time
                  </td>

                  {cars.map((car) => (
                    <td
                      key={car._id}
                      style={specValue}
                    >
                      ⚡ {
                        car.specifications
                          ?.chargingTime ||
                        "N/A"
                      }
                    </td>
                  ))}
                </tr>

                <tr>
                  <td style={specLabel}>
                    Top Speed
                  </td>

                  {cars.map((car) => (
                    <td
                      key={car._id}
                      style={specValue}
                    >
                      🚀 {
                        car.specifications
                          ?.topSpeed ||
                        "N/A"
                      }
                    </td>
                  ))}
                </tr>

                <tr>
                  <td style={specLabel}>
                    Brand
                  </td>

                  {cars.map((car) => (
                    <td
                      key={car._id}
                      style={specValue}
                    >
                      {car.brand}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= ACTION BUTTONS ================= */}

        <div style={compareButtons}>
          <button
            onClick={() => {
              localStorage.removeItem(
                "compareCars"
              );

              navigate("/");
            }}
            style={{
              ...secondaryButton,
              background:
                "linear-gradient(135deg, #dc2626, #b91c1c)",
            }}
          >
            Clear Compare
          </button>

          <button
            onClick={() =>
              navigate("/")
            }
            style={primaryButton}
          >
            ← Back to Marketplace
          </button>
        </div>
      </section>
    </div>
  );
}


/* =========================================================
   ==================== ROUTE LOADER =======================
   ========================================================= */

function RouteLoader() {
  return (
    <div style={routeLoaderWrapper}>
      <div style={routeLoaderCard}>
        <div style={routeLoaderLogo}>
          ⚡
        </div>

        <h2 style={routeLoaderTitle}>
          Loading EVSavari
        </h2>

        <p style={routeLoaderText}>
          Preparing premium EV experience...
        </p>

        <div style={routeSpinner} />
      </div>
    </div>
  );
}


/* =========================================================
   ======================= APP ROUTES =======================
   ========================================================= */

export default function App() {
  return (
    <>
      <ScrollToTop />
      {/* <Navbar /> */}

      <Suspense
        fallback={<RouteLoader />}
      >
        <Routes>
        {/* ================= PUBLIC ================= */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/car/:slug"
          element={<CarDetails />}
        />

        <Route
          path="/compare"
          element={<ComparePage />}
        />

        <Route
          path="/popular"
          element={
            <ListingPage
              title="Live EV Marketplace"
              subtitle="Dynamic EV inventory powered by EVSavari."
              cars={[]}
            />
          }
        />

        <Route
          path="/latest"
          element={
            <ListingPage
              title="Latest EV Launches"
              subtitle="Recently added electric vehicles from the live EVSavari platform."
              cars={[]}
            />
          }
        />

        <Route
          path="/upcoming"
          element={
            <ListingPage
              title="Upcoming EVs"
              subtitle="Stay ahead with upcoming electric vehicles expected to launch soon in India."
              cars={upcomingCars}
              upcoming={true}
            />
          }
        />

        <Route
          path="/login"
          element={<Login />}
        />



        {/* ================= ADMIN ================= */}

        <Route
          path="/admin"
          element={
            <PrivateRoute
              allowedRoles={[
                "admin",
                "sales",
              ]}
            >
              <Admin />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <PrivateRoute
              allowedRoles={[
                "admin",
              ]}
            >
              <Users />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/analytics"
          element={
            <PrivateRoute
              allowedRoles={[
                "admin",
              ]}
            >
              <Admin />
            </PrivateRoute>
          }
        />

        {/* ================= SALES ================= */}

        <Route
          path="/sales"
          element={
            <PrivateRoute
              allowedRoles={[
                "sales",
              ]}
            >
              <SalesDashboard />
            </PrivateRoute>
          }
        />

        {/* ================= KANBAN ================= */}

        <Route
          path="/kanban"
          element={
            <PrivateRoute
              allowedRoles={[
                "admin",
                "sales",
              ]}
            >
              <KanbanBoard />
            </PrivateRoute>
          }
        />

        <Route
          path="/sales-analytics"
          element={<SalesAnalytics />}
        />

        <Route
          path="*"
          element={
            <div style={notFoundWrapper}>
              <div style={notFoundCard}>
                <div style={notFoundIcon}>
                  ⚡
                </div>

                <h1 style={notFoundTitle}>
                  404
                </h1>

                <p style={notFoundText}>
                  The page you are looking for
                  does not exist.
                </p>

                <button
                  onClick={() =>
                    window.location.href = "/"
                  }
                  style={primaryButton}
                >
                  Back to Home
                </button>
              </div>
            </div>
          }
        />

        </Routes>
      </Suspense>

      {/* <Footer /> */}
    </>
  );
}

/* =========================================================
   ======================= STYLES ===========================
   ========================================================= */

const pageContainer = {
  minHeight: "100vh",
  background: "#f5f7fb",
  paddingBottom: "60px",
};

const heroSection = {
  background:
    "linear-gradient(135deg, #0f172a 0%, #172554 55%, #2563eb 100%)",
  padding:
    "clamp(60px, 8vw, 110px) 20px clamp(55px, 7vw, 90px)",
  textAlign: "center",
  position: "relative",
  overflow: "hidden",
};

const heroOverlay = {
  maxWidth: "980px",
  margin: "0 auto",
  padding: "0 10px",
};

const heroTitle = {
  fontSize: "clamp(38px, 6vw, 66px)",
  fontWeight: "800",
  color: "white",
  lineHeight: "1.05",
  marginBottom: "24px",
  letterSpacing: "-1px",
};

const heroSubtitle = {
  fontSize: "clamp(16px, 2vw, 21px)",
  lineHeight: "1.9",
  color: "#dbeafe",
  maxWidth: "760px",
  margin: "0 auto",
  fontWeight: "400",
};

const filterSection = {
  marginTop: "-28px",
  padding: "0 20px",
  position: "relative",
  zIndex: 20,
};

const filterWrapper = {
  background: "rgba(255,255,255,0.96)",
  backdropFilter: "blur(14px)",
  maxWidth: "1240px",
  margin: "0 auto",
  padding: "24px",
  borderRadius: "26px",
  boxShadow:
    "0 18px 50px rgba(15,23,42,0.08)",
  display: "flex",
  gap: "14px",
  flexWrap: "wrap",
  justifyContent: "center",
  alignItems: "center",
  border: "1px solid rgba(255,255,255,0.5)",
};

const searchInput = {
  padding: "15px 18px",
  minWidth: "220px",
  flex: "1 1 320px",
  borderRadius: "16px",
  border: "1px solid #dbe2ea",
  outline: "none",
  fontSize: "15px",
  width: "100%",
  maxWidth: "360px",
  boxSizing: "border-box",
  background: "#f8fafc",
};

const selectStyle = {
  padding: "15px 18px",
  borderRadius: "16px",
  border: "1px solid #dbe2ea",
  outline: "none",
  fontSize: "15px",
  minWidth: "160px",
  flex: "1 1 190px",
  boxSizing: "border-box",
  background: "#f8fafc",
};

const grid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "28px",
  padding: "40px 20px",
};

const primaryButton = {
  background:
    "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "white",
  border: "none",
  padding: "14px 20px",
  borderRadius: "14px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "15px",
};

const secondaryButton = {
  background: "#1f2937",
  color: "white",
  border: "none",
  padding: "14px 20px",
  borderRadius: "14px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "15px",
};

const paginationWrapper = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "18px",
  flexWrap: "wrap",
  padding: "30px 20px 10px",
};

const paginationText = {
  fontWeight: "700",
  color: "#0f172a",
  fontSize: "15px",
  background: "white",
  padding: "10px 16px",
  borderRadius: "14px",
  boxShadow:
    "0 8px 20px rgba(15,23,42,0.05)",
};

const compareCTA = {
  position: "fixed",
  bottom: "20px",
  right: "20px",
  zIndex: 100,
};

const compareButton = {
  background:
    "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "white",
  border: "none",
  padding: "14px 22px",
  borderRadius: "999px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "14px",
  boxShadow:
    "0 12px 30px rgba(37,99,235,0.35)",
};

const detailsContainer = {
  padding: "40px 24px",
  background: "#f5f7fb",
  minHeight: "100vh",
};

const detailsLayout = {
  display: "flex",
  gap: "50px",
  flexWrap: "wrap",
  marginTop: "30px",
};

const detailsImage = {
  width: "100%",
  maxWidth: "650px",
  borderRadius: "28px",
  objectFit: "cover",
  boxShadow:
    "0 20px 40px rgba(0,0,0,0.12)",
};

const detailsInfo = {
  flex: 1,
  minWidth: "320px",
};

const detailsTitle = {
  fontSize: "48px",
  fontWeight: "800",
  color: "#0f172a",
  marginBottom: "14px",
};

const detailsText = {
  fontSize: "18px",
  color: "#475569",
};

const detailsPrice = {
  fontSize: "38px",
  fontWeight: "800",
  color: "#2563eb",
  marginTop: "20px",
};

const detailsRange = {
  fontSize: "18px",
  color: "#16a34a",
  fontWeight: "700",
};

const leadCard = {
  background: "white",
  padding: "28px",
  borderRadius: "24px",
  marginTop: "32px",
  boxShadow:
    "0 12px 30px rgba(0,0,0,0.08)",
};

const emiCard = {
  background: "white",
  padding: "28px",
  borderRadius: "24px",
  marginTop: "32px",
  boxShadow:
    "0 12px 30px rgba(0,0,0,0.08)",
};

const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  marginTop: "14px",
  borderRadius: "14px",
  border: "1px solid #d1d5db",
  fontSize: "15px",
  boxSizing: "border-box",
};

const emiInputs = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const emiText = {
  marginTop: "24px",
  color: "#16a34a",
  fontWeight: "800",
};

const compareTitle = {
  fontSize: "clamp(40px, 6vw, 64px)",
  fontWeight: "800",
  color: "#0f172a",
  marginBottom: "18px",
  lineHeight: "1.1",
};

const compareHero = {
  textAlign: "center",
  padding:
    "clamp(40px, 6vw, 70px) 20px 10px",
};

const compareButtons = {
  display: "flex",
  justifyContent: "center",
  gap: "18px",
  marginTop: "40px",
  flexWrap: "wrap",
};

const emptyCompare = {
  textAlign: "center",
  marginTop: "120px",
};

const compareSubtitle = {
  maxWidth: "760px",
  margin: "0 auto",
  color: "#64748b",
  lineHeight: "1.9",
  fontSize: "clamp(15px, 2vw, 18px)",
};

const compareHelperBox = {
  position: "fixed",
  bottom: "24px",
  right: "24px",
  background:
    "rgba(15,23,42,0.92)",
  color: "white",
  padding: "14px 18px",
  borderRadius: "18px",
  fontWeight: "600",
  fontSize: "14px",
  backdropFilter: "blur(14px)",
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
  bottom: "24px",
  right: "24px",
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
  transition:
    "transform 0.25s ease, box-shadow 0.25s ease",
  letterSpacing: "0.2px",
};

const statusBox = {
  maxWidth: "1200px",
  margin: "40px auto 10px",
  background: "white",
  padding: "24px",
  borderRadius: "22px",
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
  borderRadius: "22px",
  textAlign: "center",
  fontWeight: "700",
  border: "1px solid #fecaca",
};

const comparePage = {
  minHeight: "100vh",
  background:
    "linear-gradient(to bottom, #f8fafc, #eef2ff)",
};

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
  padding: "10px 18px",
  borderRadius: "999px",
  background:
    "rgba(255,255,255,0.12)",
  color: "white",
  fontSize: "13px",
  fontWeight: "700",
  marginBottom: "24px",
  backdropFilter: "blur(10px)",
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

const compareSection = {
  maxWidth: "1500px",
  margin: "0 auto",
  padding:
    "50px clamp(18px, 3vw, 36px) 100px",
};

const compareGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "30px",
  alignItems: "stretch",
};

const compareCardWrapper = {
  position: "relative",
};

const bestCompareCard = {
  transform: "translateY(-6px)",
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

const specSection = {
  marginTop: "70px",
};

const specHeading = {
  fontSize:
    "clamp(28px, 4vw, 42px)",
  fontWeight: "800",
  color: "#0f172a",
  marginBottom: "28px",
  letterSpacing: "-1px",
};

const specTableWrapper = {
  overflowX: "auto",
  background: "white",
  borderRadius: "28px",
  border: "1px solid #e2e8f0",
  boxShadow:
    "0 20px 50px rgba(15,23,42,0.06)",
};

const specTable = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "760px",
};

const specHeaderLeft = {
  padding: "22px",
  textAlign: "left",
  background: "#0f172a",
  color: "white",
  fontSize: "15px",
};

const specHeader = {
  padding: "22px",
  background: "#111827",
  color: "white",
  fontSize: "15px",
  fontWeight: "700",
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
};

const specValue = {
  padding: "20px 22px",
  textAlign: "center",
  color: "#334155",
  fontWeight: "600",
  borderBottom:
    "1px solid #e2e8f0",
};

const bestSpecValue = {
  color: "#16a34a",
  fontWeight: "800",
};

const greenHighlight = {
  color: "#16a34a",
  fontWeight: "800",
};

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
  padding: "60px 40px",
  textAlign: "center",
  maxWidth: "520px",
  width: "100%",
  border: "1px solid #e2e8f0",
  boxShadow:
    "0 24px 60px rgba(15,23,42,0.08)",
};

const emptyCompareIcon = {
  width: "90px",
  height: "90px",
  margin: "0 auto 26px",
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
  fontSize: "36px",
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

const routeLoaderWrapper = {
  minHeight: "70vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "30px",
};

const routeLoaderCard = {
  background: "white",
  padding: "50px 40px",
  borderRadius: "32px",
  border: "1px solid #e2e8f0",
  textAlign: "center",
  boxShadow:
    "0 24px 60px rgba(15,23,42,0.08)",
};

const routeLoaderLogo = {
  width: "90px",
  height: "90px",
  margin: "0 auto 24px",
  borderRadius: "28px",
  background:
    "linear-gradient(135deg, #2563eb, #1d4ed8)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "40px",
  color: "white",
  boxShadow:
    "0 20px 40px rgba(37,99,235,0.28)",
};

const routeLoaderTitle = {
  fontSize: "34px",
  fontWeight: "800",
  color: "#0f172a",
  marginBottom: "12px",
};

const routeLoaderText = {
  color: "#64748b",
  lineHeight: "1.8",
  marginBottom: "28px",
};

const routeSpinner = {
  width: "52px",
  height: "52px",
  margin: "0 auto",
  border:
    "4px solid rgba(37,99,235,0.12)",
  borderTop:
    "4px solid #2563eb",
  borderRadius: "50%",
  animation:
    "zyvev-spin 1s linear infinite",
};

const notFoundWrapper = {
  minHeight: "70vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "30px",
};

const notFoundCard = {
  background: "white",
  padding: "60px 40px",
  borderRadius: "32px",
  border: "1px solid #e2e8f0",
  textAlign: "center",
  maxWidth: "520px",
  width: "100%",
  boxShadow:
    "0 24px 60px rgba(15,23,42,0.08)",
};

const notFoundIcon = {
  width: "90px",
  height: "90px",
  margin: "0 auto 24px",
  borderRadius: "28px",
  background:
    "linear-gradient(135deg, #2563eb, #1d4ed8)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "40px",
  color: "white",
};

const notFoundTitle = {
  fontSize: "72px",
  fontWeight: "800",
  color: "#0f172a",
  marginBottom: "10px",
  lineHeight: "1",
};

const notFoundText = {
  color: "#64748b",
  lineHeight: "1.8",
  marginBottom: "30px",
};