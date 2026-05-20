import { useEffect, useState } from "react";
import SeoHead from "../components/SEO/SeoHead";
import TurnstileWidget from "../components/security/TurnstileWidget";
import { buildStaticPageMeta } from "../seo/pageMetadata";
import { CONTACT_PAGE } from "../content/staticPages";
import { trackContactSubmitted } from "../analytics/funnel";
import { submitContactForm } from "../services/publicFormsApi";
import { isTurnstileConfigured } from "../utils/turnstile";

export default function ContactPage() {
  const { pageTitle, title, subtitle } = CONTACT_PAGE;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("general");
  const [message, setMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await submitContactForm({
        name,
        email,
        phone,
        subject,
        message,
        turnstileToken,
      });
      trackContactSubmitted();
      setSuccess(true);
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setTurnstileToken("");
    } catch (err) {
      setError(err?.message || "Could not send message.");
    } finally {
      setLoading(false);
    }
  };

  const meta = buildStaticPageMeta({
    pageTitle,
    title,
    subtitle,
    path: "/contact",
  });

  return (
    <div style={pageWrapper}>
      <SeoHead meta={meta} />

      <section style={heroSection}>
        <div style={heroOverlay}>
          <h1 style={heroTitle}>{title}</h1>
          <p style={heroSubtitle}>{subtitle}</p>
        </div>
      </section>

      <section style={contentSection}>
        <div style={contentWrapper}>
          <div style={contentCard}>
            <h2 style={sectionTitle}>Send a message</h2>
            <p style={sectionText}>
              For marketplace questions, listings, or general support.
              Dealer and buyer lead forms on vehicle pages are separate.
            </p>

            {success ? (
              <p style={successText}>
                Thank you — your message was received. We will reply to
                your email during business days.
              </p>
            ) : (
              <form onSubmit={handleSubmit} style={formStyle}>
                <label style={labelStyle}>
                  Name *
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={inputStyle}
                    autoComplete="name"
                  />
                </label>

                <label style={labelStyle}>
                  Email *
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                    autoComplete="email"
                  />
                </label>

                <label style={labelStyle}>
                  Phone (optional)
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={inputStyle}
                    autoComplete="tel"
                  />
                </label>

                <label style={labelStyle}>
                  Topic
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="general">General</option>
                    <option value="listings">Listings & data</option>
                    <option value="partnership">Partnership</option>
                    <option value="press">Press</option>
                  </select>
                </label>

                <label style={labelStyle}>
                  Message *
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{ ...inputStyle, resize: "vertical" }}
                    placeholder="How can we help?"
                  />
                </label>

                <TurnstileWidget
                  onToken={setTurnstileToken}
                  onExpire={() => setTurnstileToken("")}
                  onError={() => setTurnstileToken("")}
                />

                {error && (
                  <p style={errorText} role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={
                    loading ||
                    (isTurnstileConfigured() && !turnstileToken)
                  }
                  style={submitBtn}
                >
                  {loading ? "Sending…" : "Send message"}
                </button>

                {isTurnstileConfigured() ? (
                  <p style={captchaNote}>
                    Protected by Cloudflare Turnstile.
                  </p>
                ) : null}
              </form>
            )}

            <p style={{ ...sectionText, marginTop: "1.5rem" }}>
              Or email us directly:{" "}
              <a href="mailto:support@evsavari.com">
                support@evsavari.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

const pageWrapper = {
  minHeight: "100vh",
  background: "#f8fafc",
};

const heroSection = {
  background:
    "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
  color: "#fff",
  padding: "3rem 1.5rem",
};

const heroOverlay = { maxWidth: "720px", margin: "0 auto" };

const heroTitle = {
  margin: 0,
  fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
};

const heroSubtitle = {
  margin: "0.75rem 0 0",
  opacity: 0.9,
  lineHeight: 1.5,
};

const contentSection = { padding: "2rem 1.5rem 4rem" };

const contentWrapper = { maxWidth: "640px", margin: "0 auto" };

const contentCard = {
  background: "#fff",
  borderRadius: "16px",
  padding: "1.75rem",
  boxShadow: "0 12px 40px rgba(15,23,42,0.08)",
};

const sectionTitle = {
  margin: "0 0 0.5rem",
  fontSize: "1.25rem",
  color: "#0f172a",
};

const sectionText = {
  margin: "0 0 1.25rem",
  color: "#64748b",
  lineHeight: 1.6,
};

const formStyle = { display: "flex", flexDirection: "column", gap: "0.25rem" };

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

const submitBtn = {
  marginTop: "0.5rem",
  padding: "0.7rem 1rem",
  borderRadius: "10px",
  border: "none",
  background: "#2563eb",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};

const successText = {
  color: "#15803d",
  fontWeight: 600,
  margin: "1rem 0 0",
};

const errorText = {
  color: "#dc2626",
  fontSize: "0.9rem",
  margin: "0.5rem 0",
};

const captchaNote = {
  fontSize: "0.75rem",
  color: "#94a3b8",
  margin: "0.5rem 0 0",
};
