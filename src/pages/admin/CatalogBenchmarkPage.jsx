import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { adminCard } from "./adminOpsStyles";

const card = { ...adminCard, marginBottom: "1rem" };

function pct(n) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${Math.round(n * 1000) / 10}%`;
}

function ComparisonTable({ comparison, costReport, recommendation }) {
  if (!comparison?.comparison) return null;

  const cmp = comparison.comparison;
  const providers = ["heuristic", "openai", "anthropic"];
  const providerLabels = { heuristic: "Heuristic", openai: "OpenAI", anthropic: "Anthropic" };

  const rows = [
    { label: "Field Accuracy", key: "fieldAccuracy" },
    { label: "Price Accuracy", key: "priceAccuracy" },
    { label: "Variant Accuracy", key: "variantAccuracy" },
    { label: "Feature Accuracy", key: "featureAccuracy" },
    { label: "Coverage", key: "coverageScore" },
    { label: "Hallucination Rate", key: "hallucinationRate" },
    { label: "Gate Pass Rate", key: "gatePassRate" },
  ];

  const ran = (id) =>
    comparison.providerAggregates?.some((p) => p.providerId === id && p.ran);

  return (
    <>
      <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse", marginBottom: 16 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
            <th style={{ padding: 8 }}>Metric</th>
            {providers.map((p) => (
              <th key={p} style={{ padding: 8 }}>
                {providerLabels[p]}
                {!ran(p) && p !== "heuristic" && (
                  <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400 }}> (n/a)</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ label, key }) => (
            <tr key={key} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={{ padding: 8 }}>{label}</td>
              {providers.map((p) => (
                <td key={p} style={{ padding: 8, fontWeight: 600 }}>
                  {pct(cmp[key]?.[p])}
                </td>
              ))}
            </tr>
          ))}
          <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
            <td style={{ padding: 8 }}>Avg Latency</td>
            {providers.map((p) => (
              <td key={p} style={{ padding: 8 }}>
                {cmp.avgLatencyMs?.[p] != null ? `${cmp.avgLatencyMs[p]} ms` : "—"}
              </td>
            ))}
          </tr>
          <tr>
            <td style={{ padding: 8 }}>Avg Review Time</td>
            {providers.map((p) => (
              <td key={p} style={{ padding: 8 }}>
                {cmp.avgReviewMinutes?.[p] != null ? `${cmp.avgReviewMinutes[p]} min` : "—"}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {costReport?.byProvider && (
        <>
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>Cost analysis</h3>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", marginBottom: 16 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                <th style={{ padding: 6 }}>Provider</th>
                <th style={{ padding: 6 }}>Per vehicle</th>
                <th style={{ padding: 6 }}>Per 100 vehicles</th>
                <th style={{ padding: 6 }}>Monthly refresh (25)</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(costReport.byProvider).map(([id, c]) => (
                <tr key={id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: 6 }}>{id}</td>
                  <td style={{ padding: 6 }}>
                    ${c.costPerVehicleUsd} / ₹{c.costPerVehicleInr}
                  </td>
                  <td style={{ padding: 6 }}>
                    ${c.costPer100VehiclesUsd} / ₹{c.costPer100VehiclesInr}
                  </td>
                  <td style={{ padding: 6 }}>
                    ${c.monthlyRefreshUsd} / ₹{c.monthlyRefreshInr}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {recommendation?.recommended && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            fontSize: 14,
          }}
        >
          <strong>Recommended default provider: {recommendation.recommended}</strong>
          {recommendation.recommendedModel && (
            <span style={{ color: "#64748b" }}> ({recommendation.recommendedModel})</span>
          )}
          <p style={{ margin: "8px 0 0", color: "#475569", lineHeight: 1.5 }}>
            {recommendation.reason}
          </p>
        </div>
      )}
    </>
  );
}

export default function CatalogBenchmarkPage() {
  const [aggregate, setAggregate] = useState(null);
  const [llmComparison, setLlmComparison] = useState(null);
  const [manifest, setManifest] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/catalog/golden-dataset/manifest.json").then((r) => r.json()),
      fetch("/catalog/benchmark-reports/aggregate.json")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch("/catalog/benchmark-reports/llm-comparison.json")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([m, a, llm]) => {
        setManifest(m);
        setAggregate(a);
        setLlmComparison(llm);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "1.5rem" }}>
      <p style={{ marginBottom: 8 }}>
        <Link to="/admin">← Admin</Link>
        {" · "}
        <Link to="/admin/catalog/import">Catalog Import Wizard</Link>
      </p>

      <h1 style={{ marginTop: 0 }}>Catalog Accuracy Benchmark</h1>
      <p style={{ color: "#64748b", lineHeight: 1.6 }}>
        Compare extraction quality against the golden dataset. Heuristic baseline:{" "}
        <code>npm run catalog-import:benchmark</code>. LLM providers:{" "}
        <code>npm run catalog-import:llm-benchmark</code>
      </p>

      {error && (
        <div style={{ ...card, borderColor: "#fecaca", background: "#fef2f2" }}>{error}</div>
      )}

      <section style={card}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>LLM Provider Comparison</h2>
        {!llmComparison ? (
          <p style={{ color: "#64748b" }}>
            No LLM benchmark yet. Set <code>OPENAI_API_KEY</code> and/or{" "}
            <code>ANTHROPIC_API_KEY</code>, then run{" "}
            <code>npm run catalog-import:llm-benchmark</code>.
          </p>
        ) : (
          <ComparisonTable
            comparison={llmComparison}
            costReport={llmComparison.costReport}
            recommendation={llmComparison.recommendation}
          />
        )}
      </section>

      <section style={card}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Golden dataset</h2>
        {manifest ? (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
            {(manifest.vehicles || []).map((v) => (
              <li key={v.id}>
                {v.displayName} — {v.variantCount} variants ({v.verificationLevel})
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: "#64748b" }}>Loading…</p>
        )}
      </section>

      <section style={card}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Heuristic pipeline (v4 aggregate)</h2>
        {!aggregate ? (
          <p style={{ color: "#64748b" }}>
            No heuristic benchmark yet. Run{" "}
            <code>npm run catalog-import:build-golden</code> then{" "}
            <code>npm run catalog-import:benchmark</code>.
          </p>
        ) : (
          <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ padding: 8 }}>Vehicles evaluated</td>
                <td>
                  <strong>
                    {aggregate.evaluatedCount}/{aggregate.vehicleCount}
                  </strong>
                </td>
              </tr>
              <tr>
                <td style={{ padding: 8 }}>Avg field accuracy</td>
                <td>{pct(aggregate.averageFieldAccuracy)}</td>
              </tr>
              <tr>
                <td style={{ padding: 8 }}>Avg variant accuracy</td>
                <td>{pct(aggregate.averageVariantAccuracy)}</td>
              </tr>
              <tr>
                <td style={{ padding: 8 }}>Avg price accuracy</td>
                <td>{pct(aggregate.averagePriceAccuracy)}</td>
              </tr>
              <tr>
                <td style={{ padding: 8 }}>Avg feature accuracy</td>
                <td>{pct(aggregate.averageFeatureAccuracy)}</td>
              </tr>
              <tr>
                <td style={{ padding: 8 }}>Quality gate pass rate</td>
                <td>{pct(aggregate.qualityGatePassRate)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
