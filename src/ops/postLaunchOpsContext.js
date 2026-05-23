/**
 * Shared data loader for post-launch admin dashboards.
 */

import { API_URL } from "../config";
import normalizeCar from "../utils/normalizeCar";
import { safeFetchJsonWithRetry } from "../utils/safeFetch";
import { fetchTrafficIntelligence } from "../services/trafficIntelligenceApi";
import { buildContentOpsSummary } from "../intelligence/contentOpsAudit.js";
import { analyzeSeoIndexingDiscipline } from "./seoIndexingDiscipline.js";
import { buildCompareImprovementQueue } from "./compareImprovementOps.js";

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
 * @param {{ days?: number }} [opts]
 */
export async function loadPostLaunchOpsContext(opts = {}) {
  const days = opts.days ?? 7;
  const token =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("token")
      : null;

  const catalogRes = await safeFetchJsonWithRetry(`${API_URL}/cars?limit=100`, {
    label: "post-launch-catalog",
    timeoutMs: 20000,
  });

  const cars = catalogRes.ok
    ? (catalogRes.data?.cars || []).map(normalizeCar)
    : [];

  let liveOps = null;
  if (token) {
    const opsRes = await safeFetchJsonWithRetry(
      `${API_URL}/api/admin/ops-snapshot?db=false`,
      {
        headers: { Authorization: `Bearer ${token}` },
        label: "post-launch-ops-snapshot",
        timeoutMs: 15000,
      }
    );
    if (opsRes.ok) liveOps = opsRes.data;
  }

  const traffic = await fetchTrafficIntelligence(days, token);

  const [contentManifest, sitemapManifest, discoveryIndex] =
    await Promise.all([
      fetchPublicJson("/seo-data/content-manifest.json"),
      fetchPublicJson("/sitemap-manifest.json"),
      fetchPublicJson("/seo-data/discovery-index.json"),
    ]);

  const catalogSummary = buildContentOpsSummary(cars);
  const seoDiscipline = analyzeSeoIndexingDiscipline({
    contentManifest,
    sitemapManifest,
    discoveryIndex,
  });

  const compareImprovement = buildCompareImprovementQueue({
    compareTrends: traffic.compareTrends,
    topCompares: liveOps?.topCompares || traffic.topComparePages?.map((r) => ({
      slug: r.label,
      count: r.count,
    })),
  });

  return {
    generatedAt: new Date().toISOString(),
    days,
    cars,
    traffic,
    liveOps,
    catalogSummary,
    seoDiscipline,
    compareImprovement,
    catalogOk: catalogRes.ok,
    catalogError: catalogRes.error,
  };
}
