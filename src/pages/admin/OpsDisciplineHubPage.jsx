import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { API_URL } from "../../config";
import normalizeCar from "../../utils/normalizeCar";
import { summarizeLocalFeedback } from "../../services/feedbackApi";
import {
  summarizeUsageLearningBuffer,
  listUsageLearningEvents,
} from "../../ops/usageLearningBuffer";
import { summarizeOemQueue } from "../../ops/oemUpdateQueue";
import { summarizeEditorialFlags } from "../../ops/editorialContentFlags";
import { buildPrioritizedFeedbackRows } from "../../ops/buildUsageLearningSummary";
import { getContentRefinementHint } from "../../ops/contentRefinementHints";
import { buildCatalogOpsSummary } from "../../intelligence/catalogAudit.js";
import { buildTopPriorityEvQueue } from "../../ops/topPriorityEvQueue.js";
import { analyzeSeoIndexingDiscipline } from "../../ops/seoIndexingDiscipline.js";
import { buildSeoOpportunityQueue, summarizeSeoOpportunityQueue } from "../../ops/seoOpportunityOps.js";
import { buildCompareImprovementQueue, summarizeCompareImprovement } from "../../ops/compareImprovementOps.js";
import { buildTrustQualityRefinementQueue } from "../../ops/trustQualityOps.js";
import { computeOperationalHealthScore, ingestionStalePendingCount } from "../../ops/operationalHealthScore.js";
import { computeContentQualityOpsScore } from "../../ops/contentQualityScoreOps.js";
import { summarizeIngestionOps } from "../../intelligence/ingestion/ingestionTelemetry.js";
import { loadIngestionQueue } from "../../intelligence/ingestion/reviewQueueStore.js";

const CHECKLIST_KEY = "evsavari-daily-ops-discipline-v1";

const DEFAULT_ITEMS = [
  { id: "smoke", label: "Run post-launch smoke (or CI green on main)" },
  { id: "gsc", label: "GSC: Page indexing — new errors or soft 404s" },
  { id: "leads", label: "Spot-check leads assigned / SLA" },
  { id: "compare", label: "Manual compare 2-EV + mobile spec scroll" },
  { id: "trust", label: "Review top-priority EV queue (trust + stale)" },
  { id: "feedback", label: "Triage high-severity user feedback buffer" },
  { id: "ingest", label: "Review stale / high-risk catalog ingestion sessions" },
  { id: "seo", label: "Skim SEO opportunity queue (indexing + weak engagement)" },
];

function loadChecklist() {
  try {
    const raw = localStorage.getItem(CHECKLIST_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed?.items?.length) return parsed;
  } catch {
    /* ignore */
  }
  return {
    items: DEFAULT_ITEMS.map((d) => ({ ...d, done: false })),
    day: "",
  };
}

