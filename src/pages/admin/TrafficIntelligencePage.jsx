import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { fetchTrafficIntelligence } from "../../services/trafficIntelligenceApi";
import { BEHAVIORAL_INTELLIGENCE_ENABLED } from "../../config";

const card = {
  background: "#fff",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  padding: "1.25rem",
  marginBottom: "1rem",
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.9rem",
};

function RankedTable({ rows, emptyLabel = "No data yet" }) {
  if (!rows?.length) {
    return <p style={{ color: "#64748b", margin: 0 }}>{emptyLabel}</p>;
  }
  return (
    <table style={table}>
      <thead>
        <tr>
          <th style={{ textAlign: "left", padding: "0.5rem 0" }}>#</th>
          <th style={{ textAlign: "left" }}>Label</th>
          <th style={{ textAlign: "right" }}>Count</th>
        </tr>
      </thead>
      <tbody>
        {rows.slice(0, 10).map((row, i) => (
          <tr key={`${row.label}-${i}`}>
            <td style={{ padding: "0.35rem 0", color: "#94a3b8" }}>{i + 1}</td>
            <td>{row.label}</td>
            <td style={{ textAlign: "right", fontWeight: 600 }}>{row.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function TrafficIntelligencePage() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    fetchTrafficIntelligence(days, token)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load traffic intelligence.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [days, token]);

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1100px", margin: "0 auto" }}>
      <nav style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>
        <Link to="/admin">Admin</Link>
        <span style={{ color: "#94a3b8" }}> / Traffic intelligence</span>
      </nav>

      <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.75rem" }}>
        Traffic & lead intelligence
      </h1>
      <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
        Aggregates behavioral events and lead analytics. Enable{" "}
        <code>VITE_BEHAVIORAL_INTELLIGENCE</code> for full event streams.
      </p>

      <div style={{ marginBottom: "1rem", display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
        <label>
          Period{" "}
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
          </select>
        </label>
        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
          Behavioral tracking:{" "}
          {BEHAVIORAL_INTELLIGENCE_ENABLED ? "on" : "off"}
        </span>
        {data?.source && (
          <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
            Source: {data.source}
          </span>
        )}
      </div>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      {data && !loading && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <div style={card}>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                Lead conversions
              </div>
              <strong style={{ fontSize: "1.5rem" }}>
                {data.leadConversions.total}
              </strong>
            </div>
            <div style={card}>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                Compare completed
              </div>
              <strong style={{ fontSize: "1.5rem" }}>
                {data.compareConversions.total}
              </strong>
            </div>
            <div style={card}>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                Compare started
              </div>
              <strong style={{ fontSize: "1.5rem" }}>
                {data.compareConversions.started}
              </strong>
            </div>
            {data.compareConversions.completionRate != null && (
              <div style={card}>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Compare completion %
                </div>
                <strong style={{ fontSize: "1.5rem" }}>
                  {data.compareConversions.completionRate}%
                </strong>
              </div>
            )}
          </div>

          {data.conversionFunnel?.length > 0 && (
            <section style={card}>
              <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>
                Conversion funnel
              </h2>
              <table style={table}>
                <tbody>
                  {data.conversionFunnel.map((step) => (
                    <tr key={step.stage}>
                      <td style={{ padding: "0.35rem 0" }}>{step.stage}</td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {step.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <section style={card}>
            <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>
              Top landing pages
            </h2>
            <RankedTable
              rows={data.topLandingPages}
              emptyLabel="No landing page views recorded."
            />
          </section>

          <section style={card}>
            <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>
              City demand heatmap
            </h2>
            <RankedTable
              rows={data.cityDemandHeatmap}
              emptyLabel="No city demand signals yet."
            />
          </section>

          <section style={card}>
            <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>
              Lead source attribution
            </h2>
            <RankedTable
              rows={data.leadConversions?.bySource}
              emptyLabel="No leads in this period."
            />
          </section>

          {data.compareTrends?.length > 0 && (
            <section style={card}>
              <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>
                Compare conversion trends
              </h2>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Compare slug</th>
                    <th style={{ textAlign: "right" }}>Started</th>
                    <th style={{ textAlign: "right" }}>Completed</th>
                    <th style={{ textAlign: "right" }}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.compareTrends.map((row) => (
                    <tr key={row.slug}>
                      <td>{row.slug}</td>
                      <td style={{ textAlign: "right" }}>{row.started}</td>
                      <td style={{ textAlign: "right" }}>{row.completed}</td>
                      <td style={{ textAlign: "right" }}>
                        {row.completionRate ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <section style={card}>
            <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Top city pages</h2>
            <RankedTable
              rows={data.topCityPages}
              emptyLabel="No city page views recorded."
            />
          </section>

          <section style={card}>
            <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Top compare pages</h2>
            <RankedTable rows={data.topComparePages} />
          </section>

          <section style={card}>
            <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Top viewed EVs</h2>
            <RankedTable rows={data.topViewedEvs} />
          </section>

          <section style={card}>
            <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>CTA clicks</h2>
            <RankedTable rows={data.ctaClicks} />
          </section>

          <section style={card}>
            <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Variant interest</h2>
            <RankedTable rows={data.variantInterest} />
          </section>
        </>
      )}
    </div>
  );
}
