/**
 * Analytics Agent v1 — read-only BI workflow across platform data.
 */
import {
  ANALYTICS_CATEGORIES,
  CATALOG_GROWTH_THRESHOLD,
  SEO_DRAFT_BACKLOG_THRESHOLD,
  RANKING_SHIFT_THRESHOLD,
  AGENT_FAILURE_RATE_WARNING,
  MONITORING_ALERT_SPIKE_THRESHOLD,
  AUDIT_FINDING_SPIKE_THRESHOLD,
  FRESHNESS_STALE_DAYS,
  pct,
  daysSince,
} from "./analyticsRules.js";
import { createInsight } from "./analyticsInsights.js";
import { INSIGHT_LEVEL } from "./analyticsStatus.js";
import { insightLevelToRecommendation } from "./analyticsRecommendation.js";

function attachRecommendation(insight) {
  return {
    ...insight,
    recommendation: insightLevelToRecommendation(insight.level),
  };
}

export function analyzeCatalog(snapshot) {
  const insights = [];
  const vehicles = snapshot.vehicles || [];
  const previous = snapshot.previousSnapshot?.vehicleCount ?? 0;
  const variantCount = vehicles.reduce(
    (s, v) => s + (v.variants || []).length,
    0
  );

  insights.push(
    attachRecommendation(
      createInsight({
        level: INSIGHT_LEVEL.INFO,
        category: ANALYTICS_CATEGORIES.CATALOG,
        code: "catalog_vehicle_count",
        message: `Catalog contains ${vehicles.length} vehicle families.`,
        value: vehicles.length,
      })
    )
  );

  insights.push(
    attachRecommendation(
      createInsight({
        level: INSIGHT_LEVEL.INFO,
        category: ANALYTICS_CATEGORIES.CATALOG,
        code: "catalog_variant_count",
        message: `${variantCount} variants tracked across catalog.`,
        value: variantCount,
      })
    )
  );

  const growth = vehicles.length - previous;
  if (growth >= CATALOG_GROWTH_THRESHOLD) {
    insights.push(
      attachRecommendation(
        createInsight({
          level: INSIGHT_LEVEL.OPPORTUNITY,
          category: ANALYTICS_CATEGORIES.CATALOG,
          code: "catalog_growth_detected",
          message: `Catalog grew by ${growth} vehicles (${previous} → ${vehicles.length}).`,
          value: growth,
          metadata: { previous, current: vehicles.length },
        })
      )
    );
  }

  const registry = snapshot.registry || [];
  if (registry.length > 0) {
    const covered = vehicles.filter((v) =>
      registry.some(
        (r) => (r.familySlug || r.id) === (v.familySlug || v.id)
      )
    ).length;
    const coveragePct = pct(covered, registry.length);
    insights.push(
      attachRecommendation(
        createInsight({
          level: INSIGHT_LEVEL.INFO,
          category: ANALYTICS_CATEGORIES.CATALOG,
          code: "catalog_coverage_trend",
          message: `Registry coverage at ${coveragePct}% (${covered}/${registry.length}).`,
          value: coveragePct,
        })
      )
    );
  }

  const freshness = snapshot.freshness || {};
  const now = snapshot.now || new Date();
  const lastUpdate = freshness.lastCatalogUpdate;
  if (lastUpdate) {
    const age = daysSince(lastUpdate, now);
    const level =
      age != null && age > FRESHNESS_STALE_DAYS
        ? INSIGHT_LEVEL.WARNING
        : INSIGHT_LEVEL.INFO;
    insights.push(
      attachRecommendation(
        createInsight({
          level,
          category: ANALYTICS_CATEGORIES.CATALOG,
          code: "catalog_freshness_trend",
          message: `Catalog last updated ${Math.round(age ?? 0)} days ago.`,
          value: age,
        })
      )
    );
  }

  return insights;
}

