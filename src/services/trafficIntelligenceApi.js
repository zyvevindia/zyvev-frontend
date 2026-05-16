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
function mergeIntelligence(ops = {}, behavioral = {}, adminAnalytics = {}) {
  const b = behavioral?.report || behavioral || {};
  const o = ops || {};

  return {
    generatedAt: o.generatedAt || new Date().toISOString(),
    days: o.periodDays || b.days || behavioral?.days || 7,
    source: ops ? "traffic-ops" : behavioral ? "live" : "partial",
    conversionFunnel: asArray(o.conversionFunnel || b.conversionFunnel),
    topCityPages: normalizeTopList(
      o.topCityPages || b.topCityPages || b.cityPages || b.pagesByCity
    ),
    cityDemandHeatmap: normalizeTopList(
      o.cityDemandHeatmap || b.cityDemandHeatmap
    ),
    topLandingPages: normalizeTopList(
      o.topLandingPages || b.topLandingPages
    ),
    topComparePages: normalizeTopList(
      o.topComparePages || b.topComparePages || b.compareGuides || b.comparePages
    ),
    compareTrends: asArray(o.compareConversions?.trends),
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
        o.leadConversions?.total ??
          b.leadConversions?.total ??
          b.leadsSubmitted ??
          adminAnalytics?.totalLeads ??
          0
      ),
      bySource: normalizeTopList(
        o.leadConversions?.bySource ||
          b.leadConversions?.bySource ||
          b.leadsBySource
      ),
      byLanding: normalizeTopList(o.leadConversions?.byLanding),
      overTime: asArray(
        adminAnalytics?.leadsOverTime || b.leadConversions?.overTime
      ),
    },
    compareConversions: {
      total: Number(
        o.compareConversions?.total ??
          b.compareConversions?.total ??
          b.compareCompleted ??
          0
      ),
      started: Number(
        o.compareConversions?.started ?? b.compareStarted ?? b.compareSessions ?? 0
      ),
      completionRate:
        o.compareConversions?.completionRate ??
        b.compareCompletionRate ??
        (b.compareCompleted && b.compareStarted
          ? Math.round((b.compareCompleted / b.compareStarted) * 100)
          : null),
    },
    variantInterest: normalizeTopList(
      b.variantInterest || b.variantSelected || b.topVariants
    ),
    raw: { ops: o, behavioral: b, adminAnalytics },
  };
}

function emptyShell(days = 7) {
  return mergeIntelligence({}, { days, report: {} }, {});
}

/**
 * @param {number} days
 * @param {string} token
 */
export async function fetchTrafficIntelligence(days = 7, token) {
  if (!token) return emptyShell(days);

  let trafficOps = null;
  let behavioral = null;
  let adminAnalytics = null;

  try {
    const res = await fetch(
      `${API_URL}/api/admin/traffic-ops?days=${days}`,
      { headers: authHeaders(token) }
    );
    if (res.ok) trafficOps = await res.json();
  } catch {
    /* backend optional */
  }

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

  if (!trafficOps && !behavioral && !adminAnalytics) {
    return { ...emptyShell(days), source: "unavailable" };
  }

  return mergeIntelligence(
    trafficOps || {},
    behavioral || { days },
    adminAnalytics || {}
  );
}
