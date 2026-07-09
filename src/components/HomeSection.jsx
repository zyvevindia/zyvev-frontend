import { Children } from "react";
import { Link } from "react-router-dom";

import CatalogResultsGrid from "./catalog/CatalogResultsGrid";

/* =========================================================
   ==================== HOME SECTION =======================
   ========================================================= */

function sectionHasContent(children) {
  return Children.toArray(children).some(
    (child) => child !== null && child !== undefined && child !== false
  );
}

export default function HomeSection({
  title,
  subtitle,
  children,
  viewAllLink,
  loading = false,
  emptyMessage = "No vehicles available right now.",
  compactBottom = false,
}) {
  const sectionStyle = compactBottom
    ? {
        ...section,
        paddingBottom: "clamp(20px, 3vw, 40px)",
      }
    : section;

  return (
    <section style={sectionStyle}>
      {/* ================= HEADER ================= */}

      <div style={header}>
        <div style={headerLeft}>
          <h2 style={titleStyle}>
            {title}
          </h2>

          <p style={subtitleStyle}>
            {subtitle}
          </p>
        </div>

        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="home-section-view-all"
            style={viewAllButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform =
                "translateY(-2px)";

              e.currentTarget.style.boxShadow =
                "0 16px 32px rgba(37,99,235,0.16)";

              e.currentTarget.style.border =
                "1px solid #bfdbfe";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform =
                "translateY(0px)";

              e.currentTarget.style.boxShadow =
                "0 10px 28px rgba(15,23,42,0.06)";

              e.currentTarget.style.border =
                "1px solid #e2e8f0";
            }}
          >
            View All
          </Link>
        )}
      </div>

      {/* ================= LOADING ================= */}

      {loading ? (
        <div style={loadingWrapper}>
          <div style={loader}></div>

          <p style={loadingText}>
            Loading EV marketplace...
          </p>
        </div>
      ) : (
        <>
          {/* ================= EMPTY ================= */}

          {!sectionHasContent(children) ? (
            <div style={emptyState}>
              <div style={emptyIcon}>
                ⚡
              </div>

              <h3 style={emptyTitle}>
                No EVs Found
              </h3>

              <p style={emptyText}>
                {emptyMessage}
              </p>
            </div>
          ) : (
            /* ================= CONTENT ================= */

            <CatalogResultsGrid
              count={Children.toArray(children).filter(Boolean).length}
            >
              {children}
            </CatalogResultsGrid>
          )}
        </>
      )}
    </section>
  );
}

/* =========================================================
   ======================== STYLES ==========================
   ========================================================= */

const section = {
  width: "100%",
  maxWidth: "1500px",
  margin: "0 auto",

  padding:
    "clamp(36px, 5vw, 72px) clamp(18px, 3vw, 36px)",

  boxSizing: "border-box",
};

const header = {
  display: "flex",

  justifyContent: "space-between",

  alignItems: "flex-end",

  flexWrap: "wrap",

  gap: "20px",

  marginBottom: "34px",
};

const headerLeft = {
  flex: 1,

  minWidth: "280px",
};

const titleStyle = {
  fontSize:
    "clamp(28px, 4vw, 46px)",

  fontWeight: "800",

  color: "#0f172a",

  margin: 0,

  lineHeight: "1.05",

  letterSpacing: "-1px",
};

const subtitleStyle = {
  color: "#64748b",

  fontSize: "16px",

  lineHeight: "1.9",

  marginTop: "12px",

  marginBottom: 0,

  maxWidth: "760px",

  fontWeight: "500",
};

const viewAllButton = {
  display: "inline-flex",

  alignItems: "center",

  justifyContent: "center",

  background: "white",

  border: "1px solid #e2e8f0",

  padding: "13px 22px",

  borderRadius: "18px",

  cursor: "pointer",

  fontWeight: "700",

  fontSize: "14px",

  color: "#0f172a",

  textDecoration: "none",

  transition: "all 0.28s ease",

  boxShadow:
    "0 10px 28px rgba(15,23,42,0.06)",

  whiteSpace: "nowrap",

  minHeight: "48px",
};

const loadingWrapper = {
  minHeight: "320px",

  display: "flex",

  flexDirection: "column",

  alignItems: "center",

  justifyContent: "center",

  gap: "18px",
};

const loader = {
  width: "56px",

  height: "56px",

  border:
    "5px solid #dbeafe",

  borderTop:
    "5px solid #2563eb",

  borderRadius: "50%",

  animation:
    "spin 1s linear infinite",
};

const loadingText = {
  color: "#64748b",

  fontSize: "16px",

  fontWeight: "600",
};

/* =========================================================
   ===================== EMPTY STATE =======================
   ========================================================= */

const emptyState = {
  background: "white",

  borderRadius: "28px",

  padding: "80px 24px",

  textAlign: "center",

  border:
    "1px solid #e2e8f0",

  boxShadow:
    "0 10px 28px rgba(15,23,42,0.06)",
};

const emptyIcon = {
  fontSize: "54px",

  marginBottom: "18px",
};

const emptyTitle = {
  margin: 0,

  color: "#0f172a",

  fontSize: "28px",

  fontWeight: "800",
};

const emptyText = {
  color: "#64748b",

  fontSize: "16px",

  lineHeight: "1.8",

  maxWidth: "540px",

  margin:
    "14px auto 0 auto",
};