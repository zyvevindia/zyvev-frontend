/* =========================================================
   ===================== EVSAVARI UI KIT ===================
   ========================================================= */

/*
  PURPOSE:

  - Centralized design system
  - Reusable premium styles
  - Consistent spacing
  - Unified shadows
  - Unified buttons
  - Scalable UI architecture
*/

/* =========================================================
   ======================== COLORS ==========================
   ========================================================= */

export const colors = {

  primary:
    "#2563eb",

  primaryDark:
    "#1d4ed8",

  secondary:
    "#0f172a",

  text:
    "#0f172a",

  textLight:
    "#475569",

  border:
    "#e2e8f0",

  surface:
    "#ffffff",

  background:
    "#f8fafc",

  success:
    "#16a34a",

  danger:
    "#dc2626",
};

/* =========================================================
   ======================= GRADIENTS ========================
   ========================================================= */

export const gradients = {

  primary:
    "linear-gradient(135deg, #2563eb, #1d4ed8)",

  dark:
    "linear-gradient(135deg, #020617, #0f172a)",

  card:
    "linear-gradient(to bottom, #ffffff, #f8fafc)",

  softBlue:
    "linear-gradient(135deg, #eff6ff, #dbeafe)",
};

/* =========================================================
   ======================== SHADOWS =========================
   ========================================================= */

export const shadows = {

  soft:
    "0 10px 28px rgba(15,23,42,0.06)",

  medium:
    "0 20px 48px rgba(15,23,42,0.10)",

  heavy:
    "0 28px 70px rgba(15,23,42,0.14)",

  glow:
    "0 20px 48px rgba(37,99,235,0.24)",
};

/* =========================================================
   ======================== RADIUS ==========================
   ========================================================= */

export const radius = {

  sm: "12px",

  md: "18px",

  lg: "26px",

  xl: "36px",

  full: "999px",
};

/* =========================================================
   ====================== TRANSITIONS =======================
   ========================================================= */

export const transitions = {

  fast:
    "all 0.2s ease",

  smooth:
    "all 0.3s ease",

  slow:
    "all 0.45s ease",
};

/* =========================================================
   ======================== SPACING =========================
   ========================================================= */

export const spacing = {

  xs: "8px",

  sm: "12px",

  md: "18px",

  lg: "26px",

  xl: "36px",

  xxl: "48px",
};

/* =========================================================
   ===================== PRIMARY BUTTON ====================
   ========================================================= */

export const primaryButton = {

  background:
    gradients.primary,

  color: "white",

  border: "none",

  borderRadius:
    radius.md,

  padding:
    "14px 22px",

  cursor: "pointer",

  fontWeight: "700",

  fontSize: "14px",

  transition:
    transitions.smooth,

  boxShadow:
    shadows.glow,

  display: "inline-flex",

  alignItems: "center",

  justifyContent: "center",

  gap: "8px",

  textDecoration: "none",
};

/* =========================================================
   ==================== SECONDARY BUTTON ===================
   ========================================================= */

export const secondaryButton = {

  background:
    colors.secondary,

  color: "white",

  border: "none",

  borderRadius:
    radius.md,

  padding:
    "14px 22px",

  cursor: "pointer",

  fontWeight: "700",

  fontSize: "14px",

  transition:
    transitions.smooth,

  display: "inline-flex",

  alignItems: "center",

  justifyContent: "center",

  gap: "8px",

  textDecoration: "none",
};

/* =========================================================
   ======================= GHOST BUTTON ====================
   ========================================================= */

export const ghostButton = {

  background:
    "rgba(255,255,255,0.7)",

  color:
    colors.text,

  border:
    `1px solid ${colors.border}`,

  borderRadius:
    radius.md,

  padding:
    "14px 22px",

  cursor: "pointer",

  fontWeight: "700",

  fontSize: "14px",

  transition:
    transitions.smooth,

  backdropFilter:
    "blur(12px)",

  display: "inline-flex",

  alignItems: "center",

  justifyContent: "center",

  gap: "8px",

  textDecoration: "none",
};

/* =========================================================
   ========================= CARDS ==========================
   ========================================================= */

export const cardStyle = {

  background:
    colors.surface,

  border:
    `1px solid ${colors.border}`,

  borderRadius:
    radius.lg,

  boxShadow:
    shadows.soft,

  transition:
    transitions.smooth,
};

/* =========================================================
   ======================= INPUT STYLE =====================
   ========================================================= */

export const inputStyle = {

  width: "100%",

  padding: "14px 16px",

  borderRadius:
    radius.md,

  border:
    `1px solid ${colors.border}`,

  background:
    colors.surface,

  fontSize: "14px",

  color:
    colors.text,

  outline: "none",

  transition:
    transitions.fast,

  boxSizing:
    "border-box",
};

/* =========================================================
   ====================== SECTION WIDTH ====================
   ========================================================= */

export const sectionWidth = {

  maxWidth: "1500px",

  margin: "0 auto",

  width: "100%",
};