import { useState } from "react";

import { API_URL } from "../config";

import {
  validateMiniLeadForm,
  sanitizeInput,
} from "../utils/validators";

import {
  cardStyle,
  primaryButton,
  inputStyle,
  gradients,
  shadows,
  radius,
  transitions,
  colors,
} from "../styles/ui";

/* =========================================================
   ====================== LEAD FORM =========================
   ========================================================= */

export default function LeadForm({
  carId,
}) {

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [error, setError] =
    useState("");

  const [fieldErrors, setFieldErrors] =
    useState({});

  /* =========================================================
     ===================== RESET STATE ======================
     ========================================================= */

  const clearMessages = () => {

    setError("");

    setSuccess(false);

    setFieldErrors({});
  };

  /* =========================================================
     ==================== HANDLE NAME =======================
     ========================================================= */

  const handleNameChange = (
    e
  ) => {

    clearMessages();

    const cleaned =
      sanitizeInput(
        e.target.value
      );

    setName(cleaned);
  };

  /* =========================================================
     ==================== HANDLE PHONE ======================
     ========================================================= */

  const handlePhoneChange = (
    e
  ) => {

    clearMessages();

    const numericOnly =
      e.target.value.replace(
        /\D/g,
        ""
      );

    setPhone(
      numericOnly.slice(0, 10)
    );
  };

  /* =========================================================
     ==================== SUBMIT LEAD =======================
     ========================================================= */

  const handleSubmit =
    async () => {

      clearMessages();

      /* ================= VALIDATION ================= */

      const validation =
        validateMiniLeadForm({

          name,

          phone,
        });

      if (
        !validation.isValid
      ) {

        setFieldErrors(
          validation.errors
        );

        return;
      }

      setLoading(true);

      try {

        const res =
          await fetch(
            `${API_URL}/leads`,
            {

              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({

                name:
                  sanitizeInput(
                    name
                  ),

                phone,

                carId,
              }),
            }
          );

        const data =
          await res.json();

        if (!res.ok) {

          throw new Error(
            data?.error ||
            "Unable to submit inquiry."
          );
        }

        /* ================= SUCCESS ================= */

        setSuccess(true);

        setName("");

        setPhone("");

      } catch (err) {

        console.error(
          "LEAD SUBMIT ERROR:",
          err
        );

        setError(

          err.message ||

          "Unable to connect to server."
        );
      }

      setLoading(false);
    };

  /* =========================================================
     ========================= RENDER ========================
     ========================================================= */

  return (

    <section
      style={container}

      aria-label="Lead generation form"
    >

      {/* ================= GLOW ================= */}

      <div style={topGlow} />

      {/* ================= HEADER ================= */}

      <div style={headerSection}>

        <div style={headerRow}>

          <div style={iconWrapper}>
            🚀
          </div>

          <div>

            <div style={premiumBadge}>
              Dealer Assistance
            </div>

            <h2 style={title}>
              Get the Best EV Deal
            </h2>

            <p style={subtitle}>
              Connect instantly with
              verified EV dealers and
              receive personalized offers,
              finance assistance, and test
              drive support.
            </p>

          </div>

        </div>

      </div>

      {/* ================= TRUST ROW ================= */}

      <div style={trustRow}>

        <div style={trustCard}>
          ✔ Verified Dealers
        </div>

        <div style={trustCard}>
          ✔ Fast Response
        </div>

        <div style={trustCard}>
          ✔ Best Pricing
        </div>

      </div>

      {/* ================= FORM ================= */}

      <div style={formSection}>

        {/* ================= NAME ================= */}

        <div style={inputGroup}>

          <label
            htmlFor="lead-name"

            style={label}
          >
            Full Name
          </label>

          <input
            id="lead-name"

            type="text"

            placeholder="Enter your full name"

            value={name}

            onChange={
              handleNameChange
            }

            style={{
              ...input,

              border:
                fieldErrors.name

                  ? `1px solid ${colors.danger}`

                  : input.border,
            }}

            aria-label="Full Name"

            aria-invalid={
              !!fieldErrors.name
            }

            autoComplete="name"

            maxLength={60}

            onFocus={(e) => {

              e.currentTarget.style.border =
                `1px solid ${colors.primary}`;

              e.currentTarget.style.boxShadow =
                "0 0 0 4px rgba(37,99,235,0.10)";
            }}

            onBlur={(e) => {

              e.currentTarget.style.border =

                fieldErrors.name

                  ? `1px solid ${colors.danger}`

                  : `1px solid ${colors.border}`;

              e.currentTarget.style.boxShadow =
                "none";
            }}
          />

          {fieldErrors.name && (

            <span
              style={fieldErrorText}

              role="alert"
            >
              {fieldErrors.name}
            </span>
          )}

        </div>

        {/* ================= PHONE ================= */}

        <div style={inputGroup}>

          <label
            htmlFor="lead-phone"

            style={label}
          >
            Mobile Number
          </label>

          <input
            id="lead-phone"

            type="tel"

            placeholder="Enter mobile number"

            value={phone}

            onChange={
              handlePhoneChange
            }

            style={{
              ...input,

              border:
                fieldErrors.phone

                  ? `1px solid ${colors.danger}`

                  : input.border,
            }}

            aria-label="Mobile Number"

            aria-invalid={
              !!fieldErrors.phone
            }

            autoComplete="tel"

            inputMode="numeric"

            maxLength={10}

            onFocus={(e) => {

              e.currentTarget.style.border =
                `1px solid ${colors.primary}`;

              e.currentTarget.style.boxShadow =
                "0 0 0 4px rgba(37,99,235,0.10)";
            }}

            onBlur={(e) => {

              e.currentTarget.style.border =

                fieldErrors.phone

                  ? `1px solid ${colors.danger}`

                  : `1px solid ${colors.border}`;

              e.currentTarget.style.boxShadow =
                "none";
            }}
          />

          {fieldErrors.phone && (

            <span
              style={fieldErrorText}

              role="alert"
            >
              {fieldErrors.phone}
            </span>
          )}

        </div>

        {/* ================= BUTTON ================= */}

        <button
          onClick={
            handleSubmit
          }

          disabled={loading}

          style={{
            ...submitButton,

            opacity:
              loading
                ? 0.82
                : 1,

            cursor:
              loading
                ? "not-allowed"
                : "pointer",
          }}

          aria-label="Submit Lead Form"

          onMouseEnter={(e) => {

            if (!loading) {

              e.currentTarget.style.transform =
                "translateY(-3px)";

              e.currentTarget.style.boxShadow =
                shadows.heavy;
            }
          }}

          onMouseLeave={(e) => {

            e.currentTarget.style.transform =
              "translateY(0px)";

            e.currentTarget.style.boxShadow =
              shadows.glow;
          }}
        >

          {loading
            ? "Submitting Inquiry..."
            : "Get Dealer Callback"}

        </button>

        {/* ================= PRIVACY ================= */}

        <p style={privacyText}>
          By continuing, you agree to be
          contacted by EVSavari and
          verified EV dealers regarding
          vehicle offers and financing
          support.
        </p>

        {/* ================= ERROR ================= */}

        {error && (

          <div
            style={errorBox}

            role="alert"
          >
            ⚠ {error}
          </div>
        )}

        {/* ================= SUCCESS ================= */}

        {success && (

          <div
            style={successBox}

            role="status"
          >
            ✅ Inquiry submitted
            successfully. Our EV experts
            will contact you shortly.
          </div>
        )}

      </div>

    </section>
  );
}

