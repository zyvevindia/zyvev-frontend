import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import TurnstileWidget from "../security/TurnstileWidget";
import { trackFeedbackSubmitted } from "../../analytics/funnel";
import { submitUserFeedback } from "../../services/feedbackApi";
import { BETA_FEEDBACK_ACK_LINE } from "../../config/launchProfiles";
import { colors, radius, shadows } from "../../styles/ui";
import { isTurnstileConfigured } from "../../utils/turnstile";
import {
  FEEDBACK_CATEGORY_DEFS,
  FEEDBACK_SEVERITY_LEVELS,
  getFeedbackCategoryDef,
  normalizeFeedbackCategoryId,
} from "../../ops/feedbackTaxonomy";

export default function ReportIssueModal({
  isOpen,
  onClose,
  context = {},
}) {
  const location = useLocation();
  const [category, setCategory] = useState("other");
  const [severity, setSeverity] = useState("medium");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [screenshot, setScreenshot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const defCat = context.defaultCategory || "other";
    const normalizedCat = normalizeFeedbackCategoryId(defCat);
    setCategory(normalizedCat);
    setSeverity(getFeedbackCategoryDef(normalizedCat).defaultSeverity);
    setDescription("");
    setEmail("");
    setScreenshot("");
    setTurnstileToken("");
    setSuccess(false);
    setError("");
  }, [isOpen, context.defaultCategory]);

  if (!isOpen) return null;

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 800_000) {
      setError("Screenshot must be under 800 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshot(String(reader.result || ""));
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (isTurnstileConfigured() && !turnstileToken) {
      setError(
        "Please complete the security check before submitting."
      );
      setLoading(false);
      return;
    }

    try {
      const result = await submitUserFeedback({
        category,
        severity,
        description,
        email,
        route: location.pathname + location.search,
        context: {
          ...context,
          hash: location.hash,
          feedbackSeverity: severity,
          feedbackCategory: category,
        },
        screenshotDataUrl: screenshot,
        turnstileToken,
      });
      trackFeedbackSubmitted({
        route: location.pathname + location.search,
        category,
        severity,
      });
      setSuccess(true);
      if (result.localOnly) {
        setError(
          "Saved on this device — we will sync when the server is reachable."
        );
      }
    } catch (err) {
      setError(err?.message || "Could not send feedback.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-issue-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(15,23,42,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          maxHeight: "90vh",
          overflow: "auto",
          background: "#fff",
          borderRadius: radius.lg || "14px",
          boxShadow: shadows?.lg || "0 20px 50px rgba(15,23,42,0.2)",
          padding: "1.5rem",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="report-issue-title" style={{ margin: "0 0 0.5rem" }}>
          Report an issue
        </h2>
        <p style={{ color: colors?.muted || "#64748b", fontSize: "0.9rem" }}>
          Structured categories help our editorial team prioritize fixes. We capture this
          page URL automatically.
        </p>

        {success ? (
          <div style={{ marginTop: "1rem" }}>
            <p style={{ color: "#15803d", fontWeight: 600 }}>
              Thank you — your report was received.
            </p>
            {BETA_FEEDBACK_ACK_LINE ? (
              <p style={{ color: "#475569", fontSize: "0.85rem", marginTop: "0.35rem" }}>
                {BETA_FEEDBACK_ACK_LINE}
              </p>
            ) : null}
            {error && (
              <p style={{ color: "#b45309", fontSize: "0.85rem" }}>{error}</p>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                marginTop: "1rem",
                padding: "0.55rem 1rem",
                borderRadius: "8px",
                border: "none",
                background: "#0f172a",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
            <label style={labelStyle}>
              Issue type
              <select
                value={category}
                onChange={(e) => {
                  const next = e.target.value;
                  setCategory(next);
                  setSeverity(getFeedbackCategoryDef(next).defaultSeverity);
                }}
                style={inputStyle}
              >
                {FEEDBACK_CATEGORY_DEFS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            {FEEDBACK_CATEGORY_DEFS.find((c) => c.id === category)?.hint ? (
              <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "-0.35rem" }}>
                {FEEDBACK_CATEGORY_DEFS.find((c) => c.id === category).hint}
              </p>
            ) : null}

            <label style={labelStyle}>
              Severity (for prioritization)
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                style={inputStyle}
              >
                {FEEDBACK_SEVERITY_LEVELS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>

            <label style={labelStyle}>
              What went wrong? *
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you expected vs what happened"
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </label>

            <label style={labelStyle}>
              Email (optional, for follow-up)
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Screenshot (optional, max 800 KB)
              <input
                type="file"
                accept="image/*"
                onChange={handleFile}
                style={{ fontSize: "0.85rem" }}
              />
            </label>

            <TurnstileWidget
              onToken={setTurnstileToken}
              onExpire={() => setTurnstileToken("")}
              onError={() => setTurnstileToken("")}
            />

            {error && !success && (
              <p style={{ color: "#dc2626", fontSize: "0.9rem" }}>{error}</p>
            )}

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                marginTop: "1rem",
              }}
            >
              <button
                type="submit"
                disabled={
                  loading ||
                  (isTurnstileConfigured() && !turnstileToken)
                }
                style={{
                  flex: 1,
                  padding: "0.65rem",
                  borderRadius: "8px",
                  border: "none",
                  background: "#2563eb",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: loading ? "wait" : "pointer",
                }}
              >
                {loading ? "Sending…" : "Send report"}
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "0.65rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: "0.85rem",
  fontWeight: 600,
  color: "#334155",
  marginBottom: "0.75rem",
};

const inputStyle = {
  display: "block",
  width: "100%",
  marginTop: "0.35rem",
  padding: "0.55rem 0.65rem",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  fontSize: "0.95rem",
  boxSizing: "border-box",
};
