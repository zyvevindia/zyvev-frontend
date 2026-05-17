import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { API_URL, SITE_ORIGIN } from "../../config";
import OpsHealthCards from "../../components/admin/OpsHealthCards";
import {
  GSC_QUICK_LINKS,
  INDEXING_READINESS_CHECKLIST,
  LIVE_SITEMAP_URLS,
} from "../../admin-docs/gscQuickLinks";
import { auditSeoPages } from "../../seo/qa";
import { buildWhatsAppLeadMessage } from "../../utils/whatsappLead";
import { fetchOpsHealth } from "../../services/opsHealthApi";
import { fetchTrafficIntelligence } from "../../services/trafficIntelligenceApi";

const card = {
  background: "#fff",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  padding: "1.25rem",
  marginBottom: "1.25rem",
};

const DEALER_CHECKLIST_KEY = "evsavari-dealer-onboarding-checklist";

const DEALER_ONBOARDING_ITEMS = [
  { id: "account", label: "Dealer account created and login verified" },
  { id: "profile", label: "Showroom name, city, and contact number complete" },
  { id: "inventory", label: "At least one live listing with image and price" },
  { id: "leads", label: "Test lead appears in dealer dashboard" },
  { id: "whatsapp", label: "Dealer can open WhatsApp from a sample lead" },
  { id: "sla", label: "Response SLA agreed (e.g. under 4 business hours)" },
  { id: "pilot", label: "Pilot scope confirmed: metro + 3 models max" },
];

const LEAD_LIFECYCLE_STEPS = [
  { id: "form", label: "Buyer submits form or WhatsApp intent" },
  { id: "crm", label: "Lead visible in Admin → Leads / Kanban" },
  { id: "assign", label: "Lead assigned to dealer (or ops queue cleared)" },
  { id: "dealer", label: "Dealer marks contacted / test drive" },
  { id: "close", label: "Won / lost recorded within 7 days" },
];

