import {
  lazy,
  Suspense,
  useEffect,
} from "react";

import {
  Routes,
  Route,
  Navigate,
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

const SeoGuidesHub = lazy(() =>
  import("./pages/SeoGuidesHub")
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

const DealerSignup = lazy(() =>
  import("./pages/DealerSignup")
);

const DealerDashboard = lazy(() =>
  import("./pages/DealerDashboard")
);

const TrafficIntelligencePage = lazy(() =>
  import("./pages/admin/TrafficIntelligencePage")
);

const OperationalQaPage = lazy(() =>
  import("./pages/admin/OperationalQaPage")
);

const MediaQaPage = lazy(() =>
  import("./pages/admin/MediaQaPage")
);

const LaunchStatusPage = lazy(() =>
  import("./pages/admin/LaunchStatusPage")
);

const LaunchReadinessPage = lazy(() =>
  import("./pages/admin/LaunchReadinessPage")
);

const RealUsageLearningPage = lazy(() =>
  import("./pages/admin/RealUsageLearningPage")
);

const OpsDisciplineHubPage = lazy(() =>
  import("./pages/admin/OpsDisciplineHubPage")
);

const OpsSnapshotPage = lazy(() =>
  import("./pages/admin/OpsSnapshotPage")
);

const CatalogOpsPage = lazy(() =>
  import("./pages/admin/CatalogOpsPage")
);

const CatalogIngestionOpsPage = lazy(() =>
  import("./pages/admin/CatalogIngestionOpsPage")
);

const SoftLaunchOpsPage = lazy(() =>
  import("./pages/admin/SoftLaunchOpsPage")
);

const DealerApplicationsPage = lazy(() =>
  import("./pages/admin/DealerApplicationsPage")
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
import SoftLaunchBanner from "./components/SoftLaunchBanner";
import CompareErrorBoundary from "./components/errors/CompareErrorBoundary";

import StaticPage from "./pages/StaticPage";
import ContactPage from "./pages/ContactPage";

import {
  ABOUT_PAGE,
  PRIVACY_PAGE,
  TERMS_PAGE,
} from "./content/staticPages";
import {
  HOW_EVSAVARI_WORKS,
  TRUST_SCORING_PAGE,
  TRUST_FRESHNESS_PAGE,
  TRUST_OWNERSHIP_PAGE,
} from "./content/trustPages";
import TrustMethodologyPage from "./pages/trust/TrustMethodologyPage";

import {
  BestEvsDiscoveryPage,
  CompareGuideDiscoveryPage,
  ChargingGuideDiscoveryPage,
  OwnershipGuideDiscoveryPage,
  BrandDiscoveryPage,
  CityEvsDiscoveryPage,
  CityChargingDiscoveryPage,
} from "./pages/discoveryRoutes";

const IntelligenceDiscoveryPage = lazy(() =>
  import("./pages/IntelligenceDiscoveryPage")
);

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

      <SoftLaunchBanner />

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
            path="/guides"
            element={<SeoGuidesHub />}
          />

          <Route
            path="/best-evs/:useCase"
            element={<BestEvsDiscoveryPage />}
          />

          <Route
            path="/discover/:presetSlug"
            element={<IntelligenceDiscoveryPage />}
          />

          <Route
            path="/compare/:compareSlug"
            element={
              <CompareErrorBoundary>
                <CompareGuideDiscoveryPage />
              </CompareErrorBoundary>
            }
          />

          <Route
            path="/charging-guides/:slug"
            element={<ChargingGuideDiscoveryPage />}
          />

          <Route
            path="/ownership-guides/:slug"
            element={<OwnershipGuideDiscoveryPage />}
          />

          <Route
            path="/brands/:brand"
            element={<BrandDiscoveryPage />}
          />

          <Route
            path="/cities/:city/evs"
            element={<CityEvsDiscoveryPage />}
          />

          <Route
            path="/cities/:city/charging"
            element={<CityChargingDiscoveryPage />}
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
            element={
              <CompareErrorBoundary>
                <ComparePage />
              </CompareErrorBoundary>
            }
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
            path="/how-evsavari-works"
            element={
              <TrustMethodologyPage
                page={HOW_EVSAVARI_WORKS}
                breadcrumbLabel="How EVSavari works"
              />
            }
          />

          <Route
            path="/trust/scoring"
            element={
              <TrustMethodologyPage
                page={TRUST_SCORING_PAGE}
                breadcrumbLabel="Scoring"
              />
            }
          />

          <Route
            path="/trust/freshness"
            element={
              <TrustMethodologyPage
                page={TRUST_FRESHNESS_PAGE}
                breadcrumbLabel="Freshness"
              />
            }
          />

          <Route
            path="/trust/ownership"
            element={
              <TrustMethodologyPage
                page={TRUST_OWNERSHIP_PAGE}
                breadcrumbLabel="Ownership"
              />
            }
          />

          <Route
            path="/about"
            element={
              <StaticPage
                {...ABOUT_PAGE}
                path="/about"
              />
            }
          />

          <Route
            path="/contact"
            element={<ContactPage />}
          />

          <Route
            path="/privacy"
            element={
              <StaticPage
                {...PRIVACY_PAGE}
                path="/privacy"
              />
            }
          />

          <Route
            path="/terms"
            element={
              <StaticPage
                {...TERMS_PAGE}
                path="/terms"
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
            path="/dealer/signup"
            element={<DealerSignup />}
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
            path="/admin/traffic"
            element={
              <PrivateRoute allowedRoles={["admin", "sales"]}>
                <TrafficIntelligencePage />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/ops-qa"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <OperationalQaPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/media-qa"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <MediaQaPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/launch-status"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <LaunchStatusPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/launch-readiness"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <LaunchReadinessPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/real-usage-learning"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <RealUsageLearningPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/ops-discipline"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <OpsDisciplineHubPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/ops-snapshot"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <OpsSnapshotPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/catalog-ops"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <CatalogOpsPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/catalog-ingestion"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <CatalogIngestionOpsPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/soft-launch-ops"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <SoftLaunchOpsPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/dealer-applications"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <DealerApplicationsPage />
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