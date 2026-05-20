import { useState } from "react";

import TurnstileWidget from "../security/TurnstileWidget";
import { trackNewsletterSubscribed } from "../../analytics/funnel";
import { subscribeNewsletter } from "../../services/publicFormsApi";
import { isTurnstileConfigured } from "../../utils/turnstile";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const result = await subscribeNewsletter({
        email,
        source: "footer",
        turnstileToken,
      });
      trackNewsletterSubscribed({ source: "footer" });
      setMessage(
        result.message ||
          "You are subscribed to EVSavari updates."
      );
      setEmail("");
      setTurnstileToken("");
    } catch (err) {
      setError(err?.message || "Could not subscribe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={wrapper}>
      <h3 style={title}>EV updates</h3>
      <p style={hint}>
        New launches, guides, and marketplace news — no spam.
      </p>

      <form onSubmit={handleSubmit} style={formRow}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={input}
          aria-label="Email for newsletter"
        />
        <button
          type="submit"
          disabled={
            loading ||
            (isTurnstileConfigured() && !turnstileToken)
          }
          style={button}
        >
          {loading ? "…" : "Subscribe"}
        </button>
      </form>

      <TurnstileWidget
        theme="dark"
        size="compact"
        onToken={setTurnstileToken}
        onExpire={() => setTurnstileToken("")}
        onError={() => setTurnstileToken("")}
      />

      {message ? (
        <p style={success}>{message}</p>
      ) : null}
      {error ? (
        <p style={errStyle} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const wrapper = { marginTop: "1.25rem" };

const title = {
  margin: "0 0 0.35rem",
  fontSize: "1rem",
  color: "#fff",
};

const hint = {
  margin: "0 0 0.75rem",
  fontSize: "0.85rem",
  color: "rgba(255,255,255,0.72)",
  lineHeight: 1.45,
};

const formRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem",
};

const input = {
  flex: "1 1 180px",
  padding: "0.55rem 0.65rem",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  fontSize: "0.9rem",
};

const button = {
  padding: "0.55rem 1rem",
  borderRadius: "8px",
  border: "none",
  background: "#2563eb",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};

const success = {
  margin: "0.5rem 0 0",
  fontSize: "0.85rem",
  color: "#86efac",
};

const errStyle = {
  margin: "0.5rem 0 0",
  fontSize: "0.85rem",
  color: "#fca5a5",
};