export function analyzeScores(snapshot) {
  const insights = [];
  const records = snapshot.scoreRecords || [];
  const scores = records.map((r) => r.overallScore).filter((s) => s != null);

  if (scores.length) {
    const avg =
      Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
    insights.push(
      attachRecommendation(
        createInsight({
          level: INSIGHT_LEVEL.INFO,
          category: ANALYTICS_CATEGORIES.SCORE,
          code: "score_average",
          message: `Average platform score: ${avg}.`,
          value: avg,
        })
      )
    );

    const categories = ["range", "value", "city", "highway"];
    for (const cat of categories) {
      const ranked = [...records]
        .filter((r) => r.breakdown?.[cat]?.score != null)
        .sort(
          (a, b) =>
            (b.breakdown[cat]?.score ?? 0) - (a.breakdown[cat]?.score ?? 0)
        );
      if (ranked[0]) {
        insights.push(
          attachRecommendation(
            createInsight({
              level: INSIGHT_LEVEL.INFO,
              category: ANALYTICS_CATEGORIES.SCORE,
              code: "score_category_leader",
              message: `${cat} leader: ${ranked[0].displayName || ranked[0].familySlug} (${ranked[0].breakdown[cat].score}).`,
              entityId: ranked[0].familySlug,
              metadata: { category: cat, score: ranked[0].breakdown[cat].score },
            })
          )
        );
      }
    }

    const gradeCounts = {};
    for (const r of records) {
      const g = r.grade || "unrated";
      gradeCounts[g] = (gradeCounts[g] || 0) + 1;
    }
    insights.push(
      attachRecommendation(
        createInsight({
          level: INSIGHT_LEVEL.INFO,
          category: ANALYTICS_CATEGORIES.SCORE,
          code: "score_distribution",
          message: `Score distribution: ${Object.entries(gradeCounts)
            .map(([k, v]) => `${k}:${v}`)
            .join(", ")}.`,
          metadata: { gradeCounts },
        })
      )
    );
  }

  const shifts = snapshot.scoreSnapshots?.categoryRankShifts || [];
  for (const shift of shifts) {
    if (shift.rankDelta >= RANKING_SHIFT_THRESHOLD) {
      insights.push(
        attachRecommendation(
          createInsight({
            level: INSIGHT_LEVEL.WARNING,
            category: ANALYTICS_CATEGORIES.SCORE,
            code: "score_ranking_shift",
            message: `${shift.familySlug} moved ${shift.rankDelta} positions in ${shift.category} rankings.`,
            entityId: shift.familySlug,
            metadata: shift,
          })
        )
      );
    }
  }

  const previous = snapshot.previousSnapshot?.scoreRecords || [];
  if (previous.length && records.length) {
    const prevMap = new Map(previous.map((p) => [p.familySlug, p.overallScore]));
    for (const row of records) {
      const prev = prevMap.get(row.familySlug);
      if (prev != null && row.overallScore != null) {
        const delta = Math.abs(row.overallScore - prev);
        if (delta >= 10) {
          insights.push(
            attachRecommendation(
              createInsight({
                level: INSIGHT_LEVEL.WARNING,
                category: ANALYTICS_CATEGORIES.SCORE,
                code: "score_ranking_shift",
                message: `Score shift ${delta} pts for ${row.familySlug} (${prev} → ${row.overallScore}).`,
                entityId: row.familySlug,
                metadata: { previous: prev, current: row.overallScore, delta },
              })
            )
          );
        }
      }
    }
  }

  return insights;
}

export function analyzeSeo(snapshot) {
  const insights = [];
  const jobs = snapshot.seoJobs || [];

  insights.push(
    attachRecommendation(
      createInsight({
        level: INSIGHT_LEVEL.INFO,
        category: ANALYTICS_CATEGORIES.SEO,
        code: "seo_pages_generated",
        message: `${jobs.length} SEO page job(s) in pipeline.`,
        value: jobs.length,
      })
    )
  );

  const approved = jobs.filter(
    (j) => j.status === "approved" || j.approvedAt
  ).length;
  const published = jobs.filter((j) => j.status === "published").length;
  const drafts = jobs.filter(
    (j) => j.status === "draft" || j.status === "review_required"
  );

  if (jobs.length) {
    insights.push(
      attachRecommendation(
        createInsight({
          level: INSIGHT_LEVEL.INFO,
          category: ANALYTICS_CATEGORIES.SEO,
          code: "seo_approval_rate",
          message: `SEO approval rate: ${pct(approved, jobs.length)}%.`,
          value: pct(approved, jobs.length),
        })
      )
    );
    insights.push(
      attachRecommendation(
        createInsight({
          level: INSIGHT_LEVEL.INFO,
          category: ANALYTICS_CATEGORIES.SEO,
          code: "seo_publish_rate",
          message: `SEO publish rate: ${pct(published, jobs.length)}%.`,
          value: pct(published, jobs.length),
        })
      )
    );
  }

  const categoryCounts = {};
  for (const job of jobs) {
    const cat = job.seoPage?.contentType || job.contentType || "other";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }
  const topCat = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];
  if (topCat) {
    insights.push(
      attachRecommendation(
        createInsight({
          level: INSIGHT_LEVEL.INFO,
          category: ANALYTICS_CATEGORIES.SEO,
          code: "seo_top_category",
          message: `Top SEO category: ${topCat[0]} (${topCat[1]} pages).`,
          entityId: topCat[0],
          value: topCat[1],
        })
      )
    );
  }

  if (drafts.length >= SEO_DRAFT_BACKLOG_THRESHOLD) {
    insights.push(
      attachRecommendation(
        createInsight({
          level: INSIGHT_LEVEL.WARNING,
          category: ANALYTICS_CATEGORIES.SEO,
          code: "seo_draft_backlog",
          message: `SEO draft backlog: ${drafts.length} unpublished pages.`,
          value: drafts.length,
        })
      )
    );
  }

  return insights;
}

