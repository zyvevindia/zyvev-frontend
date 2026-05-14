import {
  Link,
  useLocation,
} from "react-router-dom";

import {
  useEffect,
  useState,
} from "react";

/* =========================================================
   ======================= NAVBAR ===========================
   ========================================================= */

export default function Navbar() {

  const location =
    useLocation();

  const [mobileMenuOpen,
    setMobileMenuOpen] =
    useState(false);

  const [isMobile,
    setIsMobile] =
    useState(
      window.innerWidth < 900
    );

  const [isScrolled,
    setIsScrolled] =
    useState(false);

  /* =========================================================
     ===================== WINDOW RESIZE =====================
     ========================================================= */

  useEffect(() => {

    function handleResize() {

      const mobile =
        window.innerWidth < 900;

      setIsMobile(mobile);

      if (!mobile) {

        setMobileMenuOpen(
          false
        );
      }
    }

    function handleScroll() {

      setIsScrolled(
        window.scrollY > 10
      );
    }

    window.addEventListener(
      "resize",
      handleResize
    );

    window.addEventListener(
      "scroll",
      handleScroll
    );

    return () => {

      window.removeEventListener(
        "resize",
        handleResize
      );

      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };

  }, []);

  /* =========================================================
     ====================== ACTIVE ROUTE =====================
     ========================================================= */

  const isActive = (path) => {

    return (
      location.pathname === path
    );
  };

  /* =========================================================
     ====================== CLOSE MENU =======================
     ========================================================= */

  const closeMobileMenu =
    () => {

      if (isMobile) {

        setMobileMenuOpen(
          false
        );
      }
    };

  /* =========================================================
     ======================= NAV ITEMS =======================
     ========================================================= */

  const navItems = [

    {
      label: "Home",
      path: "/",
    },

    {
      label: "Compare",
      path: "/compare",
    },

    {
      label: "CRM",
      path: "/admin",
    },
  ];

  /* =========================================================
     ========================= RENDER ========================
     ========================================================= */

  return (

    <header
      style={{
        ...navbarWrapper,

        ...(isScrolled
          ? scrolledNavbar
          : {}),
      }}
    >

      {/* ================= BACKGROUND GLOW ================= */}

      <div style={topGlow} />

      <div style={bottomGlow} />

      <div style={navbarContainer}>

        {/* ================= LOGO ================= */}

        <Link
          to="/"

          style={logoWrapper}

          onClick={
            closeMobileMenu
          }

          aria-label="EVSavari Homepage"

          onMouseEnter={(e) => {

            const logo =
              e.currentTarget.querySelector(
                ".logo-circle"
              );

            if (logo) {

              logo.style.transform =
                "rotate(-8deg) scale(1.08)";

              logo.style.boxShadow =
                "0 18px 42px rgba(37,99,235,0.42)";
            }
          }}

          onMouseLeave={(e) => {

            const logo =
              e.currentTarget.querySelector(
                ".logo-circle"
              );

            if (logo) {

              logo.style.transform =
                "rotate(0deg) scale(1)";

              logo.style.boxShadow =
                "0 12px 28px rgba(37,99,235,0.32)";
            }
          }}
        >

          <div
            className="logo-circle"
            style={logoCircle}
          >
            ⚡
          </div>

          <div>

            <h1 style={logoText}>
              EVSavari
            </h1>

            <p style={logoSubtext}>
              India's EV Marketplace
            </p>

          </div>

        </Link>

        {/* ================= MOBILE TOGGLE ================= */}

        {isMobile && (

          <button
            style={{
              ...mobileToggle,

              ...(mobileMenuOpen
                ? mobileToggleActive
                : {}),
            }}

            onClick={() =>
              setMobileMenuOpen(
                !mobileMenuOpen
              )
            }

            aria-label="Toggle navigation menu"
          >

            {mobileMenuOpen
              ? "✕"
              : "☰"}

          </button>
        )}

        {/* ================= NAVIGATION ================= */}

        <nav
          style={{
            ...navLinks,

            ...(isMobile
              ? mobileNav
              : {}),

            ...(isMobile &&
            mobileMenuOpen
              ? mobileNavOpen
              : {}),
          }}
        >

          {navItems.map(
            (item) => {

              const active =
                isActive(
                  item.path
                );

              return (

                <Link
                  key={item.path}

                  to={item.path}

                  style={{
                    ...navItem,

                    ...(active
                      ? activeNavItem
                      : {}),
                  }}

                  onClick={
                    closeMobileMenu
                  }

                  aria-label={
                    item.label
                  }

                  onMouseEnter={(e) => {

                    if (!active) {

                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.08)";

                      e.currentTarget.style.transform =
                        "translateY(-2px)";

                      e.currentTarget.style.color =
                        "white";
                    }
                  }}

                  onMouseLeave={(e) => {

                    if (!active) {

                      e.currentTarget.style.background =
                        "transparent";

                      e.currentTarget.style.transform =
                        "translateY(0px)";

                      e.currentTarget.style.color =
                        "#e2e8f0";
                    }
                  }}
                >
                  {item.label}
                </Link>
              );
            }
          )}

          {/* ================= LOGIN BUTTON ================= */}

          <Link
            to="/login"

            style={{
              ...loginButton,

              ...(isMobile
                ? mobileLoginButton
                : {}),
            }}

            onClick={
              closeMobileMenu
            }

            aria-label="Login"

            onMouseEnter={(e) => {

              e.currentTarget.style.transform =
                "translateY(-3px) scale(1.01)";

              e.currentTarget.style.boxShadow =
                "0 18px 38px rgba(37,99,235,0.34)";
            }}

            onMouseLeave={(e) => {

              e.currentTarget.style.transform =
                "translateY(0px) scale(1)";

              e.currentTarget.style.boxShadow =
                "0 12px 28px rgba(37,99,235,0.26)";
            }}
          >
            Login
          </Link>

        </nav>

      </div>

    </header>
  );
}

