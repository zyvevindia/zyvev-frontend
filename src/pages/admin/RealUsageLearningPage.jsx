import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { API_URL } from "../../config";
import normalizeCar from "../../utils/normalizeCar";
import { buildContentOpsSummary } from "../../intelligence/contentOpsAudit.js";
import { safeFetchJson } from "../../utils/safeFetch";
import { buildUsageLearningDashboardPayload } from "../../ops/buildUsageLearningSummary.js";
import { rankMissingCompareGuidesForPopularPairs } from "../../ops/compareGuideCoverageOps.js";
import { buildCatalogExpansionReport } from "../../ops/catalogExpansionOps.js";
import { buildTrustRefinementQueue, summarizeTrustWarnings } from "../../ops/trustRefinementOps.js";
import { findStaleHighTrafficFamilies } from "../../ops/staleHighTrafficOps.js";
import { buildTopPriorityEvQueue } from "../../ops/topPriorityEvQueue.js";
import {
  buildCompareImprovementQueue,
  summarizeCompareImprovement,
} from "../../ops/compareImprovementOps.js";
import { buildTrustQualityRefinementQueue } from "../../ops/trustQualityOps.js";
import { buildUsageFrictionSummary } from "../../ops/usageFrictionOps.js";
import {
  appendEditorialContentFlag,
  FLAG_TYPES,
} from "../../ops/editorialContentFlags.js";
import { appendOemQueueItem } from "../../ops/oemUpdateQueue.js";

const card = {
  background: "#fff",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  padding: "1.25rem",
  marginBottom: "1rem",
};