export function analyzeAgents(snapshot) {
  const insights = [];
  const execs = snapshot.orchestratorExecutions || [];

  if (!execs.length) return insights;

  const success = execs.filter(
    (e) => e.status === "completed" || e.status === "approved"
  ).length;
  const failed = execs.filter((e) => e.status === "failed").length;
  const approved = execs.filter((e) => e.approvedAt).length;
  const durations = execs.map((e) => e.durationMs).filter(Number.isFinite);
  const avgDuration = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : null;

  insights.push(
    attachRecommendation(
      createInsight({
        level: INSIGHT_LEVEL.INFO,
        category: ANALYTICS_CATEGORIES.AGENT,
        code: "agent_success_rate",
        message: `Agent success rate: ${pct(success, execs.length)}%.`,
        value: pct(success, execs.length),
      })
    )
  );

  const failRate = pct(failed, execs.length);
  insights.push(
    attachRecommendation(
      createInsight({
        level:
          failRate != null && failRate >= AGENT_FAILURE_RATE_WARNING
            ? INSIGHT_LEVEL.WARNING
            : INSIGHT_LEVEL.INFO,
        category: ANALYTICS_CATEGORIES.AGENT,
        code: "agent_failure_rate",
        message: `Agent failure rate: ${failRate}%.`,
        value: failRate,
      })
    )
  );

  if (failRate != null && failRate >= AGENT_FAILURE_RATE_WARNING) {
    insights.push(
      attachRecommendation(
        createInsight({
          level: INSIGHT_LEVEL.WARNING,
          category: ANALYTICS_CATEGORIES.AGENT,
          code: "agent_failure_trend",
          message: `Elevated agent failure trend: ${failRate}% (${failed}/${execs.length}).`,
          value: failRate,
          metadata: { failed, total: execs.length },
        })
      )
    );
  }

  if (avgDuration != null) {
    insights.push(
      attachRecommendation(
        createInsight({
          level: INSIGHT_LEVEL.INFO,
          category: ANALYTICS_CATEGORIES.AGENT,
          code: "agent_duration_avg",
          message: `Average agent execution duration: ${avgDuration}ms.`,
          value: avgDuration,
        })
      )
    );
  }

  insights.push(
    attachRecommendation(
      createInsight({
        level: INSIGHT_LEVEL.INFO,
        category: ANALYTICS_CATEGORIES.AGENT,
        code: "agent_approval_count",
        message: `${approved} agent execution(s) with human approval recorded.`,
        value: approved,
      })
    )
  );

  return insights;
}

export function analyzeMonitoring(snapshot) {
  const insights = [];
  const scans = snapshot.monitoringScans || [];

  if (!scans.length) return insights;

  const totalAlerts = scans.reduce(
    (s, scan) => s + (scan.alerts?.length ?? 0),
    0
  );
  const avgAlerts = Math.round((totalAlerts / scans.length) * 10) / 10;

  insights.push(
    attachRecommendation(
      createInsight({
        level: INSIGHT_LEVEL.INFO,
        category: ANALYTICS_CATEGORIES.MONITORING,
        code: "monitoring_alert_frequency",
        message: `Average ${avgAlerts} alerts per monitoring scan (${scans.length} scans).`,
        value: avgAlerts,
      })
    )
  );

  const resolved = scans.filter((s) => s.status === "approved").length;
  insights.push(
    attachRecommendation(
      createInsight({
        level: INSIGHT_LEVEL.INFO,
        category: ANALYTICS_CATEGORIES.MONITORING,
        code: "monitoring_resolution_time",
        message: `Monitoring resolution rate: ${pct(resolved, scans.length)}%.`,
        value: pct(resolved, scans.length),
      })
    )
  );

  const failed = scans.filter((s) => s.status === "failed");
  if (failed.length >= 2) {
    insights.push(
      attachRecommendation(
        createInsight({
          level: INSIGHT_LEVEL.WARNING,
          category: ANALYTICS_CATEGORIES.MONITORING,
          code: "monitoring_failure_pattern",
          message: `${failed.length} monitoring scan failures detected.`,
          value: failed.length,
        })
      )
    );
  }

  const spikeScan = scans.find(
    (s) => (s.alerts?.length ?? 0) >= MONITORING_ALERT_SPIKE_THRESHOLD
  );
  if (spikeScan) {
    insights.push(
      attachRecommendation(
        createInsight({
          level: INSIGHT_LEVEL.WARNING,
          category: ANALYTICS_CATEGORIES.MONITORING,
          code: "monitoring_alert_spike",
          message: `Alert spike: ${spikeScan.alerts.length} alerts in scan ${spikeScan.id}.`,
          entityId: spikeScan.id,
          value: spikeScan.alerts.length,
        })
      )
    );
  }

  return insights;
}

