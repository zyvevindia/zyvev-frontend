import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { SITE_ORIGIN } from "../../config";
import { auditSeoPages } from "../../seo/qa";
import { LIVE_SITEMAP_URLS } from "../../admin-docs/gscQuickLinks";
import { analyzeSeoIndexingDiscipline } from "../../ops/seoIndexingDiscipline";

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
  fontSize: "0.85rem",
};

function formatTs(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString("en-IN");
}

/**
 * Indexing observability — manifest, canonical warnings, top discovery pages.
 */
export default function IndexingObservability({ topDiscoveryPages = [] }) {
  const [loading, setLoading] = useState(true);
  const [manifest, setManifest] = useState(null);
  const [sitemap, setSitemap] = useState(null);
  const [audit, setAudit] = useState(null);

  const [discipline, setDiscipline] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetch("/seo-data/content-manifest.json").then((r) =>
        r.ok ? r.json() : null
      ),
      fetch("/sitemap-manifest.json").then((r) =>
        r.ok ? r.json() : null
      ),
      fetch("/seo-data/discovery-index.json").then((r) =>
        r.ok ? r.json() : null
      ),
    ])
      .then(([m, s, d]) => {
        if (cancelled) return;
        setManifest(m);
        setSitemap(s);
        const disc = analyzeSeoIndexingDiscipline({
          contentManifest: m,
          sitemapManifest: s,
          discoveryIndex: d,
        });
        setDiscipline(disc);
        const pages = (m?.entries || []).map((e) => ({
          id: e.id,
          path: e.path,
          title: e.title,
          description: e.title,
          canonical: e.canonicalUrl,
          h1: e.h1,
        }));
        setAudit(auditSeoPages(pages));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const indexedEstimate =
    (sitemap?.static?.length || 0) +
    (sitemap?.discovery?.length || 0) +
    (sitemap?.cars?.length || 0) +
    (manifest?.entries?.length || 0);

  const canonicalWarnings = [
    ...(audit?.warnings || []).filter((w) =>
      String(w.code || "").includes("canonical")
    ),
    ...(audit?.issues || []).filter((i) =>
      String(i.code || "").includes("canonical")
    ),
  ].slice(0, 8);

  return (
    <section style={card}>
      <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>
        Indexing observability
      </h2>
      {loading && <p style={{ color: "#64748b" }}>Loading manifest…</p>}

      {!loading && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <Metric label="Content manifest" value={formatTs(manifest?.generatedAt)} />
            <Metric label="Sitemap build" value={formatTs(sitemap?.generatedAt)} />
            <Metric
              label="Indexed URL estimate"
              value={indexedEstimate || "—"}
              hint="static + discovery + cars manifests"
            />
            <Metric
              label="SEO audit"
              value={
                audit
                  ? `${audit.issueCount} err · ${audit.warningCount} warn`
                  : "—"
              }
            />
          </div>

          {canonicalWarnings.length > 0 ? (
            <>
              <h3 style={{ fontSize: "0.95rem" }}>Canonical warnings</h3>
              <ul style={{ margin: "0 0 1rem", paddingLeft: "1.1rem", fontSize: "0.85rem" }}>
                {canonicalWarnings.map((w, i) => (
                  <li key={i} style={{ marginBottom: "0.25rem" }}>
                    <strong>{w.page}</strong>: {w.message}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p style={{ fontSize: "0.85rem", color: "#15803d" }}>
              No canonical issues in manifest sample ({audit?.pagesAudited || 0}{" "}
              pages checked).
            </p>
          )}

          {discipline && (
            <>
              <h3 style={{ fontSize: "0.95rem" }}>Sitemap vs discovery registry</h3>
              <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 0 }}>
                Sitemap discovery URLs: {discipline.counts.sitemapDiscoveryUrls}. Registry
                pages: {discipline.counts.discoveryIndexPages}. Manifest entries:{" "}
                {discipline.counts.contentManifestEntries}.
              </p>
              {discipline.orphanDiscoveryPaths.length > 0 ? (
                <>
                  <p style={{ fontSize: "0.85rem", color: "#b45309", fontWeight: 600 }}>
                    Orphan paths (in registry, not in sitemap discovery list)
                  </p>
                  <ul style={{ fontSize: "0.8rem", paddingLeft: "1.1rem", margin: "0 0 0.75rem" }}>
                    {discipline.orphanDiscoveryPaths.slice(0, 12).map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p style={{ fontSize: "0.85rem", color: "#15803d" }}>
                  No registry/sitemap discovery orphans in this build.
                </p>
              )}
              {discipline.sitemapOnlyDiscoveryPaths.length > 0 && (
                <>
                  <p style={{ fontSize: "0.85rem", color: "#b45309" }}>
                    Sitemap-only discovery URLs (not in discovery-index)
                  </p>
                  <ul style={{ fontSize: "0.8rem", paddingLeft: "1.1rem", margin: "0 0 0.75rem" }}>
                    {discipline.sitemapOnlyDiscoveryPaths.slice(0, 8).map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </>
              )}
              <h3 style={{ fontSize: "0.95rem" }}>Conditional noindex (presets)</h3>
              <ul style={{ fontSize: "0.8rem", color: "#475569", paddingLeft: "1.1rem" }}>
                {discipline.conditionalNoindexPresets.map((p) => (
                  <li key={p.slug}>
                    <code>{p.path}</code> — min {p.minResults} results
                  </li>
                ))}
              </ul>
            </>
          )}

          {topDiscoveryPages?.length > 0 && (
            <>
              <h3 style={{ fontSize: "0.95rem" }}>Top discovery pages (leads)</h3>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Page</th>
                    <th style={{ textAlign: "right" }}>Leads</th>
                  </tr>
                </thead>
                <tbody>
                  {topDiscoveryPages.slice(0, 8).map((row, i) => (
                    <tr key={`${row.label}-${i}`}>
                      <td>{row.label}</td>
                      <td style={{ textAlign: "right" }}>{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <p style={{ fontSize: "0.8rem", marginTop: "1rem", color: "#64748b" }}>
            Runbook (repo):{" "}
            <code style={{ fontSize: "0.75rem" }}>docs/launch/google-search-console-readiness.md</code>
            {" · "}
            <code style={{ fontSize: "0.75rem" }}>npm run gsc:verify</code>
            {" · "}
            <Link to="/admin/ops-discipline">Ops discipline hub</Link>
            {" · "}
            Live checks:{" "}
            {LIVE_SITEMAP_URLS.map((s, i) => (
              <span key={s.path}>
                {i > 0 && " · "}
                <a href={`${SITE_ORIGIN}${s.path}`} target="_blank" rel="noreferrer">
                  {s.label}
                </a>
              </span>
            ))}
            {" · "}
            <Link to="/admin/ops-qa#gsc">GSC helpers</Link>
          </p>
        </>
      )}
    </section>
  );
}

function Metric({ label, value, hint }) {
  return (
    <div>
      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{label}</div>
      <strong style={{ fontSize: "1.1rem" }}>{value}</strong>
      {hint && (
        <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
          {hint}
        </div>
      )}
    </div>
  );
}
