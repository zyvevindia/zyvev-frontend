import { useCallback, useEffect, useState } from "react";
import {
  fetchRegistryEntries,
  saveRegistryEntry,
} from "../../services/catalogSourceRegistryApi.js";

const STATUS_LABEL = {
  verified: "Verified",
  needs_verification: "Needs verification",
  deprecated: "Deprecated",
};

export default function AcquisitionQualityDashboard() {
  const [entries, setEntries] = useState([]);
  const [reports, setReports] = useState({});
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRegistryEntries();
      setEntries(data);
      const stored = localStorage.getItem("evsavari-acquisition-quality-reports");
      if (stored) setReports(JSON.parse(stored));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function runCheck(entry) {
    setRunning(entry.id);
    setError(null);
    try {
      const res = await fetch("/api/catalog-v5-acquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          importId: `dash-${entry.id}-${Date.now()}`,
          familySlug: entry.familySlug,
        }),
      });
      const data = await res.json();
      const report = {
        checkedAt: new Date().toISOString(),
        ok: data.ok,
        oemUrl: entry.officialUrl,
        finalUrl: data.pipeline?.urlValidation?.finalUrl || data.pipeline?.urlValidation?.requestedUrl,
        status: data.pipeline?.urlValidation?.status || (data.ok ? "valid" : "failed"),
        pdfFound: data.pipeline?.pdfFound ?? false,
        evidenceCount: data.pipeline?.evidenceRecordCount ?? 0,
        acquisitionScore: data.pipeline?.acquisitionMetrics?.acquisitionScore ?? 0,
        acquisitionFailure: data.pipeline?.acquisitionMetrics?.acquisitionFailure ?? true,
        warnings: data.pipeline?.warnings || data.warnings || [],
        metrics: data.pipeline?.acquisitionMetrics,
        contentComparison: data.pipeline?.contentComparison,
      };
      setReports((prev) => {
        const next = { ...prev, [entry.id]: report };
        localStorage.setItem("evsavari-acquisition-quality-reports", JSON.stringify(next));
        return next;
      });
      if (!data.pipeline?.urlValidation?.valid) {
        saveRegistryEntry({ ...entry, status: "needs_verification" });
        setEntries((prev) =>
          prev.map((e) => (e.id === entry.id ? { ...e, status: "needs_verification" } : e))
        );
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(null);
    }
  }

  function updateEntry(id, field, value) {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  }

  function persistEntry(entry) {
    saveRegistryEntry(entry);
  }

  if (loading) return <p className="text-sm text-gray-500">Loading source registry…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Acquisition Quality (v5)</h2>
        <p className="text-sm text-gray-600 mt-1">
          URL validation, rendered acquisition, PDF discovery, and evidence volume metrics.
          Target: 50+ evidence records per vehicle.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Vehicle</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">OEM URL</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Final URL</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Status</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">PDF</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700">Evidence</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700">Score</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {entries.map((entry) => {
              const report = reports[entry.id];
              return (
                <tr key={entry.id} className="align-top">
                  <td className="px-3 py-3">
                    <div className="font-medium">{entry.brand} {entry.model}</div>
                    <div className="text-xs text-gray-500">{entry.familySlug}</div>
                    <div className="text-xs mt-1">
                      Registry: {STATUS_LABEL[entry.status] || entry.status}
                    </div>
                  </td>
                  <td className="px-3 py-3 max-w-xs">
                    <input
                      className="w-full text-xs border rounded px-2 py-1"
                      value={entry.officialUrl || ""}
                      onChange={(e) => updateEntry(entry.id, "officialUrl", e.target.value)}
                      onBlur={() => persistEntry(entries.find((x) => x.id === entry.id))}
                    />
                    <input
                      className="w-full text-xs border rounded px-2 py-1 mt-1"
                      placeholder="Brochure URL"
                      value={entry.brochureUrl || ""}
                      onChange={(e) => updateEntry(entry.id, "brochureUrl", e.target.value)}
                      onBlur={() => persistEntry(entries.find((x) => x.id === entry.id))}
                    />
                  </td>
                  <td className="px-3 py-3 text-xs break-all max-w-xs text-gray-600">
                    {report?.finalUrl || "—"}
                  </td>
                  <td className="px-3 py-3">
                    {report ? (
                      <span
                        className={
                          report.status === "valid"
                            ? "text-green-700"
                            : "text-amber-700"
                        }
                      >
                        {report.status}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-3">{report ? (report.pdfFound ? "Yes" : "No") : "—"}</td>
                  <td className="px-3 py-3 text-right font-mono">
                    {report ? (
                      <span
                        className={
                          report.evidenceCount >= 50
                            ? "text-green-700"
                            : report.evidenceCount < 20
                              ? "text-red-700"
                              : "text-amber-700"
                        }
                      >
                        {report.evidenceCount}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-3 text-right font-mono">
                    {report?.acquisitionScore ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      disabled={running === entry.id}
                      onClick={() => runCheck(entry)}
                      className="text-xs px-2 py-1 rounded bg-indigo-600 text-white disabled:opacity-50"
                    >
                      {running === entry.id ? "Running…" : "Run check"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {Object.entries(reports).map(([id, report]) => {
        if (!report.contentComparison) return null;
        return (
          <details key={id} className="rounded border border-gray-200 p-3 text-sm">
            <summary className="cursor-pointer font-medium">
              Content layer comparison — {id}
            </summary>
            <pre className="mt-2 text-xs overflow-auto bg-gray-50 p-2 rounded">
              {JSON.stringify(report.contentComparison, null, 2)}
            </pre>
          </details>
        );
      })}
    </div>
  );
}