export function analyzeAudit(snapshot) {
  const insights = [];
  const runs = snapshot.auditRuns || [];

  if (!runs.length) return insights;

  const totalFindings = runs.reduce(
    (s, r) => s + (r.metrics?.findingCount ?? r.findings?.length ?? 0),
    0
  );
  const avgFindings = Math.round((totalFindings / runs.length) * 10) / 10;

  insights.push(
    attachRecommendation(
      createInsight({
        level: INSIGHT_LEVEL.INFO,
        category: ANALYTICS_CATEGORIES.AUDIT,
        code: "audit_finding_trend",
        message: `Average ${avgFindings} findings per audit run (${runs.length} runs).`,
        value: avgFindings,
      })
    )
  );

  if (avgFindings >= AUDIT_FINDING_SPIKE_THRESHOLD / runs.length) {
    const latest = runs[0];
    const findingCount =
      latest?.metrics?.findingCount ?? latest?.findings?.length ?? 0;
    if (findingCount >= AUDIT_FINDING_SPIKE_THRESHOLD) {
      insights.push(
        attachRecommendation(
          createInsight({
            level: INSIGHT_LEVEL.WARNING,
            category: ANALYTICS_CATEGORIES.AUDIT,
            code: "audit_finding_trend",
            message: `Audit finding spike: ${findingCount} findings in latest run.`,
            value: findingCount,
          })
        )
      );
    }
  }

  const criticalTotal = runs.reduce(
    (s, r) => s + (r.metrics?.criticalCount ?? 0),
    0
  );
  if (criticalTotal > 0) {
    insights.push(
      attachRecommendation(
        createInsight({
          level: INSIGHT_LEVEL.WARNING,
          category: ANALYTICS_CATEGORIES.AUDIT,
          code: "audit_critical_trend",
          message: `${criticalTotal} critical audit finding(s) across recent runs.`,
          value: criticalTotal,
        })
      )
    );
  }

  const trustScores = runs
    .map((r) => r.metrics?.trustScore)
    .filter((t) => t != null);
  if (trustScores.length) {
    const avgTrust =
      Math.round(
        (trustScores.reduce((a, b) => a + b, 0) / trustScores.length) * 10
      ) / 10;
    insights.push(
      attachRecommendation(
        createInsight({
          level: INSIGHT_LEVEL.INFO,
          category: ANALYTICS_CATEGORIES.AUDIT,
          code: "audit_trust_history",
          message: `Average trust score across audits: ${avgTrust}.`,
          value: avgTrust,
        })
      )
    );
  }

  const resolved = runs.filter(
    (r) => r.status === "approved" || r.status === "rejected"
  ).length;
  insights.push(
    attachRecommendation(
      createInsight({
        level: INSIGHT_LEVEL.INFO,
        category: ANALYTICS_CATEGORIES.AUDIT,
        code: "audit_resolution_rate",
        message: `Audit resolution rate: ${pct(resolved, runs.length)}%.`,
        value: pct(resolved, runs.length),
      })
    )
  );

  return insights;
}

export function runAnalyticsWorkflow(snapshot) {
  const insights = [
    ...analyzeCatalog(snapshot),
    ...analyzeScores(snapshot),
    ...analyzeSeo(snapshot),
    ...analyzeAgents(snapshot),
    ...analyzeMonitoring(snapshot),
    ...analyzeAudit(snapshot),
  ];

  return { insights, snapshot };
}
