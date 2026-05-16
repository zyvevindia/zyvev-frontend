import { Link } from "react-router-dom";

/* =========================================================
   ========================= FOOTER =========================
   ========================================================= */

export default function Footer() {
  return (
    <footer style={footer}>
      {/* ================= BACKGROUND GLOW ================= */}

      <div style={footerGlowOne} />
      <div style={footerGlowTwo} />

      {/* ================= MAIN FOOTER ================= */}

      <div style={footerContainer}>
        {/* ================= BRAND SECTION ================= */}

        <div style={brandSection}>
          <div style={logoRow}>
            <div
              style={logoIcon}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "rotate(-8deg) scale(1.06)";
                e.currentTarget.style.boxShadow =
                  "0 18px 40px rgba(37,99,235,0.34)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform =
                  "rotate(0deg) scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 12px 30px rgba(37,99,235,0.25)";
              }}
            >
              ⚡
            </div>

            <div>
              <h2 style={logoText}>
                EVSavari
              </h2>

              <p style={logoSubtext}>
                India’s EV Marketplace
              </p>
            </div>
          </div>

          <p style={description}>
            Discover electric vehicles,
            compare EVs, explore future
            mobility, and find the best
            electric cars, scooters, and
            upcoming EV launches in India.
          </p>

          {/* ================= SOCIAL ================= */}

          <div style={socialRow}>
            {[
              {
                id: "x",
                label: "𝕏",
              },
              {
                id: "in",
                label: "in",
              },
              {
                id: "yt",
                label: "▶",
              },
              {
                id: "fb",
                label: "ⓕ",
              },
            ].map(
              (item) => (
                <button
                  key={item.id}
                  type="button"
                  style={socialButton}
                  title="Social profiles coming soon"
                  aria-label={`${item.label} (coming soon)`}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform =
                      "translateY(-4px)";
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, #2563eb, #1d4ed8)";
                    e.currentTarget.style.boxShadow =
                      "0 16px 32px rgba(37,99,235,0.28)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform =
                      "translateY(0px)";
                    e.currentTarget.style.background =
                      "rgba(255,255,255,0.08)";
                    e.currentTarget.style.boxShadow =
                      "none";
                  }}
                >
                  {item.label}
                </button>
              )
            )}
          </div>
        </div>

        {/* ================= QUICK LINKS ================= */}

        <div style={section}>
          <h3 style={sectionTitle}>
            Quick Links
          </h3>

          <div style={linksWrapper}>
            <FooterLink
              to="/"
              label="Home"
            />

            <FooterLink
              to="/compare"
              label="Compare EVs"
            />

            <FooterLink
              to="/guides"
              label="EV Guides"
            />

            <FooterLink
              to="/popular"
              label="Popular EVs"
            />

            <FooterLink
              to="/upcoming"
              label="Upcoming EVs"
            />
          </div>
        </div>

        {/* ================= COMPANY ================= */}

        <div style={section}>
          <h3 style={sectionTitle}>
            Company
          </h3>

          <div style={linksWrapper}>
            <FooterLink
              to="/about"
              label="About Us"
            />

            <FooterLink
              to="/contact"
              label="Contact"
            />

            <FooterLink
              to="/privacy"
              label="Privacy Policy"
            />

            <FooterLink
              to="/terms"
              label="Terms of Service"
            />
          </div>
        </div>

        {/* ================= CONTACT ================= */}

        <div style={section}>
          <h3 style={sectionTitle}>
            Contact
          </h3>

          <div style={contactWrapper}>
            <p style={contactText}>
              📧 support@evsavari.com
            </p>

            <p style={contactText}>
              ⚡ India’s Growing EV Platform
            </p>

            <p style={contactText}>
              📍 India
            </p>

            <p style={contactText}>
              EV Marketplace Platform
            </p>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM BAR ================= */}

      <div style={bottomBar}>
        <div style={bottomBarContainer}>
          <div style={bottomBarLeft}>
            <p style={bottomText}>
              © {new Date().getFullYear()}{" "}
              EVSavari. All rights reserved.
            </p>

            <p style={bottomSubtext}>
              India’s electric vehicle marketplace.
            </p>
          </div>

          <p style={bottomLegal}>
            Vehicle specifications, pricing, and availability may
            vary by region and are provided for informational purposes.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* =========================================================
   ===================== FOOTER LINK ========================
   ========================================================= */

function FooterLink({
  to,
  label,
}) {
  return (
    <Link
      to={to}
      style={footerLink}
      onMouseEnter={(e) => {
        e.currentTarget.style.color =
          "white";
        e.currentTarget.style.transform =
          "translateX(4px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color =
          "#cbd5e1";
        e.currentTarget.style.transform =
          "translateX(0px)";
      }}
    >
      {label}
    </Link>
  );
}

