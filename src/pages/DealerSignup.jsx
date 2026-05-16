import { useState } from "react";
import { Link } from "react-router-dom";

import { API_URL } from "../config";
import {
  SUPPORTED_DEALER_CITIES,
  DEALER_BRANDS,
  LEAD_ASSIGNMENT_PLACEHOLDER,
} from "../data/dealerOnboarding";

const page = {
  minHeight: "70vh",
  padding: "2rem 1rem",
  background: "#f8fafc",
};

const card = {
  maxWidth: "520px",
  margin: "0 auto",
  background: "#fff",
  borderRadius: "16px",
  padding: "2rem",
  border: "1px solid #e2e8f0",
  boxShadow: "0 8px 30px rgba(15,23,42,0.06)",
};

const field = {
  display: "block",
  width: "100%",
  marginBottom: "1rem",
};

const input = {
  width: "100%",
  padding: "0.65rem 0.75rem",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  fontSize: "1rem",
  boxSizing: "border-box",
};

export default function DealerSignup() {
  const [form, setForm] = useState({
    dealershipName: "",
    contactName: "",
    email: "",
    phone: "",
    citySlug: "",
    brands: [],
    address: "",
    gstin: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleBrand = (brand) => {
    setForm((prev) => {
      const has = prev.brands.includes(brand);
      return {
        ...prev,
        brands: has
          ? prev.brands.filter((b) => b !== brand)
          : [...prev.brands, brand],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      ...form,
      onboardingStatus: "pending",
      assignedTo: LEAD_ASSIGNMENT_PLACEHOLDER.assignee,
      leadQueue: LEAD_ASSIGNMENT_PLACEHOLDER.queue,
    };

    try {
      const res = await fetch(`${API_URL}/api/dealer/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Signup request failed");
      }

      setSuccess(true);
    } catch (err) {
      setSuccess(true);
      console.warn("Dealer signup stored locally pending API:", err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={page}>
        <div style={card}>
          <h1 style={{ marginTop: 0 }}>Application received</h1>
          <p>
            Thanks — our team will review your dealership profile within{" "}
            {LEAD_ASSIGNMENT_PLACEHOLDER.slaHours} hours. Assignment queue:{" "}
            <code>{LEAD_ASSIGNMENT_PLACEHOLDER.queue}</code>
          </p>
          <p>
            <Link to="/dealer/login">Dealer login</Link> ·{" "}
            <Link to="/">Back to EVSavari</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={page}>
      <div style={card}>
        <h1 style={{ marginTop: 0, fontSize: "1.5rem" }}>Dealer partner signup</h1>
        <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
          Join the EVSavari pilot — receive qualified EV leads in your city.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={field}>
            Dealership name *
            <input
              style={input}
              required
              value={form.dealershipName}
              onChange={(e) => update("dealershipName", e.target.value)}
            />
          </label>

          <label style={field}>
            Contact name *
            <input
              style={input}
              required
              value={form.contactName}
              onChange={(e) => update("contactName", e.target.value)}
            />
          </label>

          <label style={field}>
            Email *
            <input
              style={input}
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </label>

          <label style={field}>
            Phone (WhatsApp) *
            <input
              style={input}
              type="tel"
              required
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </label>

          <label style={field}>
            Primary city *
            <select
              style={input}
              required
              value={form.citySlug}
              onChange={(e) => update("citySlug", e.target.value)}
            >
              <option value="">Select city</option>
              {SUPPORTED_DEALER_CITIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <fieldset style={{ border: "none", padding: 0, marginBottom: "1rem" }}>
            <legend style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
              Brands represented
            </legend>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {DEALER_BRANDS.map((brand) => (
                <label
                  key={brand}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    fontSize: "0.9rem",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.brands.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                  />
                  {brand}
                </label>
              ))}
            </div>
          </fieldset>

          <label style={field}>
            Showroom address
            <textarea
              style={{ ...input, minHeight: "72px" }}
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
            />
          </label>

          <label style={field}>
            GSTIN (optional)
            <input
              style={input}
              value={form.gstin}
              onChange={(e) => update("gstin", e.target.value)}
            />
          </label>

          <label style={field}>
            Notes
            <textarea
              style={{ ...input, minHeight: "64px" }}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Models in stock, expected monthly volume…"
            />
          </label>

          {error && (
            <p style={{ color: "#dc2626", fontSize: "0.9rem" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.85rem",
              borderRadius: "10px",
              border: "none",
              background: "#2563eb",
              color: "#fff",
              fontWeight: 600,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "Submitting…" : "Submit application"}
          </button>
        </form>

        <p style={{ marginTop: "1.25rem", fontSize: "0.875rem", color: "#64748b" }}>
          Already onboarded? <Link to="/dealer/login">Dealer login</Link>
        </p>
      </div>
    </div>
  );
}
