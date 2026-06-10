/**
 * Analytics Agent v1 — platform KPI scores and aggregates.
 */
import { INSIGHT_LEVEL } from "./analyticsStatus.js";
import { countByLevel } from "./analyticsInsights.js";
import { pct, daysSince, FRESHNESS_STALE_DAYS } from "./analyticsRules.js";

export function computeCoverageScore(snapshot) {
  const vehicles = snapshot.vehicles || [];
  const registry = snapshot.registry || [];
  const target = Math.max(registry.length, vehicles.length, 1);
  const withVariants = vehicles.filter((v) => (v.variants || []).length > 0).length;
  const withScores = (snapshot.scoreRecords || []).filter(
    (r) => r.overallScore != null
  ).length;
  const coverage = ((withVariants + withScores) / (target * 2)) * 100;
  return Math.max(0, Math.min(100, Math.round(coverage)));
}

export function computeFreshnessScore(snapshot) {
  const freshness = snapshot.freshness || {};
  const now = snapshot.now || new Date();
  const dates = [
    freshness.lastCatalogUpdate,
    freshness.lastAcquisitionAt,
    freshness.lastScoreGenerationAt,
    freshness.lastSeoGenerationAt,
  ].filter(Boolean);

  if (!dates.length) return 50;

  const ages = dates.map((d) => daysSince(d, now)).filter((a) => a != null);
  const avgAge = ages.reduce((s, a) => s + a, 0) / ages.length;
  if (avgAge <= 7) return 100;
  if (avgAge <= FRESHNESS_STALE_DAYS) return 80;
  if (avgAge <= 30) return 60;
  return 40;
}

export function computeGrowthScore(snapshot) {
  const current = (snapshot.vehicles || []).length;
  const previous = snapshot.previousSnapshot?.vehicleCount ?? current;
  if (previous === 0) return current > 0 ? 80 : 50;
  const growthPct = ((current - previous) / previous) * 100;
  if (growthPct >= 20) return 100;
  if (growthPct >= 10) return 85;
  if (growthPct >= 0) return 70;
  return Math.max(30, 70 + Math.round(growthPct));
}

export function computeTrustScore(snapshot) {
  const auditRuns = snapshot.auditRuns || [];
  const latest = auditRuns[0];
  if (latest?.metrics?.trustScore != null) {
    return latest.metrics.trustScore;
  }
  const criticalFindings = auditRuns.reduce(
    (s, r) => s + (r.metrics?.criticalCount ?? 0),
    0
  );
  return Math.max(0, Math.min(100, 100 - criticalFindings * 8));
}

export function computeAgentEfficiency(snapshot) {
  const execs = snapshot.orchestratorExecutions || [];
  if (!execs.length) return null;
  const success = execs.filter(
    (e) => e.status === "completed" || e.status === "approved"
  ).length;
  const durations = execs.map((e) => e.durationMs).filter(Number.isFinite);
  const successPct = pct(success, execs.length) ?? 0;
  const avgDuration =
    durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;
  const durationScore = avgDuration > 0 ? Math.min(100, 60000 / avgDuration) : 50;
  return Math.round(successPct * 0.7 + durationScore * 0.3);
}

export function computePlatformHealthScore(insights = [], snapshot = {}) {
  const counts = countByLevel(insights);
  let score = 100;
  score -= counts.WARNING * 8;
  score -= counts.OPPORTUNITY * 2;
  score = score * 0.4 + computeCoverageScore(snapshot) * 0.2;
  score += computeFreshnessScore(snapshot) * 0.2;
  score += computeTrustScore(snapshot) * 0.2;
  return Math.max(0, Math.min(100, Math.round(score / 1)));
}

export function buildKpiSummary(snapshot, insights = []) {
  const vehicles = snapshot.vehicles || [];
  const variants = vehicles.reduce(
    (s, v) => s + (v.variants || []).length,
    0
  );
  const scores = (snapshot.scoreRecords || [])
    .map((r) => r.overallScore)
    .filter((s) => s != null);
  const avgScore =
    scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : null;

  const seoJobs = snapshot.seoJobs || [];
  const drafts = seoJobs.filter(
    (j) => j.status === "draft" || j.status === "review_required"
  ).length;

  return {
    vehicleCount: vehicles.length,
    variantCount: variants,
    averageScore: avgScore,
    seoDraftBacklog: drafts,
    seoPagesGenerated: seoJobs.length,
    insightCount: insights.length,
  };
}

export function buildTopRankings(scoreRecords = []) {
  return [...scoreRecords]
    .filter((r) => r.overallScore != null)
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, 5)
    .map((r, i) => ({
      rank: i + 1,
      familySlug: r.familySlug,
      displayName: r.displayName,
      overallScore: r.overallScore,
      grade: r.grade,
    }));
}

export function buildCategoryLeaders(scoreRecords = []) {
  const categories = ["range", "value", "city", "highway", "family"];
  const leaders = {};

  for (const cat of categories) {
    const ranked = [...scoreRecords]
      .filter((r) => r.breakdown?.[cat]?.score != null)
      .sort(
        (a, b) =>
          (b.breakdown[cat]?.score ?? 0) - (a.breakdown[cat]?.score ?? 0)
      );
    if (ranked[0]) {
      leaders[cat] = {
        familySlug: ranked[0].familySlug,
        displayName: ranked[0].displayName,
        score: ranked[0].breakdown[cat].score,
      };
    }
  }

  return leaders;
}

export function buildScoreDistribution(scoreRecords = []) {
  const buckets = { A: 0, B: 0, C: 0, D: 0, F: 0, unrated: 0 };
  for (const row of scoreRecords) {
    const grade = row.grade || "unrated";
    if (buckets[grade] != null) buckets[grade] += 1;
    else buckets.unrated += 1;
  }
  return buckets;
}

export function computeAnalyticsMetrics(report, snapshot = {}) {
  const insights = report.insights || [];

  return {
    platformHealthScore: computePlatformHealthScore(insights, snapshot),
    growthScore: computeGrowthScore(snapshot),
    trustScore: computeTrustScore(snapshot),
    coverageScore: computeCoverageScore(snapshot),
    freshnessScore: computeFreshnessScore(snapshot),
    agentEfficiency: computeAgentEfficiency(snapshot),
    insightCount: insights.length,
    opportunityCount: countByLevel(insights).OPPORTUNITY,
    warningCount: countByLevel(insights).WARNING,
    kpi: buildKpiSummary(snapshot, insights),
    topRankings: buildTopRankings(snapshot.scoreRecords || []),
    categoryLeaders: buildCategoryLeaders(snapshot.scoreRecords || []),
    scoreDistribution: buildScoreDistribution(snapshot.scoreRecords || []),
    analyzedAt: report.completedAt || report.startedAt,
  };
}

export function buildTrendPoints(reports = [], key = "platformHealthScore") {
  return [...reports]
    .reverse()
    .slice(-12)
    .map((r, i) => ({
      index: i + 1,
      label: r.completedAt
        ? new Date(r.completedAt).toLocaleDateString()
        : `#${i + 1}`,
      value: r.metrics?.[key] ?? 0,
    }));
}
