/**
 * Traffic + lead intelligence — aggregates behavioral report + admin analytics.
 */

import { API_URL } from "../config";

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeTopList(rows, { labelKey = "label", valueKey = "count" } = {}) {
  return asArray(rows)
    .map((row) => ({
      label: row[labelKey] || row.slug || row.path || row.name || "—",
      count: Number(row[valueKey] ?? row.views ?? row.clicks ?? 0),
      meta: row,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * @param {object} behavioral
 * @param {object} adminAnalytics
 */
function mergeIntelligence(behavioral = {}, adminAnalytics = {}) {
  const b = behavioral?.report || behavioral || {};

  return {
    generatedAt: new Date().toISOString(),
    days: b.days || behavioral?.days || 7,
    source: behavioral ? "live" : "partial",
    topCityPages: normalizeTopList(
      b.topCityPages || b.cityPages || b.pagesByCity
    ),
    topComparePages: normalizeTopList(
      b.topComparePages || b.compareGuides || b.comparePages
    ),
    topViewedEvs: normalizeTopList(
      b.topViewedEvs ||
        b.topVehicles ||
        adminAnalytics?.leadsPerCar ||
        b.vehicleViews
    ),
    ctaClicks: normalizeTopList(
      b.ctaClicks || b.ctaEvents || b.eventsByType?.filter?.((e) =>
        String(e.type || e.eventType).includes("cta")
      )
    ),
    leadConversions: {
      total: Number(
        b.leadConversions?.total ??
          b.leadsSubmitted ??
          adminAnalytics?.totalLeads ??
          0
      ),
      bySource: normalizeTopList(
        b.leadConversions?.bySource || b.leadsBySource
      ),
      overTime: asArray(
        adminAnalytics?.leadsOverTime || b.leadConversions?.overTime
      ),
    },
    compareConversions: {
      total: Number(b.compareConversions?.total ?? b.compareCompleted ?? 0),
      started: Number(b.compareStarted ?? b.compareSessions ?? 0),
      completionRate:
        b.compareCompletionRate ??
        (b.compareCompleted && b.compareStarted
          ? Math.round((b.compareCompleted / b.compareStarted) * 100)
          : null),
    },
    variantInterest: normalizeTopList(
      b.variantInterest || b.variantSelected || b.topVariants
    ),
    raw: { behavioral: b, adminAnalytics },
  };
}

function emptyShell(days = 7) {
  return mergeIntelligence({ days, report: {} }, {});
}

/**
 * @param {number} days
 * @param {string} token
 */
export async function fetchTrafficIntelligence(days = 7, token) {
  if (!token) return emptyShell(days);

  let behavioral = null;
  let adminAnalytics = null;

  try {
    const res = await fetch(
      `${API_URL}/api/behavioral/report?days=${days}`,
      { headers: authHeaders(token) }
    );
    if (res.ok) behavioral = await res.json();
  } catch {
    /* backend optional */
  }

  try {
    const res = await fetch(`${API_URL}/api/admin/analytics`, {
      headers: authHeaders(token),
    });
    if (res.ok) {
      const data = await res.json();
      adminAnalytics = data.analytics || data;
    }
  } catch {
    /* fallback */
  }

  if (!behavioral && !adminAnalytics) {
    return { ...emptyShell(days), source: "unavailable" };
  }

  return mergeIntelligence(
    behavioral || { days },
    adminAnalytics || {}
  );
}