/* =========================================================
   ========================== STYLES ========================
   ========================================================= */

const footer = {
  position: "relative",
  overflow: "hidden",
  background:
    "linear-gradient(135deg, #020617 0%, #0f172a 40%, #111827 100%)",
  color: "white",
  marginTop: "110px",
};

/* =========================================================
   ======================= GLOW EFFECTS =====================
   ========================================================= */

const footerGlowOne = {
  position: "absolute",
  top: "-140px",
  left: "-120px",
  width: "320px",
  height: "320px",
  background:
    "radial-gradient(circle, rgba(37,99,235,0.18), transparent 70%)",
  pointerEvents: "none",
};

const footerGlowTwo = {
  position: "absolute",
  bottom: "-160px",
  right: "-120px",
  width: "340px",
  height: "340px",
  background:
    "radial-gradient(circle, rgba(59,130,246,0.14), transparent 70%)",
  pointerEvents: "none",
};

/* =========================================================
   ===================== MAIN CONTAINER =====================
   ========================================================= */

const footerContainer = {
  position: "relative",
  zIndex: 2,
  maxWidth: "1500px",
  margin: "0 auto",
  padding:
    "90px clamp(20px, 4vw, 36px) 60px",
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "clamp(36px, 5vw, 60px)",
  alignItems: "flex-start",
};

const brandSection = {
  maxWidth: "420px",
};

/* =========================================================
   ========================= LOGO ===========================
   ========================================================= */

const logoRow = {
  display: "flex",
  alignItems: "center",
  gap: "18px",
  marginBottom: "24px",
};

const logoIcon = {
  width: "64px",
  height: "64px",
  borderRadius: "20px",
  background:
    "linear-gradient(135deg, #2563eb, #1d4ed8)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "30px",
  boxShadow:
    "0 12px 30px rgba(37,99,235,0.25)",
  transition: "all 0.32s ease",
};

const logoText = {
  margin: 0,
  fontSize: "36px",
  fontWeight: "800",
  letterSpacing: "-1.2px",
  lineHeight: "1",
};

const logoSubtext = {
  marginTop: "6px",
  color: "#cbd5e1",
  fontSize: "13px",
  letterSpacing: "0.4px",
};

const description = {
  color: "#cbd5e1",
  lineHeight: "2",
  maxWidth: "420px",
  fontSize: "15px",
  marginBottom: "32px",
};

/* =========================================================
   ========================= SOCIAL =========================
   ========================================================= */

const socialRow = {
  display: "flex",
  gap: "14px",
  flexWrap: "wrap",
  alignItems: "center",
};

const socialButton = {
  width: "46px",
  height: "46px",
  borderRadius: "16px",
  background:
    "rgba(255,255,255,0.08)",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "default",
  fontWeight: "700",
  fontSize: "15px",
  transition: "all 0.28s ease",
  backdropFilter: "blur(8px)",
  border:
    "1px solid rgba(255,255,255,0.06)",
  padding: 0,
  margin: 0,
  fontFamily: "inherit",
};

/* =========================================================
   ========================= SECTIONS =======================
   ========================================================= */

const section = {};

const sectionTitle = {
  fontSize: "22px",
  fontWeight: "700",
  marginBottom: "26px",
  color: "white",
  letterSpacing: "-0.4px",
};

const linksWrapper = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const footerLink = {
  color: "#cbd5e1",
  textDecoration: "none",
  transition: "all 0.28s ease",
  fontSize: "15px",
  width: "fit-content",
};

/* =========================================================
   ========================= CONTACT ========================
   ========================================================= */

const contactWrapper = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const contactText = {
  color: "#cbd5e1",
  margin: 0,
  lineHeight: "1.8",
  fontSize: "15px",
};

/* =========================================================
   ======================== BOTTOM BAR ======================
   ========================================================= */

const bottomBar = {
  borderTop:
    "1px solid rgba(255,255,255,0.08)",
  position: "relative",
  zIndex: 2,
};

const bottomBarContainer = {
  maxWidth: "1500px",
  margin: "0 auto",
  padding:
    "28px clamp(20px, 4vw, 36px) 32px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  gap: "12px",
};

const bottomBarLeft = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  alignItems: "center",
};

const bottomText = {
  color: "#94a3b8",
  margin: 0,
  fontSize: "14px",
};

const bottomSubtext = {
  color: "#64748b",
  margin: 0,
  fontSize: "14px",
};

const bottomLegal = {
  color: "#64748b",
  margin: 0,
  fontSize: "12px",
  lineHeight: "1.6",
  maxWidth: "520px",
};