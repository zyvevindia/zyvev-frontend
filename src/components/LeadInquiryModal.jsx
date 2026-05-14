import {
  useEffect,
  useState,
} from "react";

import { API_URL } from "../config";

import {
  validateLeadForm,
  sanitizeInput,
} from "../utils/validators";

import {
  colors,
  shadows,
  radius,
} from "../styles/ui";

/* =========================================================
   ================== LEAD INQUIRY MODAL =====================
   ========================================================= */

const isLikelyMongoId = (value) => {

  return (
    typeof value === "string" &&
    /^[a-f\d]{24}$/i.test(
      value.trim()
    )
  );
};

export default function LeadInquiryModal({
  isOpen,
  onClose,
  sourcePage,
  vehicleName: defaultVehicleName = "",
  vehicleId = "",
  mongoCarId = "",
  headline = "EV enquiry",
  submitLabel = "Submit enquiry",
}) {

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [city, setCity] =
    useState("");

  const [interestedVehicle,
    setInterestedVehicle] =
    useState("");

  const [message, setMessage] =
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
     ===================== RESET ON OPEN ===================
     ========================================================= */

  useEffect(() => {

    if (!isOpen) {

      return;
    }

    setSuccess(false);

    setError("");

    setFieldErrors({});

    setLoading(false);

    setInterestedVehicle(
      defaultVehicleName || ""
    );
  }, [
    isOpen,
    defaultVehicleName,
  ]);

  /* =========================================================
     ======================= SUBMIT ==========================
     ========================================================= */

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      setError("");

      setFieldErrors({});

      const validation =
        validateLeadForm({

          name,

          phone,

          email,

          city,

          interestedVehicle,

          message,
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

      const carIdPayload =

        isLikelyMongoId(mongoCarId)
          ? mongoCarId.trim()
          : isLikelyMongoId(vehicleId)
            ? vehicleId.trim()
            : "";

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

                phone:

                  phone.replace(
                    /\D/g,
                    ""
                  ),

                email:
                  sanitizeInput(
                    email
                  ).toLowerCase(),

                city:
                  sanitizeInput(
                    city
                  ),

                message:
                  sanitizeInput(
                    message
                  ),

                vehicleName:
                  sanitizeInput(
                    interestedVehicle
                  ),

                vehicleId:
                  String(
                    vehicleId || ""
                  ).trim(),

                sourcePage:
                  String(
                    sourcePage || ""
                  ).trim(),

                carId:
                  carIdPayload ||
                  undefined,
              }),
            }
          );

        const data =
          await res.json();

        if (!res.ok) {

          const serverErrors =
            data?.errors;

          if (
            serverErrors &&
            typeof serverErrors ===
              "object" &&
            !Array.isArray(
              serverErrors
            )
          ) {

            const mapped = {
              ...serverErrors,
            };

            if (
              mapped.vehicleName
            ) {

              mapped.interestedVehicle =
                mapped.vehicleName;
            }

            setFieldErrors(
              mapped
            );
          }

          throw new Error(
            data?.message ||
            data?.error ||
            "Unable to submit enquiry."
          );
        }

        setSuccess(true);

        setName("");

        setPhone("");

        setEmail("");

        setCity("");

        setMessage("");
      } catch (err) {

        console.error(err);

        setError(
          err.message ||
          "Unable to connect to server."
        );
      } finally {

        setLoading(false);
      }
    };

  /* =========================================================
     ======================= CLOSE ===========================
     ========================================================= */

  const handleClose = () => {

    if (loading) {

      return;
    }

    onClose();
  };

  if (!isOpen) {

    return null;
  }

  /* =========================================================
     ========================= RENDER =========================
     ========================================================= */

  return (

    <div
      style={overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-inquiry-title"
      onClick={(e) => {

        if (
          e.target === e.currentTarget
        ) {

          handleClose();
        }
      }}
    >

      <div style={modalCard}>

        <button
          type="button"
          onClick={handleClose}
          style={closeBtn}
          aria-label="Close enquiry form"
        >
          ✕
        </button>

        <h2
          id="lead-inquiry-title"
          style={modalTitle}
        >
          {headline}
        </h2>

        <p style={trustLine}>
          Verified EV dealers will contact you
          shortly. We never sell your details.
        </p>

        {success ? (

          <div style={successBox}>

            <div style={successIcon}>
              ✓
            </div>

            <p style={successText}>
              Thank you! Your enquiry has been
              received. A dealer partner will reach
              out on your registered number.
            </p>

            <button
              type="button"
              onClick={handleClose}
              style={primaryBtn}
            >
              Close
            </button>

          </div>
        ) : (

          <form
            onSubmit={handleSubmit}
            style={formStack}
          >

            <label style={label}>
              Full name *
            </label>

            <input
              value={name}
              onChange={(e) =>
                setName(
                  sanitizeInput(
                    e.target.value
                  )
                )
              }
              style={input}
              placeholder="Your name"
              autoComplete="name"
            />

            {fieldErrors.name && (

              <p style={fieldError}>
                {fieldErrors.name}
              </p>
            )}

            <label style={label}>
              Mobile number *
            </label>

            <input
              value={phone}
              onChange={(e) =>
                setPhone(
                  e.target.value
                    .replace(
                      /\D/g,
                      ""
                    )
                    .slice(
                      0,
                      10
                    )
                )
              }
              style={input}
              placeholder="10-digit Indian mobile"
              inputMode="numeric"
              autoComplete="tel"
            />

            {fieldErrors.phone && (

              <p style={fieldError}>
                {fieldErrors.phone}
              </p>
            )}

            <label style={label}>
              Email *
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value.trim()
                )
              }
              style={input}
              placeholder="you@example.com"
              autoComplete="email"
            />

            {fieldErrors.email && (

              <p style={fieldError}>
                {fieldErrors.email}
              </p>
            )}

            <label style={label}>
              City *
            </label>

            <input
              value={city}
              onChange={(e) =>
                setCity(
                  sanitizeInput(
                    e.target.value
                  )
                )
              }
              style={input}
              placeholder="e.g. Bengaluru"
              autoComplete="address-level2"
            />

            {fieldErrors.city && (

              <p style={fieldError}>
                {fieldErrors.city}
              </p>
            )}

            <label style={label}>
              Interested vehicle *
            </label>

            <input
              value={interestedVehicle}
              onChange={(e) =>
                setInterestedVehicle(
                  sanitizeInput(
                    e.target.value
                  )
                )
              }
              style={input}
              placeholder="Model you are exploring"
            />

            {fieldErrors.interestedVehicle && (

              <p style={fieldError}>
                {fieldErrors.interestedVehicle}
              </p>
            )}

            <label style={label}>
              Message (optional)
            </label>

            <textarea
              value={message}
              onChange={(e) =>
                setMessage(
                  sanitizeInput(
                    e.target.value
                  )
                )
              }
              style={textarea}
              rows={4}
              placeholder="Preferred time to call, variant, budget…"
            />

            {fieldErrors.message && (

              <p style={fieldError}>
                {fieldErrors.message}
              </p>
            )}

            {error && (

              <p style={globalError}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                ...primaryBtn,
                opacity: loading
                  ? 0.75
                  : 1,
              }}
            >

              {loading
                ? "Sending…"
                : submitLabel}
            </button>

            <p style={privacyNote}>
              By submitting, you agree to be
              contacted by authorised EVSavari
              dealer partners regarding this
              enquiry.
            </p>

          </form>
        )}

      </div>

    </div>
  );
}

