import { useEffect, useMemo, useState } from "react";

import {
  fetchGoldenManifest,
  fetchGoldenDossier,
  runFullBenchmarkReport,
} from "../../catalogAcquisition/benchmark/index.js";
import ConfidenceBadge from "./ConfidenceBadge.jsx";

const card = {
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: "1rem",
  marginBottom: "1rem",
  background: "#fff",
};

function pct(n) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${Math.round(n * 1000) / 10}%`;
}

function MetricBar({ label, value, color = "#2563eb" }) {
  const width = value != null ? Math.round(value * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
        <span>{label}</span>
        <strong>{pct(value)}</strong>
      </div>
      <div style={{ height: 8, background: "#f1f5f9", borderRadius: 999 }}>
        <div
          style={{
            width: `${width}%`,
            height: "100%",
            background: color,
            borderRadius: 999,
            transition: "width 0.3s",
          }}
        />
      </div>
    </div>
  );
}

export default function CatalogQualityDashboard({
  importRecord = null,
  evidenceRecords = [],
  reviewSession = null,
  familySlug = null,
}) {
  const [manifest, setManifest] = useState(null);
  const [golden, setGolden] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const slug =
    familySlug ||
    importRecord?.reviewedVehicle?.vehicle?.familySlug?.value ||
    importRecord?.extractedVehicle?.vehicle?.familySlug?.value ||
    null;

  useEffect(() => {
    fetchGoldenManifest()
      .then(setManifest)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!manifest || !slug) {
      setGolden(null);
      return;
    }
    const entry = (manifest.vehicles || []).find((v) => v.familySlug === slug);
    if (!entry) {
      setGolden(null);
      return;
    }
    setLoading(true);
    fetchGoldenDossier(entry.id)
      .then(setGolden)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [manifest, slug]);

  const report = useMemo(() => {
    if (!importRecord) return null;
    return runFullBenchmarkReport({
      importRecord,
      goldenDossier: golden,
      evidenceRecords,
      reviewSession,
    });
  }, [importRecord, golden, evidenceRecords, reviewSession]);

  if (!importRecord) return null;

  return (
    <section style={card}>
      <h3 style={{ marginTop: 0, fontSize: 16 }}>Quality & Benchmark (v4)</h3>

      {error && <p style={{ color: "#dc2626", fontSize: 13 }}>{error}</p>}
      {loading && <p style={{ color: "#64748b", fontSize: 13 }}>Loading golden dataset…</p>}

      {!slug && (
        <p style={{ color: "#64748b", fontSize: 13 }}>
          Set family slug to compare against golden benchmark.
        </p>
      )}

      {slug && !golden && !loading && (
        <p style={{ color: "#64748b", fontSize: 13 }}>
          No golden dossier for <code>{slug}</code>. Available:{" "}
          {(manifest?.vehicles || []).map((v) => v.familySlug).join(", ")}
        </p>
      )}

      {report?.qualityGates && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            marginBottom: 12,
            background: report.qualityGates.passed ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${report.qualityGates.passed ? "#86efac" : "#fecaca"}`,
          }}
        >
          <strong>
            Publish gates: {report.qualityGates.passed ? "PASS" : "BLOCKED"}
          </strong>
          {report.qualityGates.failures.length > 0 && (
            <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 13 }}>
              {report.qualityGates.failures.map((f) => (
                <li key={`${f.gate}-${f.fieldKey || f.message}`}>{f.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {report?.evaluation && (
        <>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
            vs golden: <strong>{golden?.displayName}</strong>
          </p>
          <MetricBar label="Field accuracy" value={report.evaluation.fieldAccuracy} />
          <MetricBar label="Variant accuracy" value={report.evaluation.variantAccuracy} color="#7c3aed" />
          <MetricBar label="Price accuracy" value={report.evaluation.priceAccuracy} color="#059669" />
          <MetricBar label="Feature accuracy" value={report.evaluation.featureAccuracy} color="#d97706" />
        </>
      )}

      {report?.calibration && (
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            Confidence calibration
          </summary>
          <table style={{ width: "100%", fontSize: 12, marginTop: 8, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: 4 }}>Band</th>
                <th>Predicted</th>
                <th>Correct</th>
                <th>Precision</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(report.calibration.bands).map(([band, stats]) => (
                <tr key={band} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: 4 }}>{band}</td>
                  <td>{stats.predicted}</td>
                  <td>{stats.correct}</td>
                  <td>{pct(stats.precision)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}

      {report?.hallucination?.count > 0 && (
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#b45309" }}>
            Hallucination flags ({report.hallucination.count})
          </summary>
          <ul style={{ fontSize: 12, marginTop: 8 }}>
            {report.hallucination.fields.slice(0, 15).map((f) => (
              <li key={`${f.fieldKey}-${f.reason}`}>
                <code>{f.fieldKey}</code> — {f.reason} ({f.severity})
              </li>
            ))}
          </ul>
        </details>
      )}

      {report?.evidenceCoverage && (
        <p style={{ fontSize: 12, color: "#64748b", marginTop: 12 }}>
          Evidence coverage: {report.evidenceCoverage.populatedCount} populated fields · avg quality{" "}
          {report.evidenceCoverage.averageEvidenceQuality}/100 ·{" "}
          {report.evidenceCoverage.weakAreaCount} weak area(s)
        </p>
      )}

      {report?.reviewMetrics?.durationMinutes != null && (
        <p style={{ fontSize: 12, color: "#64748b" }}>
          Review time: {report.reviewMetrics.durationMinutes} min · edited{" "}
          {report.reviewMetrics.fieldsEditedCount} · approved {report.reviewMetrics.fieldsApprovedCount}
        </p>
      )}

      {importRecord.confidenceScore != null && (
        <p style={{ fontSize: 12, marginTop: 8 }}>
          Overall confidence: <ConfidenceBadge score={importRecord.confidenceScore} compact />
        </p>
      )}
    </section>
  );
}