/* =========================================================
   ========================= STYLES =========================
   ========================================================= */

const container = {
  ...cardStyle,

  position: "relative",

  overflow: "hidden",

  padding:
    "clamp(26px, 4vw, 38px)",

  borderRadius:
    radius.xl,

  boxShadow:
    shadows.medium,
};

/* =========================================================
   ========================== GLOW ==========================
   ========================================================= */

const topGlow = {
  position: "absolute",

  top: "-140px",

  right: "-100px",

  width: "260px",

  height: "260px",

  background:
    "radial-gradient(circle, rgba(37,99,235,0.12), transparent 70%)",

  pointerEvents: "none",
};

/* =========================================================
   ========================= HEADER =========================
   ========================================================= */

const headerSection = {
  position: "relative",

  zIndex: 2,
};

const headerRow = {
  display: "flex",

  alignItems: "flex-start",

  gap: "18px",

  marginBottom: "30px",

  flexWrap: "wrap",
};

const iconWrapper = {
  width: "68px",

  height: "68px",

  borderRadius: "24px",

  background:
    gradients.primary,

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  fontSize: "28px",

  color: "white",

  flexShrink: 0,

  boxShadow:
    shadows.glow,
};

const premiumBadge = {
  display: "inline-flex",

  alignItems: "center",

  justifyContent: "center",

  background:
    gradients.softBlue,

  color: colors.primaryDark,

  padding: "8px 14px",

  borderRadius:
    radius.full,

  fontWeight: "700",

  fontSize: "12px",

  marginBottom: "16px",
};

