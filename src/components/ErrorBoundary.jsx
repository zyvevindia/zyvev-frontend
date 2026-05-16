import React from "react";

import { logProduction } from "../utils/productionLog";

/* =========================================================
   ===================== ERROR BOUNDARY ====================
   ========================================================= */

class ErrorBoundary extends React.Component {

  constructor(props) {

    super(props);

    this.state = {
      hasError: false,
      error: null,
    };
  }

  /* =========================================================
     ================= GET DERIVED STATE =====================
     ========================================================= */

  static getDerivedStateFromError(
    error
  ) {

    return {
      hasError: true,
      error,
    };
  }

  /* =========================================================
     ===================== COMPONENT DID CATCH ===============
     ========================================================= */

  componentDidCatch(
    error,
    errorInfo
  ) {

    logProduction(
      "ui",
      "error_boundary",
      {
        message: error?.message,
        componentStack: errorInfo?.componentStack?.slice(0, 200),
      },
      "error"
    );
  }

  /* =========================================================
     ======================== RELOAD =========================
     ========================================================= */

  handleReload = () => {

    window.location.reload();
  };

  /* =========================================================
     ========================= RENDER ========================
     ========================================================= */

  render() {

    if (
      this.state.hasError
    ) {

      return (

        <div style={wrapper}>

          {/* ================= GLOW ================= */}

          <div style={glowTop} />

          <div style={glowBottom} />

          {/* ================= CARD ================= */}

          <div style={card}>

            <div style={iconWrapper}>
              ⚡
            </div>

            <h1 style={title}>
              Something Went Wrong
            </h1>

            <p style={description}>
              EVSavari encountered an unexpected issue.
              Please refresh the page and try again.
            </p>

            {/* ================= BUTTONS ================= */}

            <div style={buttonWrapper}>

              <button
                onClick={
                  this.handleReload
                }

                style={primaryButton}
              >
                Reload Website
              </button>

              <button
                onClick={() =>
                  window.location.href = "/"
                }

                style={secondaryButton}
              >
                Go To Homepage
              </button>

            </div>

            {/* ================= ERROR ================= */}

            {this.state.error && (

              <details style={detailsBox}>

                <summary style={summaryStyle}>
                  Technical Details
                </summary>

                <pre style={errorText}>
                  {
                    this.state.error
                      ?.toString()
                  }
                </pre>

              </details>
            )}

          </div>

        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

/* =========================================================
   ========================= STYLES =========================
   ========================================================= */

const wrapper = {
  minHeight: "100vh",

  background:
    "linear-gradient(135deg, #020617 0%, #0f172a 40%, #1d4ed8 100%)",

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  padding: "24px",

  position: "relative",

  overflow: "hidden",
};

/* =========================================================
   ========================== GLOWS =========================
   ========================================================= */

const glowTop = {
  position: "absolute",

  top: "-180px",

  right: "-120px",

  width: "420px",

  height: "420px",

  background:
    "radial-gradient(circle, rgba(37,99,235,0.28), transparent 72%)",

  pointerEvents: "none",
};

const glowBottom = {
  position: "absolute",

  bottom: "-180px",

  left: "-120px",

  width: "420px",

  height: "420px",

  background:
    "radial-gradient(circle, rgba(96,165,250,0.18), transparent 72%)",

  pointerEvents: "none",
};

/* =========================================================
   =========================== CARD =========================
   ========================================================= */

const card = {
  position: "relative",

  zIndex: 2,

  width: "100%",

  maxWidth: "620px",

  background:
    "rgba(255,255,255,0.96)",

  backdropFilter:
    "blur(18px)",

  borderRadius: "36px",

  padding:
    "clamp(36px, 5vw, 56px)",

  textAlign: "center",

  boxShadow:
    "0 30px 80px rgba(0,0,0,0.24)",

  border:
    "1px solid rgba(255,255,255,0.4)",
};

const iconWrapper = {
  width: "96px",

  height: "96px",

  borderRadius: "30px",

  margin:
    "0 auto 28px",

  background:
    "linear-gradient(135deg, #2563eb, #1d4ed8)",

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  fontSize: "42px",

  color: "white",

  boxShadow:
    "0 20px 48px rgba(37,99,235,0.32)",
};

const title = {
  fontSize:
    "clamp(34px, 5vw, 52px)",

  fontWeight: "800",

  lineHeight: "1.05",

  letterSpacing: "-1.5px",

  color: "#0f172a",

  marginBottom: "18px",
};

const description = {
  color: "#475569",

  fontSize:
    "clamp(15px, 2vw, 18px)",

  lineHeight: "1.9",

  maxWidth: "480px",

  margin:
    "0 auto 34px",
};

/* =========================================================
   ========================= BUTTONS ========================
   ========================================================= */

const buttonWrapper = {
  display: "flex",

  justifyContent: "center",

  gap: "16px",

  flexWrap: "wrap",
};

const primaryButton = {
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
    "0 18px 40px rgba(37,99,235,0.28)",
};

const secondaryButton = {
  background: "#0f172a",

  color: "white",

  border: "none",

  padding: "16px 24px",

  borderRadius: "18px",

  cursor: "pointer",

  fontWeight: "700",

  fontSize: "15px",
};

/* =========================================================
   ======================= ERROR BOX ========================
   ========================================================= */

const detailsBox = {
  marginTop: "34px",

  textAlign: "left",

  background: "#f8fafc",

  borderRadius: "20px",

  padding: "18px",

  border:
    "1px solid #e2e8f0",

  overflow: "auto",
};

const summaryStyle = {
  cursor: "pointer",

  fontWeight: "700",

  color: "#0f172a",

  marginBottom: "14px",
};

const errorText = {
  fontSize: "13px",

  color: "#dc2626",

  whiteSpace: "pre-wrap",

  wordBreak: "break-word",

  lineHeight: "1.7",
};