import {
  downloadJsonSnapshot,
  exportRowsAsCsv,
} from "../../ops/opsExport";

export default function OpsExportActions({
  reportType,
  rows = [],
  fullReport = null,
  mapCsvRow,
  filenamePrefix,
}) {
  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button
        type="button"
        disabled={!rows.length}
        onClick={() => {
          if (mapCsvRow && rows.length) {
            exportRowsAsCsv(
              rows,
              mapCsvRow,
              `${filenamePrefix || reportType}-${stamp}.csv`
            );
          }
        }}
        style={{
          padding: "6px 12px",
          borderRadius: 8,
          border: "1px solid #e2e8f0",
          background: "#fff",
          cursor: rows.length ? "pointer" : "not-allowed",
          fontSize: "0.85rem",
        }}
      >
        Export CSV
      </button>
      <button
        type="button"
        disabled={!fullReport}
        onClick={() =>
          downloadJsonSnapshot(
            reportType,
            fullReport,
            filenamePrefix || reportType
          )
        }
        style={{
          padding: "6px 12px",
          borderRadius: 8,
          border: "none",
          background: "#2563eb",
          color: "#fff",
          cursor: fullReport ? "pointer" : "not-allowed",
          fontSize: "0.85rem",
          fontWeight: 600,
        }}
      >
        Export JSON
      </button>
    </div>
  );
}