function saveChecklist(state) {
  try {
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
}

export default function OpsDisciplineHubPage() {
  const [state, setState] = useState(loadChecklist);
  const [digest, setDigest] = useState(0);
  const [opLoading, setOpLoading] = useState(false);
  const [opErr, setOpErr] = useState("");
  const [opBundle, setOpBundle] = useState(null);

  const feedback = useMemo(() => summarizeLocalFeedback(), [digest]);
  const usage = useMemo(
    () => summarizeUsageLearningBuffer(listUsageLearningEvents()),
    [digest]
  );
  const oem = useMemo(() => summarizeOemQueue(), [digest]);
  const editorial = useMemo(() => summarizeEditorialFlags(), [digest]);
  const prioritized = useMemo(() => buildPrioritizedFeedbackRows(8), [digest]);
  const ingestionSessions = useMemo(() => loadIngestionQueue(), [digest]);
  const ingestionOps = useMemo(
    () => summarizeIngestionOps(ingestionSessions),
    [ingestionSessions, digest]
  );

  const checklistDone = state.items.filter((i) => i.done).length;
  const checklistTotal = state.items.length;

  const healthScore = useMemo(() => {
    if (!opBundle) return null;
    return computeOperationalHealthScore({
      highSeverityFeedback: feedback.severityCounts?.high ?? 0,
      editorialFlagTotal: editorial.total ?? 0,
      checklistDone,
      checklistTotal,
      seoHighSeverity: summarizeSeoOpportunityQueue(opBundle.seoRows).high,
      compareQueueHotspots: summarizeCompareImprovement(opBundle.compareRows).total,
      staleIngestionPending: ingestionStalePendingCount(),
    });
  }, [opBundle, feedback, editorial, checklistDone, checklistTotal, digest]);

  const contentQualityScore = useMemo(() => {
    if (!opBundle?.catalog) return null;
    return computeContentQualityOpsScore(editorial, opBundle.catalog);
  }, [opBundle, editorial]);

  const startDay = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    setState((prev) => {
      if (prev.day === today) return prev;
      const next = {
        day: today,
        items: DEFAULT_ITEMS.map((d) => ({ ...d, done: false })),
      };
      saveChecklist(next);
      return next;
    });
  }, []);

  const toggle = (id) => {
    setState((prev) => {
      const next = {
        ...prev,
        items: prev.items.map((it) =>
          it.id === id ? { ...it, done: !it.done } : it
        ),
      };
      saveChecklist(next);
      return next;
    });
  };

  const loadOperationalSnapshot = useCallback(async () => {
    setOpLoading(true);
    setOpErr("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Admin login required to load snapshot.");

      const [carsRes, snapRes, man, site, disc] = await Promise.all([
        fetch(`${API_URL}/cars?limit=120`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/admin/ops-snapshot?db=false`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/seo-data/content-manifest.json").then((r) => (r.ok ? r.json() : null)),
        fetch("/sitemap-manifest.json").then((r) => (r.ok ? r.json() : null)),
        fetch("/seo-data/discovery-index.json").then((r) => (r.ok ? r.json() : null)),
      ]);

      if (!carsRes.ok) throw new Error("Catalog fetch failed");
      const carsData = await carsRes.json();
      const cars = (carsData?.cars || []).map(normalizeCar);
      const catalog = buildCatalogOpsSummary(cars);

      const snap = snapRes.ok ? await snapRes.json() : {};
      const liveOps = snap.liveOps || snap || {};

      const discipline = analyzeSeoIndexingDiscipline({
        contentManifest: man,
        sitemapManifest: site,
        discoveryIndex: disc,
      });

      const seoRows = buildSeoOpportunityQueue(discipline, {
        topLandingPages: liveOps.topLandingPages,
        topConvertingPages: liveOps.topConvertingPages,
      });

      const compareRows = buildCompareImprovementQueue({
        compareTrends: liveOps.compareTrends || [],
        topCompares: liveOps.topCompares || [],
      });

      const trustQualityRows = buildTrustQualityRefinementQueue(
        catalog.vehicles || [],
        liveOps
      );

      const topEvRows = buildTopPriorityEvQueue(catalog.vehicles || [], liveOps, 8);

      setOpBundle({
        catalog,
        seoRows,
        compareRows,
        trustQualityRows,
        topEvRows,
        disciplineCounts: discipline.counts,
      });
    } catch (e) {
      setOpErr(e?.message || "Snapshot load failed");
      setOpBundle(null);
    } finally {
      setOpLoading(false);
    }
  }, []);

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "1.5rem" }}>
      <nav style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>
        <Link to="/admin">Admin</Link>
        <span style={{ color: "#94a3b8" }}> / Ops discipline</span>
      </nav>

      <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.65rem" }}>
        Operational discipline hub
      </h1>
      <p style={{ color: "#64748b", lineHeight: 1.6 }}>
        Daily cadence for controlled public operations. GSC verification and indexing
        checklist: see repository file{" "}
        <code>docs/launch/google-search-console-readiness.md</code>.
      </p>

      <section
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "1.25rem",
          marginTop: "1rem",
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Operational health (snapshot)</h2>
        <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
          Loads catalog + ops snapshot + shipped manifests (read-only). Heuristic score —
          not a SLA metric.
        </p>
        <button
          type="button"
          onClick={loadOperationalSnapshot}
          disabled={opLoading}
          style={{
            padding: "8px 14px",
            borderRadius: "8px",
            border: "none",
            background: "#0f172a",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {opLoading ? "Loading snapshot…" : "Load operational snapshot"}
        </button>
        {opErr && <p style={{ color: "#b91c1c", marginTop: 8 }}>{opErr}</p>}
        {healthScore != null && (
          <p style={{ marginTop: 12, fontSize: "1.1rem" }}>
            Health score: <strong>{healthScore}</strong> / 100
            {contentQualityScore != null && (
              <>
                {" "}
                · Content quality (heuristic): <strong>{contentQualityScore}</strong> / 100
              </>
            )}
          </p>
        )}
        {opBundle && (
          <div style={{ fontSize: "0.85rem", color: "#475569", marginTop: 10 }}>
            <p style={{ margin: "0 0 6px" }}>
              SEO opportunities: {opBundle.seoRows.length} (high-severity:{" "}
              {summarizeSeoOpportunityQueue(opBundle.seoRows).high}) · Compare queue:{" "}
              {opBundle.compareRows.length} · Trust clarity (hot list):{" "}
              {opBundle.trustQualityRows.length}
            </p>
            <p style={{ margin: 0 }}>
              Indexing manifest: {opBundle.disciplineCounts?.discoveryIndexPages ?? "—"} discovery
              registry paths · Ingestion telemetry: {ingestionOps.eventCount} events · Parse
              failures: {ingestionOps.parseFailures}
            </p>
          </div>
        )}
      </section>

      <section
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "1.25rem",
          marginTop: "1rem",
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Daily review checklist</h2>
        <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
          Day marker: <strong>{state.day || "not started"}</strong>
        </p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          <button
            type="button"
            onClick={startDay}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: "none",
              background: "#0f172a",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Start today&apos;s checklist
          </button>
          <button
            type="button"
            onClick={() => setDigest((x) => x + 1)}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Refresh signals
          </button>
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {state.items.map((it) => (
            <li
              key={it.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "8px 0",
                borderBottom: "1px solid #f1f5f9",
                fontSize: "0.95rem",
              }}
            >
              <input
                type="checkbox"
                checked={Boolean(it.done)}
                onChange={() => toggle(it.id)}
                aria-label={it.label}
              />
              <span style={{ color: it.done ? "#94a3b8" : "#0f172a" }}>{it.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "1.25rem",
          marginTop: "1rem",
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Queue shortcuts</h2>
        <ul style={{ lineHeight: 1.8 }}>
          <li>
            <Link to="/admin/real-usage-learning">Real usage learning</Link> — feedback,
            OEM queue, editorial flags, top EV priority
          </li>
          <li>
            <Link to="/admin/soft-launch-ops">Soft launch ops</Link> — catalog metrics +
            alerts
          </li>
          <li>
            <Link to="/admin/traffic">Traffic intelligence</Link> — landing / compare
            heuristics
          </li>
          <li>
            <Link to="/admin/ops-qa">Operational QA</Link> — GSC links + canonical probe
          </li>
          <li>
            <Link to="/admin/catalog-ops">Catalog intelligence ops</Link>
          </li>
          <li>
            <Link to="/admin/catalog-ingestion">Catalog ingestion</Link> — OEM CSV/JSON
            review queue (no auto-publish)
          </li>
        </ul>
      </section>

      <section
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "1.25rem",
          marginTop: "1rem",
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Unresolved feedback (local)</h2>
        <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
          {feedback.issueCount} reports · High severity: {feedback.severityCounts?.high ?? 0}
        </p>
        <ol style={{ fontSize: "0.85rem", paddingLeft: "1.1rem" }}>
          {prioritized.map((r) => (
            <li key={r.id} style={{ marginBottom: 6 }}>
              {r.categoryLabel} ({r.severity}) — {r.route}
            </li>
          ))}
        </ol>
      </section>

      <section
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "1.25rem",
          marginTop: "1rem",
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Content quality flags</h2>
        <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
          Total flags: {editorial.total}. OEM pending: {oem.byStatus?.pending ?? 0}.
        </p>
        <ul style={{ fontSize: "0.8rem", color: "#475569" }}>
          {editorial.recent.slice(0, 6).map((r) => (
            <li key={r.id}>
              <code>{r.flagType}</code> on {r.pathOrSlug} —{" "}
              {getContentRefinementHint(r.flagType)}
            </li>
          ))}
        </ul>
      </section>

      <section
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "1.25rem",
          marginTop: "1rem",
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Discovery friction (local buffer)</h2>
        <ul style={{ fontSize: "0.85rem" }}>
          {Object.entries(usage.byType || {}).map(([k, v]) => (
            <li key={k}>
              {k}: <strong>{v}</strong>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
