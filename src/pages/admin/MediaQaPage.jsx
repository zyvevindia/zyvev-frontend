import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { API_URL } from "../../config";
import {
  PRODUCTION_FAMILY_SLUGS,
  PRODUCTION_FAMILY_MEDIA,
} from "../../media/familyMediaManifest.js";
import {
  auditProductionFamilies,
  auditVehicleMedia,
  probeBrokenImages,
  summarizeMediaAudit,
} from "../../utils/mediaAudit.js";

const card = {
  background: "#fff",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  padding: "1.25rem",
  marginBottom: "1.25rem",
};

export default function MediaQaPage() {
  const token = localStorage.getItem("token");
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [probing, setProbing] = useState(false);
  const [broken, setBroken] = useState([]);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setFetchError("");
      try {
        const res = await fetch(`${API_URL}/cars?limit=50`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setCars(Array.isArray(data?.cars) ? data.cars : []);
      } catch (err) {
        if (!cancelled) {
          setCars([]);
          setFetchError(err?.message || "Could not load catalog");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const productionCars = useMemo(() => {
    return cars.filter((c) => {
      const slug = (c.slug || "").toLowerCase();
      return PRODUCTION_FAMILY_SLUGS.some(
        (f) => slug === f || slug.startsWith(`${f}-`)
      );
    });
  }, [cars]);

  const audits = useMemo(
    () => productionCars.map((car) => auditVehicleMedia(car)),
    [productionCars]
  );

  const summary = useMemo(() => summarizeMediaAudit(audits), [audits]);

  const familyRows = useMemo(() => auditProductionFamilies(), []);

  const runProbe = useCallback(async () => {
    setProbing(true);
    const urls = [];
    for (const family of PRODUCTION_FAMILY_SLUGS) {
      const m = PRODUCTION_FAMILY_MEDIA[family];
      urls.push(m.heroImage, m.listingThumbnail, m.compareThumbnail);
    }
    for (const a of audits) {
      urls.push(
        a.roles.hero?.primary,
        a.roles.listing?.primary,
        a.roles.compare?.primary
      );
    }
    const failed = await probeBrokenImages(urls);
    setBroken(failed);
    setProbing(false);
  }, [audits]);

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem" }}>
      <p style={{ marginBottom: "0.5rem" }}>
        <Link to="/admin">← Admin</Link>
      </p>
      <h1 style={{ marginTop: 0 }}>Media QA</h1>
      <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
        Cloudinary delivery, production family coverage, and broken-image checks.
        No routing or SEO impact — catalog URL resolution only.
      </p>

      <div style={card}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>
          CLS & performance
        </h2>
        <ul style={{ fontSize: "0.9rem", color: "#475569", lineHeight: 1.7 }}>
          <li>
            <code>VehicleImage</code> reserves aspect ratio — shimmer until load
            (limits layout shift).
          </li>
          <li>
            Responsive compare/listing cards use Cloudinary width transforms +
            lazy loading.
          </li>
          <li>
            Run <code>npm run media:audit -- --probe</code> before Day 1; fix
            404s on production family heroes.
          </li>
        </ul>
      </div>

      <div style={card}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>
          Production families ({PRODUCTION_FAMILY_SLUGS.length})
        </h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ padding: "0.5rem 0" }}>Family</th>
              <th>Hero</th>
              <th>Listing</th>
              <th>Compare</th>
            </tr>
          </thead>
          <tbody>
            {familyRows.map((row) => (
              <tr key={row.familySlug} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "0.5rem 0" }}>{row.familySlug}</td>
                <td>✓</td>
                <td>✓</td>
                <td>✓</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: 0 }}>
          Upload assets to Cloudinary folder{" "}
          <code>evsavari/catalog/families/{"{slug}"}/</code>
        </p>
      </div>

      <div style={card}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Live catalog audit</h2>
        {fetchError && (
          <p style={{ color: "#dc2626" }}>Catalog fetch failed: {fetchError}</p>
        )}
        {loading ? (
          <p>Loading vehicles…</p>
        ) : (
          <>
            <p>
              Production variants in API: <strong>{productionCars.length}</strong>
              {" · "}
              Cloudinary-ready: <strong>{summary.cloudinaryReady}</strong>
              {" · "}
              Warnings: <strong>{summary.warnings}</strong>
            </p>
            {summary.issues.length > 0 && (
              <ul style={{ fontSize: "0.9rem", color: "#b45309" }}>
                {summary.issues.slice(0, 20).map((issue, i) => (
                  <li key={`${issue.slug}-${issue.role}-${i}`}>
                    {issue.slug} ({issue.role}): {issue.message}
                  </li>
                ))}
              </ul>
            )}
            {productionCars.length === 0 && (
              <p style={{ color: "#64748b" }}>
                No production-family vehicles returned from API. Tier-1 import
                may be pending.
              </p>
            )}
          </>
        )}
      </div>

      <div style={card}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Broken image probe</h2>
        <button
          type="button"
          onClick={runProbe}
          disabled={probing}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            border: "none",
            background: "#0f172a",
            color: "#fff",
            cursor: probing ? "wait" : "pointer",
          }}
        >
          {probing ? "Probing…" : "Run HEAD probe"}
        </button>
        {broken.length > 0 && (
          <ul style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
            {broken.map((row) => (
              <li key={row.url}>
                {row.status || "fail"} — {row.url}
              </li>
            ))}
          </ul>
        )}
        {broken.length === 0 && !probing && (
          <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.75rem" }}>
            Run probe after uploading Cloudinary assets. CLI:{" "}
            <code>npm run media:audit -- --probe</code>
          </p>
        )}
      </div>
    </div>
  );
}