const title = {
  fontSize:
    "clamp(28px, 4vw, 38px)",

  fontWeight: "800",

  color: colors.text,

  margin: 0,

  lineHeight: "1.1",

  letterSpacing: "-1px",
};

const subtitle = {
  color:
    colors.textLight,

  marginTop: "14px",

  marginBottom: 0,

  lineHeight: "1.9",

  fontSize: "15px",

  maxWidth: "560px",
};

/* =========================================================
   ======================= TRUST ROW ========================
   ========================================================= */

const trustRow = {
  display: "flex",

  flexWrap: "wrap",

  gap: "14px",

  marginBottom: "30px",
};

const trustCard = {
  background:
    gradients.card,

  border:
    `1px solid ${colors.border}`,

  borderRadius:
    radius.md,

  padding: "12px 16px",

  fontWeight: "700",

  color:
    colors.text,

  fontSize: "13px",

  transition:
    transitions.smooth,
};

/* =========================================================
   ========================== FORM ==========================
   ========================================================= */

const formSection = {
  display: "flex",

  flexDirection: "column",

  gap: "22px",
};

const inputGroup = {
  display: "flex",

  flexDirection: "column",
};

const label = {
  marginBottom: "10px",

  fontSize: "14px",

  fontWeight: "700",

  color:
    colors.text,
};

const input = {
  ...inputStyle,

  padding: "18px 20px",

  borderRadius:
    radius.md,

  fontSize: "15px",

  minHeight: "58px",
};

const fieldErrorText = {
  marginTop: "8px",

  color:
    colors.danger,

  fontSize: "13px",

  fontWeight: "600",
};

const submitButton = {
  ...primaryButton,

  width: "100%",

  padding: "18px 22px",

  borderRadius:
    "20px",

  fontWeight: "800",

  fontSize: "15px",

  letterSpacing: "0.2px",

  boxShadow:
    shadows.glow,

  minHeight: "60px",
};

const privacyText = {
  color:
    colors.textLight,

  fontSize: "13px",

  lineHeight: "1.8",

  margin: 0,
};

/* =========================================================
   ========================== ALERTS ========================
   ========================================================= */

const errorBox = {
  background:
    "linear-gradient(135deg, #fef2f2, #fee2e2)",

  color:
    colors.danger,

  padding: "16px 18px",

  borderRadius:
    radius.md,

  fontSize: "14px",

  border:
    "1px solid #fecaca",

  fontWeight: "600",

  lineHeight: "1.7",
};

const successBox = {
  background:
    "linear-gradient(135deg, #f0fdf4, #dcfce7)",

  color:
    colors.success,

  padding: "16px 18px",

  borderRadius:
    radius.md,

  fontSize: "14px",

  border:
    "1px solid #bbf7d0",

  fontWeight: "700",

  lineHeight: "1.7",
};