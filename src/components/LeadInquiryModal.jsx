import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { submitBuyerLead } from "../services/leadSubmitApi";
import { trackLeadFormAbandoned } from "../analytics/funnel";

import {
  validateLeadForm,
  validateTestDriveForm,
  sanitizeInput,
} from "../utils/validators";

import {
  colors,
  shadows,
  radius,
} from "../styles/ui";

import { trackBuyerEvent } from "../event-tracking/trackBuyerEvent";

import { BUYER_EVENTS } from "../event-tracking/eventTypes";

import {
  trackLaunchLeadFormOpen,
  trackLaunchLeadFormSubmit,
} from "../launch/launchTelemetry";

import {
  getAnonymousSessionIdForLead,
} from "../event-tracking/trackBuyerEvent";

import LeadTrustBanner from "./leads/LeadTrustBanner";
import TurnstileWidget from "./security/TurnstileWidget";
import { isTurnstileConfigured } from "../utils/turnstile";

import {
  getCitiesForState,
  indiaStates,
} from "../data/indiaLocations";

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

function fieldInputStyle(base, errors, field) {
  return {
    ...base,
    borderColor: errors[field] ? colors.danger : colors.border,
  };
}

/**
 * Compose modal title: "Book a test drive — Tata Curvv EV Empowered"
 * @param {string} headline
 * @param {string} vehicleName
 */
export function buildLeadModalTitle(
  headline = "",
  vehicleName = ""
) {
  const base = String(headline || "").trim();
  const vehicle = String(vehicleName || "").trim();

  if (!base) {
    return vehicle || "EV enquiry";
  }

  if (!vehicle) {
    return base;
  }

  if (
    base.toLowerCase().includes(
      vehicle.toLowerCase()
    )
  ) {
    return base;
  }

  return `${base} — ${vehicle}`;
}

/**
 * Full vehicle string for API (model + optional trim).
 */
export function buildSubmittedVehicleName({
  modelName = "",
  variantName = "",
  fallback = "",
}) {
  const model = String(modelName || "").trim();
  const variant = String(variantName || "").trim();

  if (
    model &&
    variant &&
    variant.toLowerCase() !== model.toLowerCase() &&
    !model.toLowerCase().includes(variant.toLowerCase())
  ) {
    return `${model} (${variant})`;
  }

  return model || variant || String(fallback || "").trim();
}

