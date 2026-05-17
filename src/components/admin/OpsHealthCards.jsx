import { Link } from "react-router-dom";

import { SITE_ORIGIN } from "../../config";
import {
  GSC_QUICK_LINKS,
  INDEXING_READINESS_CHECKLIST,
  LIVE_SITEMAP_URLS,
} from "../../admin-docs/gscQuickLinks";

const card = {
  background: "#fff",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  padding: "1.25rem",
  marginBottom: "1rem",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "1rem",
};

const pillLink = {
  display: "inline-block",
  padding: "0.35rem 0.75rem",
  borderRadius: "999px",
  background: "#f1f5f9",
  color: "#0f172a",
  fontSize: "0.85rem",
  textDecoration: "none",
};

function formatTimestamp(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Metric({ label, value, hint, alert }) {
  return (
    <div>
      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
        {label}
      </div>
      <strong
        style={{
          fontSize: "1.15rem",
          color: alert ? "#dc2626" : "inherit",
        }}
      >
        {value}
      </strong>
      {hint && (
        <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
          {hint}
        </div>
      )}
    </div>
  );
}

/**
 * Production health strip for /admin/traffic and ops views.
 */
export default function OpsHealthCards({
  opsHealth,
  trafficData,
  showIndexing = true,
  showGscLinks = false,
}) {
  const { opsSummary, opsQueue, lastLead, deployment, indexing } =
    opsHealth || {};
  const whatsapp = trafficData?.whatsappConversions;

  return (
    <>
      <section style={card}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>
          Production health
        </h2>
        <div style={grid}>
          <Metric
            label="Environment"
            value={deployment?.environment || "—"}
            hint={`v${deployment?.version || "?"} · ${deployment?.buildMode}`}
          />
          <Metric
            label="API host"
            value={deployment?.apiHost || "—"}
            hint={
              deployment?.whatsappConfigured ? "WhatsApp on" : "WhatsApp off"
            }
          />
          <Metric
            label="Last lead"
            value={
              lastLead?.createdAt
                ? formatTimestamp(lastLead.createdAt)
                : opsSummary?.lastLeadAt
                  ? formatTimestamp(opsSummary.lastLeadAt)
                  : "—"
            }
            hint={lastLead?.name ? lastLead.name : "No recent lead"}
          />
          <Metric
            label="Unmatched leads"
            value={opsQueue?.counts?.unmatched ?? "—"}
            hint={
              opsQueue?.counts?.overdue != null
                ? `Overdue: ${opsQueue.counts.overdue}`
                : undefined
            }
            alert={Number(opsQueue?.counts?.unmatched) > 0}
          />
          <Metric
            label="Dealer response (avg hrs)"
            value={opsSummary?.avgResponseHours ?? "—"}
            hint={`Overdue: ${opsSummary?.overdueCount ?? 0}`}
            alert={Number(opsSummary?.overdueCount) > 0}
          />
          <Metric
            label="Active dealers"
            value={opsSummary?.activeDealers ?? "—"}
            hint={`Pending apps: ${opsSummary?.pendingDealerApplications ?? 0}`}
          />
        </div>
        {opsSummary?.dealerActivity?.length > 0 && (
          <p
            style={{
              margin: "0.75rem 0 0",
              fontSize: "0.85rem",
              color: "#64748b",
            }}
          >
            Dealer responsiveness (7d):{" "}
            {opsSummary.dealerActivity
              .slice(0, 5)
              .map((d) => `${d.name} (${d.leads7d} leads)`)
              .join(" · ")}
          </p>
        )}
      </section>

      {whatsapp && (
        <section style={card}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>
            WhatsApp conversion snapshot
          </h2>
          <div style={grid}>
            <Metric label="Clicks" value={whatsapp.clicks ?? 0} />
            <Metric label="Attributed leads" value={whatsapp.leads ?? 0} />
            <Metric
              label="Click → lead %"
              value={
                whatsapp.conversionRate != null
                  ? `${whatsapp.conversionRate}%`
                  : "—"
              }
            />
          </div>
          {trafficData?.compareToWhatsApp?.trends?.length > 0 && (
            <p
              style={{
                margin: "0.75rem 0 0",
                fontSize: "0.85rem",
                color: "#64748b",
              }}
            >
              Top compare → WhatsApp:{" "}
              {trafficData.compareToWhatsApp.trends
                .slice(0, 3)
                .map((r) => `${r.slug} (${r.whatsappClicks})`)
                .join(" · ")}
            </p>
          )}
        </section>
      )}

      {showIndexing && indexing && (
        <section style={card}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>
            Indexing readiness
          </h2>
          <div style={grid}>
            <Metric
              label="Content manifest"
              value={formatTimestamp(indexing.contentGeneratedAt)}
              hint={
                indexing.contentCount != null
                  ? `${indexing.contentCount} discovery pages`
                  : undefined
              }
            />
            <Metric
              label="Sitemap build"
              value={formatTimestamp(indexing.sitemapGeneratedAt)}
              hint={
                indexing.sitemapUrlCount
                  ? `~${indexing.sitemapUrlCount} URLs tracked`
                  : undefined
              }
            />
            <Metric
              label="Behavioral tracking"
              value={deployment?.behavioralEnabled ? "On" : "Off"}
            />
          </div>
          <ul
            style={{
              margin: "1rem 0 0",
              paddingLeft: "1.25rem",
              fontSize: "0.9rem",
            }}
          >
            {INDEXING_READINESS_CHECKLIST.map((item) => (
              <li key={item.id} style={{ marginBottom: "0.35rem" }}>
                {item.label}
              </li>
            ))}
          </ul>
          <p style={{ margin: "0.75rem 0 0", fontSize: "0.85rem" }}>
            <Link to="/admin/ops-qa#gsc">Open GSC helpers →</Link>
            {" · "}
            CLI: <code>npm run gsc:verify</code>
          </p>
        </section>
      )}

      {showGscLinks && (
        <section style={card}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>
            Search Console quick links
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {GSC_QUICK_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                style={pillLink}
              >
                {link.label} ↗
              </a>
            ))}
          </div>
          <div style={{ marginTop: "0.75rem", fontSize: "0.85rem" }}>
            Live sitemap checks:{" "}
            {LIVE_SITEMAP_URLS.map((s, i) => (
              <span key={s.path}>
                {i > 0 && " · "}
                <a
                  href={`${SITE_ORIGIN}${s.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {s.label}
                </a>
              </span>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