/* =========================================================
   ========================= STYLES =========================
   ========================================================= */

const overlay = {
  position: "fixed",
  inset: 0,
  zIndex: 10050,
  background:
    "rgba(15,23,42,0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding:
    "clamp(12px, 4vw, 24px)",
  overflowY: "auto",
};

const modalCard = {
  position: "relative",
  width: "100%",
  maxWidth: "520px",
  maxHeight: "92vh",
  overflowY: "auto",
  background: colors.surface,
  borderRadius: radius.lg,
  boxShadow: shadows.heavy,
  padding:
    "clamp(22px, 4vw, 32px)",
  border: `1px solid ${colors.border}`,
};

const closeBtn = {
  position: "absolute",
  top: "14px",
  right: "14px",
  border: "none",
  background: "#f1f5f9",
  width: "38px",
  height: "38px",
  borderRadius: "12px",
  cursor: "pointer",
  fontSize: "18px",
  lineHeight: 1,
  color: colors.text,
};

const modalTitle = {
  margin: "0 40px 10px 0",
  fontSize: "22px",
  fontWeight: "800",
  color: colors.text,
  letterSpacing: "-0.4px",
};

const trustLine = {
  margin: "0 0 20px 0",
  fontSize: "14px",
  lineHeight: "1.65",
  color: colors.textLight,
};

const formStack = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const label = {
  fontSize: "13px",
  fontWeight: "700",
  color: colors.text,
  marginTop: "8px",
};

const input = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  borderRadius: "12px",
  border: `1px solid ${colors.border}`,
  fontSize: "15px",
  outline: "none",
};

const textarea = {
  ...input,
  resize: "vertical",
  minHeight: "96px",
  fontFamily: "inherit",
};

const fieldError = {
  color: colors.danger,
  fontSize: "12px",
  margin: "0 0 4px 0",
};

const globalError = {
  color: colors.danger,
  fontSize: "14px",
  margin: "4px 0 0 0",
};

const gradientsBtn =
  "linear-gradient(135deg, #2563eb, #1d4ed8)";

const primaryBtn = {
  marginTop: "12px",
  width: "100%",
  border: "none",
  borderRadius: "14px",
  padding: "14px 18px",
  fontWeight: "700",
  fontSize: "15px",
  color: "white",
  cursor: "pointer",
  background: gradientsBtn,
};

const privacyNote = {
  fontSize: "12px",
  color: colors.textLight,
  lineHeight: "1.6",
  margin: "10px 0 0 0",
};

const successBox = {
  textAlign: "center",
  padding: "8px 0 0 0",
};

const successIcon = {
  width: "56px",
  height: "56px",
  margin: "0 auto 16px",
  borderRadius: "50%",
  background:
    "linear-gradient(135deg,#16a34a,#15803d)",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "28px",
  fontWeight: "800",
};

const successText = {
  fontSize: "15px",
  lineHeight: "1.75",
  color: colors.textLight,
  margin: "0 0 20px 0",
};
