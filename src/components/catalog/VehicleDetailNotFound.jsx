import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CompactCarCard from "../CompactCarCard";
import normalizeCar from "../../utils/normalizeCar";
import { fetchCatalogVehiclesForFallback } from "../../utils/vehicleDetailResolver";
import { normalizeVehicleSlug } from "../../utils/vehicleRoutes";

const wrap = {
  minHeight: "80vh",
  padding: "clamp(24px, 4vw, 48px)",
  background: "linear-gradient(to bottom, #f8fafc, #eef2ff)",
};

const card = {
  maxWidth: "560px",
  margin: "0 auto 32px",
  background: "white",
  padding: "clamp(28px, 4vw, 40px)",
  borderRadius: "24px",
  boxShadow: "0 24px 60px rgba(15,23,42,0.08)",
  border: "1px solid #e2e8f0",
  textAlign: "center",
};

const title = { margin: "0 0 12px", fontSize: "clamp(22px, 4vw, 28px)", color: "#0f172a" };
const sub = { margin: "0 0 20px", color: "#64748b", lineHeight: 1.6, fontSize: "15px" };
const code = { fontSize: "13px", background: "#f1f5f9", padding: "2px 6px", borderRadius: "6px" };
const primaryLink = {
  display: "inline-block",
  background: "#0f172a",
  color: "white",
  padding: "12px 22px",
  borderRadius: "12px",
  textDecoration: "none",
  fontWeight: 700,
};
const relatedSection = { maxWidth: "1200px", margin: "0 auto" };
const relatedTitle = { textAlign: "center", marginBottom: "20px", color: "#0f172a", fontSize: "20px" };
const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
  gap: "20px",
};

export default function VehicleDetailNotFound({ requestedSlug }) {
  const [related, setRelated] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const cars = await fetchCatalogVehiclesForFallback(50);
      if (cancelled) return;
      const normalized = requestedSlug ? normalizeVehicleSlug(requestedSlug) : "";
      const prefix = normalized?.split("-").slice(0, 2).join("-");
      const scored = cars
        .map((c) => {
          const car = normalizeCar(c);
          const slug = car.slug || "";
          let score = 0;
          if (slug === normalized) score = 100;
          else if (prefix && slug.startsWith(prefix)) score = 50;
          return { car, score };
        })
        .filter((x) => x.car.slug)
        .sort((a, b) => b.score - a.score);
      setRelated(scored.slice(0, 6).map((x) => x.car));
    }
    load();
    return () => { cancelled = true; };
  }, [requestedSlug]);

  return (
    <div style={wrap}>
      <div style={card}>
        <h2 style={title}>Vehicle not found</h2>
        <p style={sub}>
          {requestedSlug ? (
            <>
              We could not load <code style={code}>{requestedSlug}</code> from the catalog.
            </>
          ) : (
            <>This EV is not in our catalog.</>
          )}
        </p>
        <Link to="/cars" style={primaryLink}>Browse all EVs</Link>
      </div>
      {related.length > 0 && (
        <section style={relatedSection}>
          <h3 style={relatedTitle}>You may be looking for</h3>
          <div style={grid}>
            {related.map((car) => (
              <CompactCarCard key={car.slug || car._id} car={car} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
