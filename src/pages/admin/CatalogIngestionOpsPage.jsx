import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { API_URL } from "../../config";
import normalizeCar from "../../utils/normalizeCar";
import { logOpsAudit, AUDIT_ACTIONS } from "../../services/opsAuditLog";
import { runIngestionPipeline } from "../../intelligence/ingestion/runIngestionPipeline.js";
import { buildIngestionAttribution } from "../../intelligence/ingestion/sourceAttribution.js";
import {
  buildPublishBundle,
  simulateIntelligenceImpact,
} from "../../intelligence/ingestion/publishBundle.js";
import {
  appendIngestionSession,
  loadIngestionQueue,
  queueSummaryCounts,
  saveIngestionQueueSessions,
  updateIngestionSession,
} from "../../intelligence/ingestion/reviewQueueStore.js";
import {
  REVIEW_STATUS,
  CHANGE_SEVERITY,
} from "../../intelligence/ingestion/constants.js";
import {
  getRecentIngestionTelemetryEvents,
  recordIngestionTelemetryEvent,
  summarizeIngestionOps,
  taxonomyKeysFromSession,
} from "../../intelligence/ingestion/ingestionTelemetry.js";

const card = {
  background: "#fff",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  padding: "1.25rem",
  marginBottom: "1rem",
};

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CatalogIngestionOpsPage() {
  const [cars, setCars] = useState([]);
  const [hotSlugs, setHotSlugs] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [kind, setKind] = useState("json");
  const [text, setText] = useState("");
  const [sessions, setSessions] = useState(() => loadIngestionQueue());
  const [reviewer, setReviewer] = useState(() => {
    try {
      return localStorage.getItem("evsavari-ingestion-reviewer") || "";
    } catch {
      return "";
    }
  });
  const [notes, setNotes] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [telemetryTick, setTelemetryTick] = useState(0);

  const reloadQueue = useCallback(() => {
    setSessions(loadIngestionQueue());
  }, []);

  const counts = useMemo(() => queueSummaryCounts(sessions), [sessions]);

  const ingestionTelemetry = useMemo(
    () => summarizeIngestionOps(sessions),
    [sessions, telemetryTick]
  );

  const recentTelemetry = useMemo(
    () => getRecentIngestionTelemetryEvents(12),
    [sessions, telemetryTick]
  );

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/cars?limit=200`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to load catalog");
      const data = await res.json();
      const list = (data?.cars || []).map(normalizeCar);
      setCars(list);

      if (token) {
        try {
          const snap = await fetch(`${API_URL}/api/admin/ops-snapshot?db=false`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (snap.ok) {
            const j = await snap.json();
            const top = j?.liveOps?.topViewed || j?.topViewedEvs || [];
            const s = new Set(
              top
                .map((r) => String(r.slug || r.familySlug || "").toLowerCase())
                .filter(Boolean)
            );
            setHotSlugs(s);
          }
        } catch {
          /* optional */
        }
      }
    } catch (e) {
      setError(e?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const runImport = () => {
    setError("");
    const result = runIngestionPipeline(kind, text, { importActor: reviewer }, cars);
    if (!result.ok) {
      recordIngestionTelemetryEvent({
        outcome: "parse_failed",
        detail: (result.parseErrors || []).join("; ").slice(0, 500),
        meta: { kind },
      });
      setTelemetryTick((t) => t + 1);
      setError(result.parseErrors.join("; "));
      return;
    }
    appendIngestionSession(result.session);
    recordIngestionTelemetryEvent({
      outcome: "queued",
      sessionId: result.session.id,
      detail: `rows:${result.session.diagnostics?.rowCount ?? 0}`,
      meta: {
        taxonomyHintKeys: taxonomyKeysFromSession(result.session),
        sourceSystem: result.session.sourceSystem,
      },
    });
    setTelemetryTick((t) => t + 1);
    logOpsAudit({
      action: AUDIT_ACTIONS.CATALOG_INGESTION_QUEUED,
      actorLabel: reviewer || "admin",
      targetType: "ingestion_session",
      targetId: result.session.id,
      metadata: {
        sourceSystem: result.session.sourceSystem,
        rows: result.session.diagnostics.rowCount,
      },
    });
    reloadQueue();
    setNotes("");
  };

  const setStatus = (id, status) => {
    const s = loadIngestionQueue().find((x) => x.id === id);
    if (!s) return;
    try {
      localStorage.setItem("evsavari-ingestion-reviewer", reviewer);
    } catch {
      /* ignore */
    }

    if (status === REVIEW_STATUS.APPROVED) {
      const bySlug = new Map(cars.map((c) => [String(c.slug).toLowerCase(), c]));
      const attribution = buildIngestionAttribution({
        sourceSystem: s.sourceSystem,
        importActor: reviewer,
        reviewer,
        reviewedAt: new Date().toISOString(),
      });
      const publishBundle = buildPublishBundle(s, bySlug, attribution);
      const sim = simulateIntelligenceImpact(cars, s.normalizedItems);
      updateIngestionSession(id, {
        status,
        reviewer,
        reviewNotes: notes,
        publishBundle,
        simulatedImpact: sim,
      });
      logOpsAudit({
        action: AUDIT_ACTIONS.CATALOG_INGESTION_APPROVED,
        actorLabel: reviewer || "admin",
        targetType: "ingestion_session",
        targetId: id,
        metadata: {
          bundleId: publishBundle.bundleId,
          slugs: s.normalizedItems.map((r) => r.slug),
        },
      });
      recordIngestionTelemetryEvent({
        outcome: "approved",
        sessionId: id,
        detail: `slugs:${s.normalizedItems?.length ?? 0}`,
        meta: {
          taxonomyHintKeys: taxonomyKeysFromSession(s),
          reviewer: reviewer || "",
        },
      });
      setTelemetryTick((t) => t + 1);
    } else {
      updateIngestionSession(id, {
        status,
        reviewer,
        reviewNotes: notes,
      });
      logOpsAudit({
        action:
          status === REVIEW_STATUS.REJECTED
            ? AUDIT_ACTIONS.CATALOG_INGESTION_REJECTED
            : AUDIT_ACTIONS.CATALOG_INGESTION_DEFERRED,
        actorLabel: reviewer || "admin",
        targetType: "ingestion_session",
        targetId: id,
        metadata: { notes },
      });
      recordIngestionTelemetryEvent({
        outcome:
          status === REVIEW_STATUS.REJECTED
            ? "rejected"
            : status === REVIEW_STATUS.DEFERRED
              ? "deferred"
              : "status_change",
        sessionId: id,
        detail: (notes || "").slice(0, 240),
        meta: { reviewer: reviewer || "", status },
      });
      setTelemetryTick((t) => t + 1);
    }
    reloadQueue();
    setNotes("");
  };

  const exportBundle = (session) => {
    if (!session.publishBundle) return;
    downloadJson(`${session.publishBundle.bundleId}.json`, session.publishBundle);
    logOpsAudit({
      action: AUDIT_ACTIONS.CATALOG_INGESTION_EXPORTED,
      actorLabel: reviewer || "admin",
      targetType: "ingestion_session",
      targetId: session.id,
      metadata: { bundleId: session.publishBundle.bundleId },
    });
  };

  const clearQueue = () => {
    if (!window.confirm("Clear all ingestion sessions from this browser?")) return;
    saveIngestionQueueSessions([]);
    reloadQueue();
  };

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1100px", margin: "0 auto" }}>
      <p style={{ marginBottom: 8 }}>
        <Link to="/admin">← Admin</Link>
        {" · "}
        <Link to="/admin/catalog-ops">Catalog ops</Link>
        {" · "}
        <Link to="/admin/ops-discipline">Ops discipline</Link>
      </p>

      <h1 style={{ marginTop: 0 }}>Catalog ingestion (semi-automated)</h1>
      <p style={{ color: "#64748b", maxWidth: 720 }}>
        Deterministic parse → normalize → diff → <strong>human review queue</strong> → export
        publish bundle. Nothing here writes to production catalog or regenerates SEO automatically —
        apply bundles via backend / controlled pipeline.
      </p>

      <section style={card}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Queue health</h2>
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.9rem" }}>
          <span>
            Pending: <strong>{counts.pending}</strong>
          </span>
          <span>
            Stale pending (&gt;7d): <strong>{counts.stalePending}</strong>
          </span>
          <span>
            High-severity pending: <strong>{counts.highSeverityPending}</strong>
          </span>
          <span>
            Approved / rejected / deferred:{" "}
            <strong>
              {counts.approved}/{counts.rejected}/{counts.deferred}
            </strong>
          </span>
        </div>
        <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: 0 }}>
          Docs: <code>docs/ingestion/</code> — runbook + rollback + checklists.
        </p>
      </section>

      <section style={card}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Ingestion confidence (local browser)</h2>
        <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 0 }}>
          Telemetry stays in this browser — use for reviewer rhythm and repeated taxonomy mismatch
          triage. Does not replace audit logs.
        </p>
        <ul style={{ fontSize: "0.85rem", color: "#334155", paddingLeft: "1.1rem" }}>
          <li>Telemetry events (cap 120): {ingestionTelemetry.eventCount}</li>
          <li>Parse failures recorded: {ingestionTelemetry.parseFailures}</li>
          <li>Approved actions recorded: {ingestionTelemetry.approvedExports}</li>
          <li>High-risk pending (intelligence/pricing): {ingestionTelemetry.highRiskPending}</li>
          <li>Queue sessions: {ingestionTelemetry.sessionHistorySize}</li>
        </ul>
        {ingestionTelemetry.repeatedTaxonomyMismatchKeys?.length ? (
          <div style={{ marginTop: "0.75rem" }}>
            <strong style={{ fontSize: "0.85rem" }}>Repeated taxonomy hints (≥2)</strong>
            <ul style={{ fontSize: "0.8rem", color: "#475569" }}>
              {ingestionTelemetry.repeatedTaxonomyMismatchKeys.map((r) => (
                <li key={r.key}>
                  <code>{r.key}</code> — {r.count}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {Object.keys(ingestionTelemetry.reviewerCounts || {}).length ? (
          <div style={{ marginTop: "0.75rem" }}>
            <strong style={{ fontSize: "0.85rem" }}>Reviewer labels (queued sessions)</strong>
            <ul style={{ fontSize: "0.8rem", color: "#475569" }}>
              {Object.entries(ingestionTelemetry.reviewerCounts).map(([k, v]) => (
                <li key={k || "—"}>
                  {k || "(unset)"}: {v}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <h3 style={{ fontSize: "0.9rem", marginTop: "1rem" }}>Recent events</h3>
        {recentTelemetry.length === 0 ? (
          <p style={{ fontSize: "0.8rem", color: "#64748b" }}>No telemetry rows yet.</p>
        ) : (
          <ol style={{ fontSize: "0.75rem", color: "#475569", paddingLeft: "1.1rem" }}>
            {recentTelemetry.map((ev, i) => (
              <li key={`${ev.at}-${i}`} style={{ marginBottom: 4 }}>
                <code>{ev.outcome}</code> · {ev.at}
                {ev.detail ? ` — ${ev.detail}` : ""}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section style={card}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>1. Load live catalog snapshot</h2>
        <button
          type="button"
          onClick={loadCatalog}
          disabled={loading}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: "#0f172a",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {loading ? "Loading…" : "Load catalog (API)"}
        </button>
        <span style={{ marginLeft: 12, fontSize: "0.85rem", color: "#64748b" }}>
          {cars.length} vehicles · hot slugs: {hotSlugs.size}
        </span>
        {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
      </section>

      <section style={card}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>2. Import CSV or JSON</h2>
        <label style={{ display: "block", marginBottom: 8 }}>
          Format{" "}
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="json">JSON (evsavari-ingestion/1)</option>
            <option value="csv">CSV (header row)</option>
          </select>
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          style={{ width: "100%", fontFamily: "monospace", fontSize: "0.8rem" }}
          placeholder={
            kind === "json"
              ? '{ "format": "evsavari-ingestion/1", "sourceSystem": "oem", "items": [ { "slug": "tata-nexon-ev", "starting_price": 1599000 } ] }'
              : "slug,starting_price,range_km\n tata-nexon-ev,1599000,465"
          }
        />
        <div style={{ marginTop: 8 }}>
          <label>
            Reviewer label{" "}
            <input
              value={reviewer}
              onChange={(e) => setReviewer(e.target.value)}
              style={{ minWidth: 200 }}
            />
          </label>
        </div>
        <button
          type="button"
          onClick={runImport}
          style={{
            marginTop: 12,
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: "#2563eb",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Parse & queue for review
        </button>
      </section>

      <section style={card}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>3. Review queue</h2>
        <button type="button" onClick={reloadQueue} style={{ marginRight: 8 }}>
          Refresh list
        </button>
        <button type="button" onClick={clearQueue}>
          Clear local queue
        </button>

        {sessions.length === 0 ? (
          <p style={{ color: "#64748b" }}>No sessions yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {sessions.map((s) => {
              const hot = s.normalizedItems?.some((r) => hotSlugs.has(r.slug));
              const sevColor =
                s.maxSeverity === CHANGE_SEVERITY.INTELLIGENCE
                  ? "#b91c1c"
                  : s.maxSeverity === CHANGE_SEVERITY.PRICING
                    ? "#c2410c"
                    : "#64748b";
              return (
                <li
                  key={s.id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 10,
                    padding: "0.75rem 1rem",
                    marginBottom: 10,
                  }}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                    <strong>{s.id.slice(0, 8)}…</strong>
                    <span style={{ textTransform: "uppercase", fontSize: "0.75rem" }}>
                      {s.status}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{s.sourceSystem}</span>
                    <span style={{ fontSize: "0.8rem", color: sevColor }}>max: {s.maxSeverity}</span>
                    {hot ? (
                      <span style={{ fontSize: "0.75rem", color: "#b45309", fontWeight: 700 }}>
                        hot-traffic slug
                      </span>
                    ) : null}
                    <button type="button" onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}>
                      {expandedId === s.id ? "Hide" : "Details"}
                    </button>
                  </div>
                  {expandedId === s.id && (
                    <div style={{ marginTop: 10, fontSize: "0.85rem" }}>
                      <pre
                        style={{
                          background: "#f8fafc",
                          padding: 10,
                          borderRadius: 8,
                          overflow: "auto",
                          maxHeight: 220,
                        }}
                      >
                        {s.healthSummaryText}
                        {"\n"}
                        {JSON.stringify(
                          {
                            duplicateSlugs: s.diagnostics.duplicateSlugs,
                            dangerousPrices: s.diagnostics.dangerousPrices,
                          },
                          null,
                          2
                        )}
                      </pre>
                      <div style={{ marginTop: 8 }}>
                        <strong>Diffs</strong>
                        <ul>
                          {(s.diffReports || []).map((d) => (
                            <li key={d.slug}>
                              <code>{d.slug}</code> — {d.changes?.length || 0} change(s) —{" "}
                              {d.severity}
                              {d.missingCatalog ? " (missing in snapshot)" : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {s.status === REVIEW_STATUS.PENDING && (
                        <div style={{ marginTop: 10 }}>
                          <textarea
                            placeholder="Review notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            style={{ width: "100%" }}
                          />
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                            <button type="button" onClick={() => setStatus(s.id, REVIEW_STATUS.APPROVED)}>
                              Approve (build bundle)
                            </button>
                            <button type="button" onClick={() => setStatus(s.id, REVIEW_STATUS.REJECTED)}>
                              Reject
                            </button>
                            <button type="button" onClick={() => setStatus(s.id, REVIEW_STATUS.DEFERRED)}>
                              Defer
                            </button>
                          </div>
                        </div>
                      )}
                      {s.status === REVIEW_STATUS.APPROVED && s.publishBundle && (
                        <button type="button" onClick={() => exportBundle(s)} style={{ marginTop: 8 }}>
                          Download publish bundle JSON
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
