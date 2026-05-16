import {
  lazy,
  Suspense,
  useEffect,
} from "react";

import {
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import {
  Helmet,
} from "react-helmet-async";

import Home from "./pages/Home";
import ComparePage from "./pages/ComparePage";

import {
  trackPageView,
} from "./utils/analytics";

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

const LegacyCarRedirect = lazy(() =>
  import("./components/routing/LegacyCarRedirect")
);

const CarsSlugRouter = lazy(() =>
  import("./components/routing/CarsSlugRouter")
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

const DealerLogin = lazy(() =>
  import("./pages/DealerLogin")
);

const DealerDashboard = lazy(() =>
  import("./pages/DealerDashboard")
);

const ListingPage = lazy(() =>
  import("./pages/ListingPage")
);

const EditorialLayout = lazy(() =>
  import("./pages/admin/editorial/EditorialLayout")
);

const EditorialDashboard = lazy(() =>
  import("./pages/admin/editorial/EditorialDashboard")
);

const EditorialJobDetail = lazy(() =>
  import("./pages/admin/editorial/JobDetailPage")
);

const EditorialStaged = lazy(() =>
  import("./pages/admin/editorial/StagedPublishPage")
);

const EditorialCoverage = lazy(() =>
  import("./pages/admin/editorial/CoveragePage")
);

const EditorialObservations = lazy(() =>
  import("./pages/admin/editorial/ObservationsPage")
);

const EditorialLeadQuality = lazy(() =>
  import("./pages/admin/editorial/LeadQualityPage")
);

const EditorialPublicBeta = lazy(() =>
  import("./pages/admin/editorial/PublicBetaPage")
);

const EditorialMarketHealth = lazy(() =>
  import("./pages/admin/editorial/MarketHealthPage")
);

const EditorialMarketLearning = lazy(() =>
  import("./pages/admin/editorial/MarketLearningPage")
);

/* =========================================================
   ================= NORMAL IMPORTS ========================
   ========================================================= */

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import PublicBetaBanner from "./components/PublicBetaBanner";

import StaticPage from "./pages/StaticPage";

import {
  ABOUT_PAGE,
  CONTACT_PAGE,
  PRIVACY_PAGE,
  TERMS_PAGE,
} from "./content/staticPages";

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

  const location =
    useLocation();

  /* =========================================================
     ==================== ANALYTICS TRACK ===================
     ========================================================= */

  useEffect(() => {

    trackPageView(
      location.pathname
    );

  }, [location]);

  /* =========================================================
     ========================= RENDER ========================
     ========================================================= */

  return (

    <>
      <ScrollToTop />

      <PublicBetaBanner />

      <Navbar />

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
            path="/cars/:slug"
            element={<CarsSlugRouter />}
          />

          <Route
            path="/car/:slug"
            element={<LegacyCarRedirect />}
          />

          <Route
            path="/compare"
            element={<ComparePage />}
          />

          <Route
            path="/popular"
            element={<ListingPage />}
          />

          <Route
            path="/latest"
            element={<ListingPage />}
          />

          <Route
            path="/upcoming"
            element={<ListingPage />}
          />

          <Route
            path="/cars"
            element={<ListingPage />}
          />

          <Route
            path="/bikes"
            element={<ListingPage />}
          />

          <Route
            path="/scooters"
            element={<ListingPage />}
          />

          <Route
            path="/about"
            element={
              <StaticPage
                {...ABOUT_PAGE}
              />
            }
          />

          <Route
            path="/contact"
            element={
              <StaticPage
                {...CONTACT_PAGE}
              />
            }
          />

          <Route
            path="/privacy"
            element={
              <StaticPage
                {...PRIVACY_PAGE}
              />
            }
          />

          <Route
            path="/terms"
            element={
              <StaticPage
                {...TERMS_PAGE}
              />
            }
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/dealer/login"
            element={<DealerLogin />}
          />

          <Route
            path="/dealer"
            element={
              <PrivateRoute
                allowedRoles={["dealer"]}
              >
                <DealerDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/:category"
            element={<ListingPage />}
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

          <Route
            path="/admin/editorial"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <EditorialLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<EditorialDashboard />} />
            <Route path="jobs/:jobId" element={<EditorialJobDetail />} />
            <Route path="staged" element={<EditorialStaged />} />
            <Route path="coverage" element={<EditorialCoverage />} />
            <Route path="observations" element={<EditorialObservations />} />
            <Route path="lead-quality" element={<EditorialLeadQuality />} />
            <Route path="public-beta" element={<EditorialPublicBeta />} />
            <Route path="market-health" element={<EditorialMarketHealth />} />
            <Route path="market-learning" element={<EditorialMarketLearning />} />
          </Route>

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
            element={
              <PrivateRoute
                allowedRoles={[
                  "admin",
                ]}
              >
                <SalesAnalytics />
              </PrivateRoute>
            }
          />

          {/* ================= 404 ================= */}

          <Route
            path="*"
            element={
              <>
                <Helmet>

                  <title>
                    Page Not Found | EVSavari
                  </title>

                  <meta
                    name="robots"
                    content="noindex"
                  />

                </Helmet>

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
              </>
            }
          />

        </Routes>

      </Suspense>

      <Footer />

    </>
  );
}

/* =========================================================
   ======================= STYLES ===========================
   ========================================================= */

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

  border:
    "1px solid #e2e8f0",

  textAlign: "center",

  boxShadow:
    "0 24px 60px rgba(15,23,42,0.08)",
};

const routeLoaderLogo = {
  width: "90px",

  height: "90px",

  margin:
    "0 auto 24px",

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

  border:
    "1px solid #e2e8f0",

  textAlign: "center",

  maxWidth: "520px",

  width: "100%",

  boxShadow:
    "0 24px 60px rgba(15,23,42,0.08)",
};

const notFoundIcon = {
  width: "90px",

  height: "90px",

  margin:
    "0 auto 24px",

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