function loadChecklistState() {
  try {
    const raw = localStorage.getItem(DEALER_CHECKLIST_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export default function OperationalQaPage() {
  const token = localStorage.getItem("token");
  const [opsHealth, setOpsHealth] = useState(null);
  const [trafficData, setTrafficData] = useState(null);
  const [checklist, setChecklist] = useState(loadChecklistState);
  const [leadTestResult, setLeadTestResult] = useState(null);
  const [leadTestLoading, setLeadTestLoading] = useState(false);
  const [waCtx, setWaCtx] = useState({
    vehicleName: "Tata Nexon EV",
    vehicleSlug: "tata-nexon-ev",
    city: "Bengaluru",
    sourcePage: "/compare",
    intent: "compare",
    compareSlugs: "tata-nexon-ev,mg-zs-ev",
  });
  const [seoAudit, setSeoAudit] = useState(null);
  const [seoRoutes, setSeoRoutes] = useState(null);
  const [seoLoading, setSeoLoading] = useState(false);
  const [canonicalInput, setCanonicalInput] = useState("/cities/bengaluru/evs");
  const [canonicalResult, setCanonicalResult] = useState(null);
  const [sitemapCheck, setSitemapCheck] = useState(null);

  useEffect(() => {
    fetchOpsHealth(token).then(setOpsHealth);
    fetchTrafficIntelligence(7, token).then(setTrafficData);
  }, [token]);

  const waMessage = useMemo(() => {
    const slugs = waCtx.compareSlugs
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return buildWhatsAppLeadMessage({
      vehicleName: waCtx.vehicleName,
      vehicleSlug: waCtx.vehicleSlug,
      familySlug: waCtx.vehicleSlug,
      city: waCtx.city,
      sourcePage: waCtx.sourcePage,
      intent: waCtx.intent,
      compareSlugs: slugs,
    });
  }, [waCtx]);

  const toggleChecklist = (id) => {
    setChecklist((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(DEALER_CHECKLIST_KEY, JSON.stringify(next));
      return next;
    });
  };

  const submitTestLead = async () => {
    setLeadTestLoading(true);
    setLeadTestResult(null);
    try {
      const res = await fetch(`${API_URL}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "[QA-TEST] Ops lifecycle",
          phone: "9876543210",
          email: "",
          city: "Bengaluru",
          message: "Operational QA test — safe to delete",
          vehicleName: "QA Test Vehicle",
          sourcePage: "ops_qa",
          leadSource: "form",
          leadMetadata: { qaTest: true },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLeadTestResult({
          ok: false,
          message: data.message || `HTTP ${res.status}`,
        });
      } else {
        setLeadTestResult({
          ok: true,
          message: `Lead created${data._id ? ` (${data._id})` : ""}. Check Admin → Leads.`,
        });
      }
    } catch {
      setLeadTestResult({ ok: false, message: "Network error" });
    } finally {
      setLeadTestLoading(false);
    }
  };

  const runSeoSmoke = useCallback(async () => {
    setSeoLoading(true);
    setSeoAudit(null);
    setSeoRoutes(null);
    try {
      const [manifestRes, sitemapRes] = await Promise.all([
        fetch("/seo-data/content-manifest.json"),
        fetch("/sitemap-manifest.json"),
      ]);
      const manifest = manifestRes.ok ? await manifestRes.json() : null;
      const sitemap = sitemapRes.ok ? await sitemapRes.json() : null;

      const sample = (manifest?.entries || []).slice(0, 40).map((e) => ({
        id: e.id,
        path: e.path,
        title: e.title,
        description: e.title,
        canonical: e.canonicalUrl,
        h1: e.h1,
      }));
      const audit = auditSeoPages(sample);

      const routeChecks = [];
      const paths = [
        "/",
        "/cars",
        "/compare",
        "/guides",
        ...(manifest?.entries || []).slice(0, 5).map((e) => e.path),
      ];
      for (const path of paths) {
        try {
          const r = await fetch(path, { method: "HEAD" });
          routeChecks.push({
            path,
            status: r.status,
            ok: r.ok,
          });
        } catch {
          routeChecks.push({ path, status: 0, ok: false });
        }
      }

      setSeoAudit({ audit, manifestAt: manifest?.generatedAt, sampleSize: sample.length });
      setSeoRoutes(routeChecks);
      setSitemapCheck({
        generatedAt: sitemap?.generatedAt,
        staticCount: sitemap?.static?.length ?? 0,
        discoveryCount: sitemap?.discovery?.length ?? 0,
      });
    } finally {
      setSeoLoading(false);
    }
  }, []);

  const spotCheckCanonical = async () => {
    setCanonicalResult(null);
    const path = canonicalInput.startsWith("/")
      ? canonicalInput
      : `/${canonicalInput}`;
    try {
      const res = await fetch(path);
      const html = await res.text();
      const canonMatch = html.match(
        /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i
      );
      const canon =
        canonMatch?.[1] ||
        html.match(/href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)?.[1];
      setCanonicalResult({
        path,
        status: res.status,
        canonical: canon || "(not found in HTML)",
        ok: Boolean(canon),
      });
    } catch (e) {
      setCanonicalResult({
        path,
        status: 0,
        canonical: String(e.message || e),
        ok: false,
      });
    }
  };

  const checklistDone = DEALER_ONBOARDING_ITEMS.filter((i) => checklist[i.id]).length;

  return (
    <div style={{ padding: "1.5rem", maxWidth: "960px", margin: "0 auto" }}>
      <nav style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>
        <Link to="/admin">Admin</Link>
        <span style={{ color: "#94a3b8" }}> / Operational QA</span>
      </nav>

      <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.75rem" }}>
        Operational QA (beta)
      </h1>
      <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
        Lightweight checks for production flows — no routing or SEO changes.
        Use before pilot traffic and dealer onboarding.
      </p>

      <section style={card}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>
          Soft launch runbooks
        </h2>
        <p style={{ fontSize: "0.9rem", color: "#475569", marginTop: 0 }}>
          Repo docs (also run <code>npm run launch:smoke</code> locally):
        </p>
        <ul style={{ fontSize: "0.9rem", lineHeight: 1.8 }}>
          <li>
            <code>docs/launch/day-1-checklist.md</code>
          </li>
          <li>
            <code>docs/launch/production-smoke-test.md</code>
          </li>
          <li>
            <code>docs/launch/critical-issue-playbook.md</code>
          </li>
          <li>
            <code>docs/launch/rollback-checklist.md</code>
          </li>
        </ul>
        <p style={{ marginBottom: 0 }}>
          <Link to="/admin/media-qa">Media QA</Link>
          {" · "}
          User feedback appears in ops audit as{" "}
          <code>site_feedback</code>.
        </p>
      </section>

      <OpsHealthCards
        opsHealth={opsHealth}
        trafficData={trafficData}
        showIndexing={false}
      />

      <section style={card}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>
          Lead lifecycle tester
        </h2>
        <ol style={{ margin: "0 0 1rem", paddingLeft: "1.25rem" }}>
          {LEAD_LIFECYCLE_STEPS.map((step) => (
            <li key={step.id} style={{ marginBottom: "0.35rem" }}>
              {step.label}
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={submitTestLead}
          disabled={leadTestLoading}
          style={primaryBtn}
        >
          {leadTestLoading ? "Submitting…" : "Submit QA test lead"}
        </button>
        {leadTestResult && (
          <p
            style={{
              marginTop: "0.75rem",
              color: leadTestResult.ok ? "#15803d" : "#dc2626",
            }}
          >
            {leadTestResult.message}
          </p>
        )}
        <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.75rem" }}>
          <Link to="/admin#recent-leads">Admin leads</Link>
          {" · "}
          <Link to="/kanban">Kanban</Link>
          {" · "}
          <Link to="/admin/traffic">Traffic intelligence</Link>
        </p>
      </section>

      <section style={card}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>
          Dealer onboarding checklist
        </h2>
        <p style={{ fontSize: "0.9rem", color: "#64748b" }}>
          {checklistDone}/{DEALER_ONBOARDING_ITEMS.length} complete (saved in
          browser)
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: "1rem 0" }}>
          {DEALER_ONBOARDING_ITEMS.map((item) => (
            <li key={item.id} style={{ marginBottom: "0.5rem" }}>
              <label style={{ display: "flex", gap: "0.5rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={Boolean(checklist[item.id])}
                  onChange={() => toggleChecklist(item.id)}
                />
                {item.label}
              </label>
            </li>
          ))}
        </ul>
        <p style={{ fontSize: "0.85rem" }}>
          Playbook:{" "}
          <code>docs/dealer-pilot/dealer-onboarding-playbook.md</code>
        </p>
      </section>

      <section style={card}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>
          WhatsApp attribution verifier
        </h2>
        <div style={fieldGrid}>
          <Field label="Vehicle" value={waCtx.vehicleName} onChange={(v) => setWaCtx((c) => ({ ...c, vehicleName: v }))} />
          <Field label="Slug" value={waCtx.vehicleSlug} onChange={(v) => setWaCtx((c) => ({ ...c, vehicleSlug: v }))} />
          <Field label="City" value={waCtx.city} onChange={(v) => setWaCtx((c) => ({ ...c, city: v }))} />
          <Field label="Source page" value={waCtx.sourcePage} onChange={(v) => setWaCtx((c) => ({ ...c, sourcePage: v }))} />
          <Field label="Compare slugs (comma)" value={waCtx.compareSlugs} onChange={(v) => setWaCtx((c) => ({ ...c, compareSlugs: v }))} />
        </div>
        <pre style={preBox}>{waMessage}</pre>
        <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
          Intent API records: sourcePage, familySlug, city, intent. Compare
          slugs appear in message body and SEO_CTA_CLICKED metadata.
        </p>
      </section>

      <section style={card}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>
          Compare → lead verification
        </h2>
        {trafficData?.compareTrends?.length > 0 ? (
          <table style={table}>
            <thead>
              <tr>
                <th>Compare</th>
                <th style={{ textAlign: "right" }}>Started</th>
                <th style={{ textAlign: "right" }}>Completed</th>
                <th style={{ textAlign: "right" }}>Leads</th>
              </tr>
            </thead>
            <tbody>
              {trafficData.compareTrends.slice(0, 8).map((row) => (
                <tr key={row.slug}>
                  <td>{row.slug}</td>
                  <td style={{ textAlign: "right" }}>{row.started}</td>
                  <td style={{ textAlign: "right" }}>{row.completed}</td>
                  <td style={{ textAlign: "right" }}>{row.leads ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: "#64748b" }}>
            No compare trends in the last 7 days. Run a compare session and
            submit a test lead from{" "}
            <a href="/compare" target="_blank" rel="noreferrer">
              /compare
            </a>
            .
          </p>
        )}
        {trafficData?.compareToLead?.totalCompareLeads != null && (
          <p style={{ fontSize: "0.85rem", marginTop: "0.75rem" }}>
            Total compare-path leads: {trafficData.compareToLead.totalCompareLeads}
          </p>
        )}
      </section>

      <section style={card}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>
          SEO route smoke checker
        </h2>
        <button type="button" onClick={runSeoSmoke} disabled={seoLoading} style={primaryBtn}>
          {seoLoading ? "Running…" : "Run smoke check (manifest + routes)"}
        </button>
        {seoAudit && (
          <p style={{ marginTop: "0.75rem" }}>
            Manifest: {seoAudit.manifestAt || "—"} · Sample{" "}
            {seoAudit.sampleSize} pages ·{" "}
            <strong>
              {seoAudit.audit.issueCount} errors, {seoAudit.audit.warningCount}{" "}
              warnings
            </strong>
          </p>
        )}
        {seoRoutes && (
          <ul style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
            {seoRoutes.map((r) => (
              <li key={r.path} style={{ color: r.ok ? "#15803d" : "#dc2626" }}>
                {r.path} → {r.status || "fail"}
              </li>
            ))}
          </ul>
        )}
        {sitemapCheck && (
          <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
            Sitemap manifest: {sitemapCheck.generatedAt} · static{" "}
            {sitemapCheck.staticCount} · discovery {sitemapCheck.discoveryCount}
          </p>
        )}
      </section>

      <section style={card} id="gsc">
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>
          Search Console & indexing
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
          {GSC_QUICK_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              style={pillBtn}
            >
              {link.label} ↗
            </a>
          ))}
        </div>
        <h3 style={{ fontSize: "1rem" }}>Sitemap verification</h3>
        <ul style={{ fontSize: "0.9rem" }}>
          {LIVE_SITEMAP_URLS.map((s) => (
            <li key={s.path}>
              <a href={`${SITE_ORIGIN}${s.path}`} target="_blank" rel="noreferrer">
                {SITE_ORIGIN}
                {s.path}
              </a>
            </li>
          ))}
        </ul>
        <h3 style={{ fontSize: "1rem" }}>Canonical spot-check</h3>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <input
            value={canonicalInput}
            onChange={(e) => setCanonicalInput(e.target.value)}
            placeholder="/cities/bengaluru/evs"
            style={inputStyle}
          />
          <button type="button" onClick={spotCheckCanonical} style={primaryBtn}>
            Fetch canonical
          </button>
        </div>
        {canonicalResult && (
          <p style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
            {canonicalResult.path} ({canonicalResult.status}):{" "}
            <code>{canonicalResult.canonical}</code>
          </p>
        )}
        <h3 style={{ fontSize: "1rem", marginTop: "1rem" }}>Indexing checklist</h3>
        <ul>
          {INDEXING_READINESS_CHECKLIST.map((item) => (
            <li key={item.id} style={{ marginBottom: "0.35rem" }}>
              {item.label}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, width: "100%", marginTop: "0.25rem" }}
      />
    </label>
  );
}

const fieldGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "0.75rem",
  marginBottom: "1rem",
};

const primaryBtn = {
  padding: "0.5rem 1rem",
  borderRadius: "8px",
  border: "none",
  background: "#2563eb",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};

const pillBtn = {
  padding: "0.35rem 0.75rem",
  borderRadius: "999px",
  background: "#f1f5f9",
  fontSize: "0.85rem",
  textDecoration: "none",
  color: "#0f172a",
};

const preBox = {
  background: "#f8fafc",
  padding: "0.75rem",
  borderRadius: "8px",
  fontSize: "0.8rem",
  overflow: "auto",
  whiteSpace: "pre-wrap",
};

const inputStyle = {
  padding: "0.5rem 0.75rem",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  minWidth: "200px",
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.9rem",
};