export default function LeadInquiryModal({
  isOpen,
  onClose,
  sourcePage,
  modelName = "",
  vehicleName: defaultVehicleName = "",
  vehicleId = "",
  mongoCarId = "",
  headline = "EV enquiry",
  subtitle = "",
  submitLabel = "Submit enquiry",
  formMode = "inquiry",
  variantOptions = [],
  defaultVariantSlug = "",
  leadMetadata = {},
  composeTitleWithVehicle = true,
}) {
  const isTestDrive = formMode === "test_drive";

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [state, setState] =
    useState("");

  const [city, setCity] =
    useState("");

  const [overlayAlignItems, setOverlayAlignItems] = useState("center");

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => {
      setOverlayAlignItems(mq.matches ? "flex-start" : "center");
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const [interestedVehicle,
    setInterestedVehicle] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [honeypot, setHoneypot] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [error, setError] =
    useState("");

  const [fieldErrors, setFieldErrors] =
    useState({});

  const [turnstileToken, setTurnstileToken] =
    useState("");

  /* =========================================================
     ===================== RESET ON OPEN ===================
     ========================================================= */

  const wasOpenRef = useRef(false);
  const submittedRef = useRef(false);

  const cityOptions = useMemo(
    () => getCitiesForState(state),
    [state]
  );

  const carDisplayName = (
    modelName ||
    defaultVehicleName ||
    ""
  ).trim();

  const displayTitle = useMemo(
    () =>
      composeTitleWithVehicle
        ? buildLeadModalTitle(
            headline,
            carDisplayName
          )
        : String(headline || "").trim() ||
          "EV enquiry",
    [headline, carDisplayName, composeTitleWithVehicle]
  );

  const showVariantPicker =
    isTestDrive && variantOptions.length > 1;

  const showCarField = Boolean(carDisplayName);
  const showVariantField = isTestDrive;

  const resetFormFields = () => {
    setName("");
    setPhone("");
    setEmail("");
    setState("");
    setCity("");
    setMessage("");
    setHoneypot("");
    setTurnstileToken("");
    setError("");
    setFieldErrors({});
    setLoading(false);
    setSuccess(false);
  };

  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    const justOpened = isOpen && !wasOpen;
    const justClosed = wasOpen && !isOpen;
    wasOpenRef.current = isOpen;

    if (justClosed && !submittedRef.current) {
      trackLeadFormAbandoned({
        sourcePage,
        formType: isTestDrive ? "test_drive" : formMode || "inquiry",
        familySlug: leadMetadata?.familySlug || "",
      });
    }

    if (!justOpened) {
      return;
    }

    submittedRef.current = false;

    trackLaunchLeadFormOpen({
      sourcePage,
      formType: isTestDrive ? "test_drive" : formMode || "inquiry",
      familySlug: leadMetadata?.familySlug,
    });

    resetFormFields();

    const defaultVariant = variantOptions.find(
      (v) => v.slug === defaultVariantSlug
    );

    if (isTestDrive) {
      setInterestedVehicle(
        defaultVariant?.label || ""
      );
    } else {
      setInterestedVehicle(
        defaultVariant?.label ||
          defaultVehicleName ||
          carDisplayName ||
          ""
      );
    }
  }, [
    isOpen,
    defaultVehicleName,
    defaultVariantSlug,
    variantOptions,
    isTestDrive,
    carDisplayName,
  ]);

  /* =========================================================
     ======================= SUBMIT ==========================
     ========================================================= */

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      setError("");

      setFieldErrors({});

      if (honeypot.trim()) {
        return;
      }

      const validation = isTestDrive
        ? validateTestDriveForm({
            name,
            phone,
            state,
            city,
            interestedVehicle,
          })
        : validateLeadForm({
            name,
            phone,
            email,
            state,
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

      if (isTurnstileConfigured() && !turnstileToken) {
        setError(
          "Please complete the security check before submitting."
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

      const submittedVehicleName = sanitizeInput(
        isTestDrive
          ? buildSubmittedVehicleName({
              modelName: carDisplayName,
              variantName: interestedVehicle,
            })
          : interestedVehicle ||
              carDisplayName ||
              defaultVehicleName
      );

      try {
        const res = await submitBuyerLead(
          {
            name: sanitizeInput(name),
            phone: phone.replace(/\D/g, ""),
            email: sanitizeInput(email).toLowerCase(),
            city: sanitizeInput(city),
            state: sanitizeInput(state),
            message: sanitizeInput(message),
            vehicleName: submittedVehicleName,
            modelName: sanitizeInput(carDisplayName),
            variantName: isTestDrive
              ? sanitizeInput(interestedVehicle)
              : "",
            vehicleId: String(vehicleId || "").trim(),
            sourcePage: String(sourcePage || "").trim(),
            carId: carIdPayload || undefined,
            anonymousSessionId:
              getAnonymousSessionIdForLead() || undefined,
            leadSource: "form",
            familySlug: String(leadMetadata.familySlug || "").trim(),
            variantSlug: String(leadMetadata.variantSlug || "").trim(),
            leadMetadata: {
              ...leadMetadata,
              leadIntent: {
                formMode,
                sourcePage: String(sourcePage || "").trim(),
                headline: String(headline || "").trim(),
                isTestDrive,
              },
              formMode,
              state: sanitizeInput(state),
              city: sanitizeInput(city),
              modelName: sanitizeInput(carDisplayName),
              variantName: isTestDrive
                ? sanitizeInput(interestedVehicle)
                : "",
            },
          },
          turnstileToken
        );

        const data = res.data || {};

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

        submittedRef.current = true;
        setSuccess(true);

        if (data?.merged) {
          trackBuyerEvent(BUYER_EVENTS.LEAD_SUBMITTED, {
            sourcePage: String(sourcePage || "").trim(),
            metadata: { merged: true, leadId: data.leadId },
          });
          trackLaunchLeadFormSubmit({
            sourcePage: String(sourcePage || "").trim(),
            formType: isTestDrive ? "test_drive" : "inquiry",
            vehicleSlugs: vehicleId ? [String(vehicleId).trim()] : [],
          });
        }

        if (isTestDrive) {
          trackBuyerEvent(BUYER_EVENTS.TEST_DRIVE_REQUESTED, {
            sourcePage: String(sourcePage || "").trim(),
            vehicleSlugs: leadMetadata.variantSlug
              ? [String(leadMetadata.variantSlug).trim()]
              : vehicleId
                ? [String(vehicleId).trim()]
                : [],
            metadata: {
              familySlug: leadMetadata.familySlug || "",
              variantSlug: leadMetadata.variantSlug || "",
              brand: leadMetadata.brand || "",
            },
          });
        }

        if (!data?.merged) {
          trackBuyerEvent(BUYER_EVENTS.LEAD_SUBMITTED, {
            sourcePage: String(sourcePage || "").trim(),
            vehicleSlugs: vehicleId
              ? [String(vehicleId).trim()]
              : [],
            metadata: isTestDrive ? leadMetadata : undefined,
          });
          trackLaunchLeadFormSubmit({
            sourcePage: String(sourcePage || "").trim(),
            formType: isTestDrive ? "test_drive" : "inquiry",
            vehicleSlugs: vehicleId
              ? [String(vehicleId).trim()]
              : [],
          });
        }

      } catch (err) {
        if (import.meta.env.DEV) {
          console.error(err);
        }

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

    resetFormFields();
    onClose();
  };

  const handleSuccessOk = () => {
    resetFormFields();
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
      style={{ ...overlay, alignItems: overlayAlignItems }}
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

        {success ? (

          <div
            style={successView}
            role="status"
            aria-live="polite"
          >
            <div style={successIconRing} aria-hidden>
              <span style={successCheck}>✓</span>
            </div>

            <h2
              id="lead-inquiry-title"
              style={successTitle}
            >
              Request submitted successfully
            </h2>

            <p style={successMessage}>
              Thank you! An EVSavari partner will contact
              you shortly regarding your enquiry.
            </p>

            <p style={successNote}>
              You may receive a callback, WhatsApp message,
              or SMS.
            </p>

            <button
              type="button"
              onClick={handleSuccessOk}
              style={successOkBtn}
            >
              OK
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={handleClose}
              style={closeBtn}
              disabled={loading}
              aria-label="Close enquiry form"
            >
              ✕
            </button>

            <h2
              id="lead-inquiry-title"
              style={modalTitle}
              title={displayTitle}
            >
              {displayTitle}
            </h2>

            {subtitle ? (
              <p style={modalSubtitle}>{subtitle}</p>
            ) : null}

            <LeadTrustBanner compact />

            <p
              style={{
                margin: "0 0 1rem",
                fontSize: "0.8125rem",
                color: "#64748b",
                lineHeight: 1.5,
              }}
            >
              We route this enquiry only — no marketing lists. Dealer partners are onboarded
              under EVSavari quality checks.
            </p>

            <form
              onSubmit={handleSubmit}
              style={formStack}
              data-testid="lead-inquiry-form"
            >
            <input
              type="text"
              name="company"
              value={honeypot}
              onChange={(e) =>
                setHoneypot(e.target.value)
              }
              style={honeypotInput}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            {showCarField ? (
              <>
                <label style={label}>
                  Car *
                </label>
                <input
                  value={carDisplayName}
                  readOnly
                  tabIndex={-1}
                  style={vehicleReadonlyInput}
                  aria-readonly="true"
                />
              </>
            ) : null}

            {showVariantField ? (
              <>
                <label style={label}>
                  Interested vehicle *
                </label>

                {showVariantPicker ? (
                  <select
                    value={interestedVehicle}
                    onChange={(e) =>
                      setInterestedVehicle(
                        e.target.value
                      )
                    }
                    style={fieldInputStyle(
                      selectInput,
                      fieldErrors,
                      "interestedVehicle"
                    )}
                    aria-invalid={Boolean(
                      fieldErrors.interestedVehicle
                    )}
                  >
                    <option value="">
                      Select a variant
                    </option>
                    {variantOptions.map((opt) => (
                      <option
                        key={opt.slug}
                        value={opt.label}
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={interestedVehicle}
                    readOnly
                    tabIndex={-1}
                    style={vehicleReadonlyInput}
                    aria-readonly="true"
                  />
                )}

                {fieldErrors.interestedVehicle && (
                  <p style={fieldError}>
                    {fieldErrors.interestedVehicle}
                  </p>
                )}
              </>
            ) : !showCarField ? (
              <>
                <label style={label}>
                  Interested vehicle *
                </label>
                <input
                  value={interestedVehicle}
                  readOnly
                  tabIndex={-1}
                  style={vehicleReadonlyInput}
                  aria-readonly="true"
                />
                {fieldErrors.interestedVehicle && (
                  <p style={fieldError}>
                    {fieldErrors.interestedVehicle}
                  </p>
                )}
              </>
            ) : null}

            <label style={label}>
              Full name *
            </label>

            <input
              value={name}
              data-testid="lead-name"
              onChange={(e) =>
                setName(
                  sanitizeInput(
                    e.target.value
                  )
                )
              }
              style={fieldInputStyle(input, fieldErrors, "name")}
              placeholder="Your name"
              autoComplete="name"
              aria-invalid={Boolean(fieldErrors.name)}
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
              data-testid="lead-phone"
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
              style={fieldInputStyle(input, fieldErrors, "phone")}
              placeholder="10-digit Indian mobile"
              inputMode="numeric"
              autoComplete="tel"
              aria-invalid={Boolean(fieldErrors.phone)}
            />

            {fieldErrors.phone && (

              <p style={fieldError}>
                {fieldErrors.phone}
              </p>
            )}

            {!isTestDrive && (
              <>
                <label style={label}>
                  Email (optional)
                </label>

                <input
                  type="email"
                  value={email}
                  data-testid="lead-email"
                  onChange={(e) =>
                    setEmail(e.target.value.trim())
                  }
                  style={fieldInputStyle(input, fieldErrors, "email")}
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-invalid={Boolean(fieldErrors.email)}
                />

                {fieldErrors.email && (
                  <p style={fieldError}>
                    {fieldErrors.email}
                  </p>
                )}
              </>
            )}

            <label style={label}>
              State *
            </label>

            <select
              value={state}
              data-testid="lead-state"
              onChange={(e) => {
                setState(e.target.value);
                setCity("");
              }}
              style={fieldInputStyle(
                selectInput,
                fieldErrors,
                "state"
              )}
              aria-invalid={Boolean(fieldErrors.state)}
            >
              <option value="">
                Select state
              </option>
              {indiaStates.map((stateName) => (
                <option
                  key={stateName}
                  value={stateName}
                >
                  {stateName}
                </option>
              ))}
            </select>

            {fieldErrors.state && (
              <p style={fieldError}>
                {fieldErrors.state}
              </p>
            )}

            <label style={label}>
              City *
            </label>

            <select
              value={city}
              data-testid="lead-city"
              onChange={(e) => setCity(e.target.value)}
              disabled={!state}
              style={{
                ...fieldInputStyle(
                  selectInput,
                  fieldErrors,
                  "city"
                ),
                ...(!state ? selectDisabled : null),
              }}
              aria-invalid={Boolean(fieldErrors.city)}
            >
              <option value="">
                {state
                  ? "Select city"
                  : "Select state first"}
              </option>
              {cityOptions.map((cityName) => (
                <option
                  key={cityName}
                  value={cityName}
                >
                  {cityName}
                </option>
              ))}
            </select>

            {fieldErrors.city && (
              <p style={fieldError}>
                {fieldErrors.city}
              </p>
            )}

            <label style={label}>
              {isTestDrive
                ? "Notes (optional)"
                : "Message (optional)"}
            </label>

            <textarea
              value={message}
              data-testid="lead-message"
              onChange={(e) =>
                setMessage(
                  sanitizeInput(e.target.value)
                )
              }
              style={fieldInputStyle(textarea, fieldErrors, "message")}
              rows={isTestDrive ? 3 : 4}
              aria-invalid={Boolean(fieldErrors.message)}
              placeholder={
                isTestDrive
                  ? "Preferred date or time slot…"
                  : "Preferred time to call, variant, budget…"
              }
            />

            {fieldErrors.message && (
              <p style={fieldError}>
                {fieldErrors.message}
              </p>
            )}

            {error && (

              <p style={globalError} role="alert">
                {error}
              </p>
            )}

            <div data-testid="lead-turnstile">
              <TurnstileWidget
                onToken={setTurnstileToken}
                onExpire={() => setTurnstileToken("")}
                onError={() => setTurnstileToken("")}
              />
            </div>

            <button
              type="submit"
              data-testid="lead-submit"
              disabled={
                loading ||
                (isTurnstileConfigured() && !turnstileToken)
              }
              style={{
                ...primaryBtn,
                ...submitBtnLayout,
                opacity: loading ? 0.85 : 1,
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading ? (
                <span style={submitBtnInner}>
                  <span style={spinner} aria-hidden />
                  Sending…
                </span>
              ) : (
                submitLabel
              )}
            </button>

            <p style={privacyNote}>
              By submitting, you agree to be
              contacted by authorised EVSavari
              dealer partners regarding this
              enquiry.
            </p>

            </form>
          </>
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
  justifyContent: "center",
  padding:
    "clamp(12px, 4vw, 24px)",
  paddingTop: "max(12px, env(safe-area-inset-top, 0px))",
  paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px))",
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
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
  fontSize: "clamp(18px, 4.5vw, 22px)",
  fontWeight: "800",
  color: colors.text,
  letterSpacing: "-0.4px",
  lineHeight: 1.35,
  wordBreak: "break-word",
  overflowWrap: "anywhere",
  hyphens: "auto",
};

const modalSubtitle = {
  margin: "0 0 14px 0",
  fontSize: "14px",
  lineHeight: "1.65",
  color: colors.textLight,
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

const selectInput = {
  ...input,
  background: colors.surface,
  cursor: "pointer",
};

const selectDisabled = {
  background: "#f1f5f9",
  color: "#94a3b8",
  cursor: "not-allowed",
};

const vehicleReadonlyInput = {
  ...input,
  background: "#f8fafc",
  color: colors.text,
  fontWeight: "600",
  cursor: "default",
};

const honeypotInput = {
  position: "absolute",
  left: "-9999px",
  width: "1px",
  height: "1px",
  opacity: 0,
  pointerEvents: "none",
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

const submitBtnLayout = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const submitBtnInner = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
};

const spinner = {
  width: "18px",
  height: "18px",
  border: "2px solid rgba(255,255,255,0.35)",
  borderTopColor: "#ffffff",
  borderRadius: "50%",
  animation: "lead-inquiry-spin 0.7s linear infinite",
  flexShrink: 0,
};

const successView = {
  textAlign: "center",
  padding: "clamp(12px, 3vw, 20px) 4px clamp(8px, 2vw, 12px)",
  animation: "lead-inquiry-fade-in 0.35s ease-out",
};

const successIconRing = {
  width: "72px",
  height: "72px",
  margin: "0 auto 20px",
  borderRadius: "50%",
  background:
    "linear-gradient(135deg, #22c55e, #15803d)",
  boxShadow:
    "0 12px 28px rgba(22, 163, 74, 0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const successCheck = {
  color: "#ffffff",
  fontSize: "34px",
  fontWeight: "800",
  lineHeight: 1,
};

const successTitle = {
  margin: "0 0 12px",
  fontSize: "22px",
  fontWeight: "800",
  color: colors.text,
  letterSpacing: "-0.35px",
};

const successMessage = {
  margin: "0 0 10px",
  fontSize: "15px",
  lineHeight: 1.75,
  color: colors.textLight,
};

const successNote = {
  margin: "0 0 24px",
  fontSize: "13px",
  lineHeight: 1.6,
  color: "#64748b",
};

const successOkBtn = {
  display: "block",
  margin: "0 auto",
  minWidth: "140px",
  maxWidth: "220px",
  width: "100%",
  border: "none",
  borderRadius: "14px",
  padding: "14px 28px",
  fontWeight: "700",
  fontSize: "15px",
  color: "#ffffff",
  cursor: "pointer",
  background: gradientsBtn,
  boxShadow: "0 10px 24px rgba(37, 99, 235, 0.28)",
};