/* =========================================================
   ======================= STYLES ===========================
   ========================================================= */

const navbarWrapper = {
  position: "sticky",

  top: 0,

  zIndex: 999,

  width: "100%",

  backdropFilter:
    "blur(18px)",

  background:
    "rgba(2, 6, 23, 0.78)",

  borderBottom:
    "1px solid rgba(255,255,255,0.06)",

  boxShadow:
    "0 10px 34px rgba(0,0,0,0.18)",

  overflow: "hidden",

  transition:
    "all 0.3s ease",
};

const scrolledNavbar = {
  background:
    "rgba(2, 6, 23, 0.92)",

  boxShadow:
    "0 16px 40px rgba(0,0,0,0.24)",
};

const topGlow = {
  position: "absolute",

  top: "-120px",

  right: "-120px",

  width: "260px",

  height: "260px",

  background:
    "radial-gradient(circle, rgba(37,99,235,0.28), transparent 70%)",

  pointerEvents: "none",
};

const bottomGlow = {
  position: "absolute",

  bottom: "-140px",

  left: "-140px",

  width: "260px",

  height: "260px",

  background:
    "radial-gradient(circle, rgba(96,165,250,0.16), transparent 70%)",

  pointerEvents: "none",
};

const navbarContainer = {
  position: "relative",

  zIndex: 2,

  maxWidth: "1500px",

  margin: "0 auto",

  padding:
    "14px clamp(18px, 3vw, 34px)",

  display: "flex",

  justifyContent:
    "space-between",

  alignItems: "center",

  gap: "16px",

  minHeight: "84px",
};

/* =========================================================
   ========================= LOGO ===========================
   ========================================================= */

const logoWrapper = {
  display: "flex",

  alignItems: "center",

  gap: "14px",

  textDecoration: "none",

  minWidth: "fit-content",
};

const logoCircle = {
  width: "52px",

  height: "52px",

  borderRadius: "20px",

  background:
    "linear-gradient(135deg, #2563eb, #1d4ed8)",

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  fontSize: "22px",

  color: "white",

  flexShrink: 0,

  boxShadow:
    "0 12px 28px rgba(37,99,235,0.32)",

  transition:
    "all 0.32s ease",
};

const logoText = {
  color: "white",

  fontSize: "28px",

  margin: 0,

  fontWeight: "800",

  letterSpacing: "-0.8px",

  lineHeight: "1",
};

const logoSubtext = {
  color: "#cbd5e1",

  fontSize: "12px",

  margin: 0,

  marginTop: "5px",

  letterSpacing: "0.4px",

  fontWeight: "500",
};

/* =========================================================
   ====================== MOBILE TOGGLE =====================
   ========================================================= */

const mobileToggle = {
  background:
    "rgba(255,255,255,0.08)",

  border:
    "1px solid rgba(255,255,255,0.12)",

  color: "white",

  width: "52px",

  height: "52px",

  borderRadius: "16px",

  cursor: "pointer",

  fontSize: "24px",

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  backdropFilter:
    "blur(12px)",

  transition:
    "all 0.28s ease",
};

const mobileToggleActive = {
  background:
    "rgba(37,99,235,0.22)",
};

/* =========================================================
   ====================== NAVIGATION ========================
   ========================================================= */

const navLinks = {
  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  gap: "10px",
};

const mobileNav = {
  position: "absolute",

  top: "100%",

  left: 0,

  right: 0,

  background:
    "rgba(2, 6, 23, 0.97)",

  backdropFilter:
    "blur(20px)",

  padding: "22px",

  flexDirection: "column",

  alignItems: "stretch",

  gap: "14px",

  borderBottom:
    "1px solid rgba(255,255,255,0.06)",

  display: "none",

  boxShadow:
    "0 20px 50px rgba(0,0,0,0.24)",
};

const mobileNavOpen = {
  display: "flex",
};

const navItem = {
  textDecoration: "none",

  color: "#e2e8f0",

  padding: "14px 18px",

  borderRadius: "16px",

  fontWeight: "600",

  fontSize: "15px",

  transition:
    "all 0.28s ease",

  whiteSpace: "nowrap",

  letterSpacing: "0.2px",

  textAlign: "center",

  position: "relative",
};

const activeNavItem = {
  background:
    "rgba(255,255,255,0.12)",

  color: "white",

  boxShadow:
    "inset 0 0 0 1px rgba(255,255,255,0.06)",

  backdropFilter:
    "blur(8px)",
};

/* =========================================================
   ====================== LOGIN BUTTON ======================
   ========================================================= */

const loginButton = {
  textDecoration: "none",

  background:
    "linear-gradient(135deg, #2563eb, #1d4ed8)",

  color: "white",

  padding: "14px 22px",

  borderRadius: "16px",

  fontWeight: "700",

  fontSize: "14px",

  whiteSpace: "nowrap",

  boxShadow:
    "0 12px 28px rgba(37,99,235,0.26)",

  transition:
    "all 0.28s ease",

  letterSpacing: "0.2px",

  textAlign: "center",
};

const mobileLoginButton = {
  width: "100%",

  boxSizing: "border-box",
};