export default function RealUsageLearningPage() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [oemSlug, setOemSlug] = useState("");
  const [oemField, setOemField] = useState("range");
  const [oemNote, setOemNote] = useState("");
  const [flagPath, setFlagPath] = useState("");
  const [flagType, setFlagType] = useState(FLAG_TYPES[0]);
  const [flagNote, setFlagNote] = useState("");
  const [localDigest, setLocalDigest] = useState(0);

  const learning = useMemo(
    () => buildUsageLearningDashboardPayload(),
    [localDigest, snapshot]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const catalogRes = await safeFetchJson(`${API_URL}/cars?limit=100`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        label: "usage_learning_catalog",
      });
      if (!catalogRes.ok) {
        throw new Error(catalogRes.error || "Catalog fetch failed");
      }
      const normalized = (catalogRes.data?.cars || []).map(normalizeCar);
      const summary = buildContentOpsSummary(normalized);
      if (token) {
        const opsRes = await safeFetchJson(
          `${API_URL}/api/admin/ops-snapshot?db=false`,
          {
            headers: { Authorization: `Bearer ${token}` },
            label: "usage_learning_ops",
          }
        );
        if (opsRes.ok) {
          summary.liveOps = opsRes.data;
        }
      }
      summary.normalizedCars = normalized;
      setSnapshot(summary);
    } catch (err) {
      setError(err?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const missingGuides = useMemo(
    () => rankMissingCompareGuidesForPopularPairs(snapshot?.liveOps?.topCompares || []),
    [snapshot]
  );

  const catalogExpansion = useMemo(
    () => buildCatalogExpansionReport(snapshot?.normalizedCars || [], snapshot?.liveOps || {}),
    [snapshot]
  );

  const trustQueue = useMemo(
    () => buildTrustRefinementQueue(snapshot?.vehicles || [], snapshot?.liveOps || {}),
    [snapshot]
  );

  const trustWarnCounts = useMemo(
    () => summarizeTrustWarnings(snapshot?.vehicles || []),
    [snapshot]
  );

  const staleHot = useMemo(
    () => findStaleHighTrafficFamilies(snapshot?.vehicles || [], snapshot?.liveOps || {}),
    [snapshot]
  );

  const weakTraffic = useMemo(() => {
    const top = snapshot?.liveOps?.topViewed || [];
    const bySlug = new Map((snapshot?.vehicles || []).map((v) => [v.slug, v]));
    return top
      .map((row) => {
        const slug = row.slug || row.familySlug;
        const audit = bySlug.get(slug);
        if (!audit || audit.issueCount < 1) return null;
        const views = row.views ?? row.count ?? 0;
        return {
          slug,
          name: row.name || audit.name,
          views,
          issueCount: audit.issueCount,
          score: views * audit.issueCount,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }, [snapshot]);

  const topPriorityEvQueue = useMemo(
    () =>
      buildTopPriorityEvQueue(
        snapshot?.vehicles || [],
        snapshot?.liveOps || {},
        20
      ),
    [snapshot]
  );

  const frictionSummary = useMemo(() => buildUsageFrictionSummary(), [localDigest]);

  const compareImprovementQueue = useMemo(
    () =>
      buildCompareImprovementQueue({
        compareTrends: snapshot?.liveOps?.compareTrends || [],
        topCompares: snapshot?.liveOps?.topCompares || [],
      }),
    [snapshot]
  );

  const trustQualityRows = useMemo(
    () =>
      buildTrustQualityRefinementQueue(
        snapshot?.vehicles || [],
        snapshot?.liveOps || {}
      ),
    [snapshot]
  );

  const handleOemAdd = (e) => {
    e.preventDefault();
    const row = appendOemQueueItem({
      familySlug: oemSlug.trim(),
      field: oemField,
      detectedSummary: oemNote.trim() || "Manual queue entry",
      source: "admin_real_usage",
    });
    if (row) {
      setOemSlug("");
      setOemNote("");
      setLocalDigest((x) => x + 1);
    }
  };

  const handleFlagAdd = (e) => {
    e.preventDefault();
    const row = appendEditorialContentFlag({
      pathOrSlug: flagPath.trim(),
      flagType,
      note: flagNote,
    });
    if (row) {
      setFlagPath("");
      setFlagNote("");
      setLocalDigest((x) => x + 1);
    }
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem" }}>
      <nav style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>
        <Link to="/admin">Admin</Link>
        <span style={{ color: "#94a3b8" }}> / Real usage learning</span>
      </nav>

      <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.65rem" }}>
        Real usage learning &amp; catalog expansion
      </h1>
      <p style={{ color: "#64748b", maxWidth: "720px", lineHeight: 1.6 }}>
        Deterministic signals from local feedback buffers, lightweight client events, and
        catalog audits. Internal use — pair with{" "}
        <Link to="/admin/traffic">Traffic intelligence</Link> for server aggregates.
      </p>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          style={{
            padding: "10px 18px",
            borderRadius: "10px",
            border: "none",
            background: "#0f172a",
            color: "#fff",
            fontWeight: 700,
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "Loading catalog…" : "Refresh catalog + ops snapshot"}
        </button>
        <button
          type="button"
          onClick={() => setLocalDigest((x) => x + 1)}
          style={{
            padding: "10px 18px",
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
            background: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Refresh local learning digest
        </button>
      </div>

      {error ? <p style={{ color: "#b91c1c", marginTop: "12px" }}>{error}</p> : null}

      <section style={card}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Feedback trends (local buffer)</h2>
        <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
          Reports include category + severity for prioritization. High-severity spikes also
          surface on <Link to="/admin/soft-launch-ops">Soft launch ops</Link> alerts.
        </p>
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.9rem" }}>
          <div>
            <strong>{learning.feedback.issueCount}</strong> issue reports
          </div>
          <div>
            <strong>{learning.feedback.usefulnessTotal}</strong> usefulness votes (
            {learning.feedback.usefulnessYes} yes / {learning.feedback.usefulnessNo} no)
          </div>
          <div>
            Dissatisfaction ratio:{" "}
            <strong>
              {learning.feedback.usefulnessTotal
                ? `${Math.round(learning.feedback.dissatisfactionRatio * 100)}%`
                : "—"}
            </strong>
          </div>
        </div>
        <h3 style={{ fontSize: "0.95rem", marginTop: "1rem" }}>By operational category</h3>
        <ul style={{ fontSize: "0.85rem", color: "#475569" }}>
          {Object.entries(learning.feedback.byOperationalCategory || {})
            .sort((a, b) => b[1] - a[1])
            .map(([k, v]) => (
              <li key={k}>
                {k}: <strong>{v}</strong>
              </li>
            ))}
        </ul>
        <h3 style={{ fontSize: "0.95rem" }}>Severity mix</h3>
        <p style={{ fontSize: "0.85rem", color: "#475569" }}>
          High: {learning.feedback.severityCounts?.high ?? 0} · Medium:{" "}
          {learning.feedback.severityCounts?.medium ?? 0} · Low:{" "}
          {learning.feedback.severityCounts?.low ?? 0}
        </p>
        <h3 style={{ fontSize: "0.95rem" }}>Top prioritized issues</h3>
        <ol style={{ fontSize: "0.8rem", color: "#334155", paddingLeft: "1.2rem" }}>
          {learning.prioritizedFeedback.slice(0, 10).map((row) => (
            <li key={row.id} style={{ marginBottom: 6 }}>
              <strong>{row.categoryLabel}</strong> ({row.severity}, score {row.score}) —{" "}
              {row.route}{" "}
              <span style={{ color: "#94a3b8" }}>
                {(row.description || "").slice(0, 80)}
                {(row.description || "").length > 80 ? "…" : ""}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section style={card}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Discovery &amp; search friction (local)</h2>
        <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
          Funnel events mirrored into a capped local buffer for admin review on this device.
        </p>
        <ul style={{ fontSize: "0.85rem", color: "#475569" }}>
          {Object.entries(learning.usageLearning.byType || {}).map(([k, v]) => (
            <li key={k}>
              {k}: <strong>{v}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section style={card}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Top user friction (local)</h2>
        <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
          Recurring categories + routes from structured feedback (deterministic grouping).
        </p>
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.85rem" }}>
          <div>
            <strong>{frictionSummary.total}</strong> feedback rows
          </div>
        </div>
        <h3 style={{ fontSize: "0.95rem" }}>Themes (by category)</h3>
        <ul style={{ fontSize: "0.85rem", color: "#475569" }}>
          {frictionSummary.themes.slice(0, 8).map((t) => (
            <li key={t.category}>
              <code>{t.category}</code>: {t.count}
            </li>
          ))}
        </ul>
        <h3 style={{ fontSize: "0.95rem" }}>Hot routes</h3>
        <ul style={{ fontSize: "0.85rem", color: "#475569" }}>
          {frictionSummary.topRoutes.map((t) => (
            <li key={t.route}>
              {t.route} — {t.count}
            </li>
          ))}
        </ul>
      </section>

      {snapshot ? (
        <>
          <section style={card}>
            <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>High-traffic × weak content</h2>
            <ol style={{ fontSize: "0.875rem" }}>
              {weakTraffic.map((r) => (
                <li key={r.slug}>
                  <Link to={`/cars/${r.slug}`}>{r.name}</Link> — {r.views} views ·{" "}
                  {r.issueCount} issue(s) · score {Math.round(r.score)}
                </li>
              ))}
            </ol>
          </section>

          <section style={card}>
            <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Top priority EV queue (scored)</h2>
            <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
              Views × audit issues, boosted for stale-ish freshness and weak trust codes — human
              review first.
            </p>
            <ol style={{ fontSize: "0.875rem" }}>
              {topPriorityEvQueue.map((r) => (
                <li key={r.slug} style={{ marginBottom: 10 }}>
                  <Link to={`/cars/${r.slug}`}>{r.name}</Link> —{" "}
                  <span style={{ fontWeight: 700 }}>{r.priorityTier || "—"}</span> · score{" "}
                  {Math.round(r.score)} · {r.views} views · {r.issueCount} issue(s)
                  {r.gapFlags ? (
                    <span style={{ fontSize: "0.72rem", color: "#94a3b8", display: "block" }}>
                      Gaps:{" "}
                      {Object.entries(r.gapFlags)
                        .filter(([, v]) => v)
                        .map(([k]) => k)
                        .join(", ") || "—"}
                    </span>
                  ) : null}
                  {r.suggestions?.length ? (
                    <ul style={{ fontSize: "0.78rem", color: "#64748b", margin: "4px 0 0" }}>
                      {r.suggestions.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>

          <section style={card}>
            <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Stale + high traffic</h2>
            <ul style={{ fontSize: "0.875rem", color: "#475569" }}>
              {staleHot.length === 0 ? (
                <li>No overlap detected in current snapshot.</li>
              ) : (
                staleHot.map((r) => (
                  <li key={r.slug}>
                    <Link to={`/cars/${r.slug}`}>{r.name}</Link> — {r.freshnessState}
                  </li>
                ))
              )}
            </ul>
          </section>

          <section style={card}>
            <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Trust refinement queue</h2>
            <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
              Trust-coded audit issues, boosted when the family is in top-viewed.
            </p>
            <pre
              style={{
                fontSize: "0.75rem",
                background: "#f8fafc",
                padding: "0.75rem",
                borderRadius: 8,
                overflow: "auto",
              }}
            >
              {JSON.stringify(trustWarnCounts, null, 2)}
            </pre>
            <ol style={{ fontSize: "0.875rem" }}>
              {trustQueue.map((r) => (
                <li key={r.slug}>
                  <Link to={`/cars/${r.slug}`}>{r.name}</Link> — score {r.score.toFixed(1)}{" "}
                  {r.highTraffic ? "(hot list)" : ""}
                </li>
              ))}
            </ol>
          </section>

          <section style={card}>
            <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>
              Trust explanation clarity (hot EVs)
            </h2>
            <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
              Cross top-viewed traffic with trust-coded issues — editorial wording pass.
            </p>
            {trustQualityRows.length === 0 ? (
              <p style={{ fontSize: "0.85rem", color: "#64748b" }}>No hot-list trust gaps.</p>
            ) : (
              <ol style={{ fontSize: "0.8rem" }}>
                {trustQualityRows.map((r) => (
                  <li key={r.slug} style={{ marginBottom: 8 }}>
                    <Link to={`/cars/${r.slug}`}>{r.name}</Link>
                    <ul style={{ margin: "4px 0 0", color: "#64748b" }}>
                      {r.hints.map((h) => (
                        <li key={h.code}>{h.hint}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section style={card}>
            <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Compare guide gaps (popular pairs)</h2>
            <ul style={{ fontSize: "0.875rem", color: "#475569" }}>
              {missingGuides.length === 0 ? (
                <li>No gaps detected for parsed top-compare rows (or all have guides).</li>
              ) : (
                missingGuides.map((g) => (
                  <li key={g.pairSlug}>
                    {g.label} — missing guide <code>{g.pairSlug}</code>
                  </li>
                ))
              )}
            </ul>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.75rem" }}>
              Compare improvement queue: {compareImprovementQueue.length} row(s) · High abandon:{" "}
              {summarizeCompareImprovement(compareImprovementQueue).highAbandonment} · Missing guides:{" "}
              {summarizeCompareImprovement(compareImprovementQueue).missingGuides}
            </p>
            <ol style={{ fontSize: "0.78rem", color: "#475569", paddingLeft: "1.1rem" }}>
              {compareImprovementQueue.slice(0, 8).map((row) => (
                <li key={row.key} style={{ marginBottom: 6 }}>
                  <code>{row.pairSlug}</code> — {row.issues.join(", ")} — {row.suggestion}
                </li>
              ))}
            </ol>
          </section>

          <section style={card}>
            <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Catalog expansion hints</h2>
            <ul style={{ fontSize: "0.875rem", color: "#475569" }}>
              <li>Catalog variants: {catalogExpansion.catalogSize}</li>
              <li>Families: {catalogExpansion.familyCount}</li>
              <li>Single-variant families (sample): {catalogExpansion.singleVariantFamilyCount}</li>
            </ul>
            <ul style={{ fontSize: "0.8rem", color: "#64748b" }}>
              {catalogExpansion.singleVariantSample.map((f) => (
                <li key={f.familySlug}>
                  {f.brand} — {f.familyName} ({f.familySlug})
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <p style={{ color: "#64748b", marginTop: "1rem" }}>
          Load catalog once to see traffic × audit cross queues and compare gaps.
        </p>
      )}

      <section style={card}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>OEM / update review queue (local)</h2>
        <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
          Pending: {learning.oem.byStatus?.pending ?? 0} · In review:{" "}
          {learning.oem.byStatus?.in_review ?? 0} · Stale pending &gt;14d:{" "}
          <strong>{learning.oem.staleAlert}</strong>
        </p>
        <form onSubmit={handleOemAdd} style={{ display: "grid", gap: "0.5rem", maxWidth: "420px" }}>
          <input
            placeholder="Family slug (e.g. tata-nexon-ev)"
            value={oemSlug}
            onChange={(e) => setOemSlug(e.target.value)}
            style={{ padding: "0.5rem", borderRadius: 8, border: "1px solid #cbd5e1" }}
          />
          <input
            placeholder="Field (range, price, charging, …)"
            value={oemField}
            onChange={(e) => setOemField(e.target.value)}
            style={{ padding: "0.5rem", borderRadius: 8, border: "1px solid #cbd5e1" }}
          />
          <textarea
            placeholder="Detected change or review notes"
            value={oemNote}
            onChange={(e) => setOemNote(e.target.value)}
            rows={3}
            style={{ padding: "0.5rem", borderRadius: 8, border: "1px solid #cbd5e1" }}
          />
          <button
            type="submit"
            style={{
              padding: "0.5rem",
              borderRadius: 8,
              border: "none",
              background: "#2563eb",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Queue OEM review item
          </button>
        </form>
      </section>

      <section style={card}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Editorial content flags (local)</h2>
        <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
          Total: {learning.editorial.total}
        </p>
        <form onSubmit={handleFlagAdd} style={{ display: "grid", gap: "0.5rem", maxWidth: "420px" }}>
          <input
            placeholder="Path or slug (e.g. /cars/tata-nexon-ev)"
            value={flagPath}
            onChange={(e) => setFlagPath(e.target.value)}
            style={{ padding: "0.5rem", borderRadius: 8, border: "1px solid #cbd5e1" }}
          />
          <select
            value={flagType}
            onChange={(e) => setFlagType(e.target.value)}
            style={{ padding: "0.5rem", borderRadius: 8, border: "1px solid #cbd5e1" }}
          >
            {FLAG_TYPES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <textarea
            placeholder="Note"
            value={flagNote}
            onChange={(e) => setFlagNote(e.target.value)}
            rows={2}
            style={{ padding: "0.5rem", borderRadius: 8, border: "1px solid #cbd5e1" }}
          />
          <button
            type="submit"
            style={{
              padding: "0.5rem",
              borderRadius: 8,
              border: "none",
              background: "#0f172a",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Add editorial flag
          </button>
        </form>
      </section>
    </div>
  );
}
