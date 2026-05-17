/**
 * Production ops health — ops-summary, queue, deployment signals.
 */

import { API_URL, APP_CONFIG, SITE_ORIGIN } from "../config";

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function fetchJson(url, token) {
  try {
    const res = await fetch(url, { headers: authHeaders(token) });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchPublicJson(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/**
 * @param {string} token
 */
export async function fetchOpsHealth(token) {
  if (!token) {
    return {
      opsSummary: null,
      opsQueue: null,
      lastLead: null,
      deployment: buildDeploymentMeta(),
      indexing: null,
    };
  }

  const [opsSummary, opsQueue, recentLeads, contentManifest, sitemapManifest] =
    await Promise.all([
      fetchJson(`${API_URL}/api/admin/ops-summary`, token),
      fetchJson(`${API_URL}/api/admin/ops-queue?filter=unmatched`, token),
      fetchJson(`${API_URL}/api/admin/leads?page=1&limit=1`, token),
      fetchPublicJson("/seo-data/content-manifest.json"),
      fetchPublicJson("/sitemap-manifest.json"),
    ]);

  const lastLead =
    recentLeads?.leads?.[0] ||
    opsSummary?.lastLead ||
    null;

  return {
    opsSummary,
    opsQueue,
    lastLead,
    deployment: buildDeploymentMeta(),
    indexing: {
      contentGeneratedAt: contentManifest?.generatedAt || null,
      contentCount: contentManifest?.counts?.batch_total ?? contentManifest?.entries?.length ?? null,
      sitemapGeneratedAt: sitemapManifest?.generatedAt || null,
      sitemapUrlCount:
        (sitemapManifest?.static?.length || 0) +
        (sitemapManifest?.discovery?.length || 0) +
        (sitemapManifest?.cars?.length || 0),
    },
  };
}

function buildDeploymentMeta() {
  return {
    environment: APP_CONFIG.environment,
    version: APP_CONFIG.version,
    domain: APP_CONFIG.domain,
    siteOrigin: SITE_ORIGIN,
    apiHost: APP_CONFIG.apiDomain,
    buildMode: import.meta.env.MODE,
    behavioralEnabled:
      import.meta.env.VITE_BEHAVIORAL_INTELLIGENCE === "true",
    whatsappConfigured: Boolean(
      String(import.meta.env.VITE_WHATSAPP_SALES_NUMBER || "").replace(/\D/g, "").length >= 10
    ),
  };
}
