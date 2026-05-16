import { useState } from "react";
import { card, h2, muted, editorialColors } from "./editorialStyles";

export default function ExtractionViewer({ extractData }) {
  const [expandedPages, setExpandedPages] = useState({});

  if (!extractData?.extract) {
    return (
      <div style={card}>
        <p style={muted}>No raw extraction available for this source.</p>
      </div>
    );
  }

  const { extract, extractionLog, ocrWarnings, provenance } = extractData;
  const pages = extract.payload?.pages || [];
  const tables = extract.payload?.tables || [];

  const togglePage = (n) => {
    setExpandedPages((p) => ({ ...p, [n]: !p[n] }));
  };

  return (
    <div>
      <div style={card}>
        <h2 style={h2}>Extraction provenance</h2>
        <p style={{ fontSize: 13 }}>
          Method: <strong>{provenance?.extractionMethod}</strong> · Confidence:{" "}
          <strong>{provenance?.confidenceLevel}</strong>
        </p>
        <p style={{ ...muted, marginTop: 8 }}>
          Engine: {extract.payload?.engine || "—"} · Pages: {pages.length} ·
          Tables: {tables.length}
        </p>
        {extract._governance?.doNotPublish && (
          <p style={{ color: editorialColors.danger, fontSize: 13 }}>
            doNotPublish — low confidence or placeholder PDF
          </p>
        )}
        {ocrWarnings?.length > 0 && (
          <div style={{ marginTop: 8, fontSize: 13 }}>
            <strong>OCR warnings:</strong>
            <ul>
              {ocrWarnings.map((w) => (
                <li key={w.page}>
                  Page {w.page}: OCR={String(w.ocrUsed)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {pages.map((page) => (
        <div key={page.pageNumber} style={card}>
          <button
            type="button"
            onClick={() => togglePage(page.pageNumber)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
              padding: 0,
            }}
          >
            {expandedPages[page.pageNumber] ? "▼" : "▶"} Page {page.pageNumber}
          </button>
          {expandedPages[page.pageNumber] && (
            <pre
              style={{
                marginTop: 12,
                padding: 12,
                background: "#f8fafc",
                borderRadius: 8,
                fontSize: 12,
                whiteSpace: "pre-wrap",
                maxHeight: 400,
                overflow: "auto",
              }}
            >
              {page.text || page.textBlocks?.join("\n\n") || "(empty)"}
            </pre>
          )}
        </div>
      ))}

      {tables.length > 0 && (
        <div style={card}>
          <h2 style={h2}>Extracted tables</h2>
          {tables.map((t, i) => (
            <pre
              key={i}
              style={{
                fontSize: 11,
                background: "#f8fafc",
                padding: 8,
                borderRadius: 6,
                overflow: "auto",
              }}
            >
              {JSON.stringify(t, null, 2)}
            </pre>
          ))}
        </div>
      )}

      {extractionLog && (
        <div style={card}>
          <h2 style={h2}>Extraction log</h2>
          <pre style={{ fontSize: 11, whiteSpace: "pre-wrap" }}>{extractionLog}</pre>
        </div>
      )}
    </div>
  );
}
