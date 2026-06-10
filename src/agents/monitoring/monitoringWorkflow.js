/**
 * Monitoring Agent v1 — rule evaluation workflow.
 */
import {
  FRESHNESS_THRESHOLDS_DAYS,
  SCORE_DRIFT_THRESHOLD,
  AGENT_FAILURE_RATE_WARNING,
  AGENT_FAILURE_RATE_CRITICAL,
  MONITORING_CATEGORIES,
  AGENT_IDS,
  daysSince,
} from "./monitoringRules.js";
import { createAlert } from "./monitoringAlerts.js";
import { ALERT_LEVEL } from "./monitoringStatus.js";
import { alertLevelToRecommendation } from "./monitoringRecommendation.js";

function attachRecommendation(alert) {
  return {
    ...alert,
    recommendation: alertLevelToRecommendation(alert.level),
  };
}

export function evaluateCatalogFreshness(snapshot) {
  const alerts = [];
  const now = snapshot.now ? new Date(snapshot.now) : new Date();

  const lastCatalogUpdate = snapshot.freshness?.lastCatalogUpdate;
  if (lastCatalogUpdate) {
    const age = daysSince(lastCatalogUpdate, now);
    if (age != null && age > FRESHNESS_THRESHOLDS_DAYS.catalogUpdate) {
      alerts.push(
        attachRecommendation(
          createAlert({
            level: ALERT_LEVEL.WARNING,
            category: MONITORING_CATEGORIES.CATALOG_FRESHNESS,
            code: "catalog_stale_update",
            message: `Catalog last updated ${Math.round(age)} days ago (threshold ${FRESHNESS_THRESHOLDS_DAYS.catalogUpdate}d).`,
            metadata: { ageDays: age, threshold: FRESHNESS_THRESHOLDS_DAYS.catalogUpdate },
          })
        )
      );
    }
  }

  const lastAcquisition = snapshot.freshness?.lastAcquisitionAt;
  if (lastAcquisition) {
    const age = daysSince(lastAcquisition, now);
    if (age != null && age > FRESHNESS_THRESHOLDS_DAYS.acquisition) {
      alerts.push(
        attachRecommendation(
          createAlert({
            level: ALERT_LEVEL.WARNING,
            category: MONITORING_CATEGORIES.CATALOG_FRESHNESS,
            code: "acquisition_stale",
            message: `Last acquisition ${Math.round(age)} days ago (threshold ${FRESHNESS_THRESHOLDS_DAYS.acquisition}d).`,
            metadata: { ageDays: age },
          })
        )
      );
    }
  }

  const lastScore = snapshot.freshness?.lastScoreGenerationAt;
  if (!lastScore) {
    alerts.push(
      attachRecommendation(
        createAlert({
          level: ALERT_LEVEL.WARNING,
          category: MONITORING_CATEGORIES.CATALOG_FRESHNESS,
          code: "score_generation_stale",
          message: "No score generation timestamp recorded.",
        })
      )
    );
  } else {
    const age = daysSince(lastScore, now);
    if (age != null && age > FRESHNESS_THRESHOLDS_DAYS.scoreGeneration) {
      alerts.push(
        attachRecommendation(
          createAlert({
            level: ALERT_LEVEL.WARNING,
            category: MONITORING_CATEGORIES.CATALOG_FRESHNESS,
            code: "score_generation_stale",
            message: `Scores last generated ${Math.round(age)} days ago.`,
            metadata: { ageDays: age },
          })
        )
      );
    }
  }

  const lastSeo = snapshot.freshness?.lastSeoGenerationAt;
  if (lastSeo) {
    const age = daysSince(lastSeo, now);
    if (age != null && age > FRESHNESS_THRESHOLDS_DAYS.seoGeneration) {
      alerts.push(
        attachRecommendation(
          createAlert({
            level: ALERT_LEVEL.INFO,
            category: MONITORING_CATEGORIES.CATALOG_FRESHNESS,
            code: "seo_generation_stale",
            message: `SEO drafts last generated ${Math.round(age)} days ago.`,
            metadata: { ageDays: age },
          })
        )
      );
    }
  }

  return alerts;
}

export function evaluateOemHealth(snapshot) {
  const alerts = [];
  const probes = snapshot.oemProbeResults || [];

  for (const probe of probes) {
    const slug = probe.familySlug || probe.id;
    if (probe.status === 404 || probe.notFound) {
      alerts.push(
        attachRecommendation(
          createAlert({
            level: ALERT_LEVEL.CRITICAL,
            category: MONITORING_CATEGORIES.OEM_HEALTH,
            code: "oem_unreachable",
            message: `OEM URL returned 404 for ${slug}.`,
            entityId: slug,
            metadata: { url: probe.url, status: 404 },
          })
        )
      );
    } else if (probe.timeout) {
      alerts.push(
        attachRecommendation(
          createAlert({
            level: ALERT_LEVEL.WARNING,
            category: MONITORING_CATEGORIES.OEM_HEALTH,
            code: "oem_timeout",
            message: `OEM URL timed out for ${slug}.`,
            entityId: slug,
            metadata: { url: probe.url },
          })
        )
      );
    } else if (probe.redirect || probe.status === 301 || probe.status === 302) {
      alerts.push(
        attachRecommendation(
          createAlert({
            level: ALERT_LEVEL.WARNING,
            category: MONITORING_CATEGORIES.OEM_HEALTH,
            code: "oem_redirect",
            message: `OEM URL redirects for ${slug} — verify canonical source.`,
            entityId: slug,
            metadata: { url: probe.url, status: probe.status },
          })
        )
      );
    }

    if (probe.pdfMissing || probe.brochureUnavailable) {
      alerts.push(
        attachRecommendation(
          createAlert({
            level: ALERT_LEVEL.INFO,
            category: MONITORING_CATEGORIES.OEM_HEALTH,
            code: "oem_pdf_missing",
            message: `Brochure PDF unavailable for ${slug}.`,
            entityId: slug,
            metadata: { brochureUrl: probe.brochureUrl },
          })
        )
      );
    }
  }

  return alerts;
}

export function evaluateAgentHealth(snapshot) {
  const alerts = [];
  const execs = snapshot.orchestratorExecutions || [];

  const byAgent = {};
  for (const log of execs) {
    const id = log.agentId || "unknown";
    if (!byAgent[id]) byAgent[id] = { total: 0, failed: 0 };
    byAgent[id].total += 1;
    if (log.status === "failed") byAgent[id].failed += 1;
  }

  for (const [agentId, stats] of Object.entries(byAgent)) {
    if (stats.total < 2) continue;
    const failRate = (stats.failed / stats.total) * 100;
    if (failRate >= AGENT_FAILURE_RATE_CRITICAL) {
      alerts.push(
        attachRecommendation(
          createAlert({
            level: ALERT_LEVEL.CRITICAL,
            category: MONITORING_CATEGORIES.AGENT_HEALTH,
            code: "agent_high_failure_rate",
            message: `${agentId} failure rate ${failRate.toFixed(0)}% (${stats.failed}/${stats.total}).`,
            entityId: agentId,
            metadata: { failRate, ...stats },
          })
        )
      );
    } else if (failRate >= AGENT_FAILURE_RATE_WARNING) {
      alerts.push(
        attachRecommendation(
          createAlert({
            level: ALERT_LEVEL.WARNING,
            category: MONITORING_CATEGORIES.AGENT_HEALTH,
            code: "agent_high_failure_rate",
            message: `${agentId} failure rate ${failRate.toFixed(0)}%.`,
            entityId: agentId,
            metadata: { failRate, ...stats },
          })
        )
      );
    }
  }

  const recentFailure = execs.find((l) => l.status === "failed");
  if (recentFailure) {
    alerts.push(
      attachRecommendation(
        createAlert({
          level: ALERT_LEVEL.WARNING,
          category: MONITORING_CATEGORIES.AGENT_HEALTH,
          code: "agent_recent_failure",
          message: `Recent ${recentFailure.agentName || recentFailure.agentId} failure: ${recentFailure.error || "unknown"}.`,
          entityId: recentFailure.agentId,
          metadata: { executionId: recentFailure.id },
        })
      )
    );
  }

  const vcFailed = (snapshot.vehicleCreationJobs || []).filter(
    (j) => j.status === "rejected" || j.error
  );
  if (vcFailed.length) {
    alerts.push(
      attachRecommendation(
        createAlert({
          level: ALERT_LEVEL.INFO,
          category: MONITORING_CATEGORIES.AGENT_HEALTH,
          code: "agent_recent_failure",
          message: `${vcFailed.length} Vehicle Creation job(s) in rejected/error state.`,
          entityId: AGENT_IDS.VEHICLE_CREATION,
        })
      )
    );
  }

  return alerts;
}

export function evaluateScoreDrift(snapshot) {
  const alerts = [];
  const current = snapshot.scoreSnapshots?.current || [];
  const previous = snapshot.scoreSnapshots?.previous || [];
  const prevMap = new Map(previous.map((p) => [p.familySlug, p.overallScore]));

  for (const row of current) {
    if (row.overallScore == null) {
      alerts.push(
        attachRecommendation(
          createAlert({
            level: ALERT_LEVEL.WARNING,
            category: MONITORING_CATEGORIES.SCORE_DRIFT,
            code: "score_missing",
            message: `Missing overall score for ${row.familySlug || row.displayName}.`,
            entityId: row.familySlug,
          })
        )
      );
      continue;
    }

    const prev = prevMap.get(row.familySlug);
    if (prev != null) {
      const delta = Math.abs(row.overallScore - prev);
      if (delta >= SCORE_DRIFT_THRESHOLD) {
        alerts.push(
          attachRecommendation(
            createAlert({
              level: ALERT_LEVEL.WARNING,
              category: MONITORING_CATEGORIES.SCORE_DRIFT,
              code: "score_large_drift",
              message: `Score drift ${delta} pts for ${row.familySlug} (${prev} → ${row.overallScore}).`,
              entityId: row.familySlug,
              metadata: { previous: prev, current: row.overallScore, delta },
            })
          )
        );
      }
    }
  }

  const rankShifts = snapshot.scoreSnapshots?.categoryRankShifts || [];
  for (const shift of rankShifts) {
    if (shift.rankDelta >= 2) {
      alerts.push(
        attachRecommendation(
          createAlert({
            level: ALERT_LEVEL.INFO,
            category: MONITORING_CATEGORIES.SCORE_DRIFT,
            code: "category_ranking_shift",
            message: `${shift.category}: ${shift.familySlug} moved ${shift.rankDelta} rank positions.`,
            entityId: shift.familySlug,
            metadata: shift,
          })
        )
      );
    }
  }

  return alerts;
}

export function evaluateSeoHealth(snapshot) {
  const alerts = [];
  const jobs = snapshot.seoJobs || [];
  const slugs = [];

  for (const job of jobs) {
    const page = job.seoPage;
    if (!page) continue;
    slugs.push(page.slug);

    if (!page.metaDescription || page.metaDescription.length < 50) {
      alerts.push(
        attachRecommendation(
          createAlert({
            level: ALERT_LEVEL.WARNING,
            category: MONITORING_CATEGORIES.SEO_HEALTH,
            code: "seo_missing_metadata",
            message: `SEO job ${job.id} missing or short meta description.`,
            entityId: job.id,
            metadata: { slug: page.slug },
          })
        )
      );
    }

    if (job.status === "review_required" || job.status === "draft") {
      alerts.push(
        attachRecommendation(
          createAlert({
            level: ALERT_LEVEL.INFO,
            category: MONITORING_CATEGORIES.SEO_HEALTH,
            code: "seo_unpublished_drafts",
            message: `Unpublished SEO draft: ${page.title || page.slug}.`,
            entityId: job.id,
            metadata: { status: job.status },
          })
        )
      );
    }
  }

  const slugCounts = {};
  for (const s of slugs) {
    slugCounts[s] = (slugCounts[s] || 0) + 1;
  }
  for (const [slug, count] of Object.entries(slugCounts)) {
    if (count > 1) {
      alerts.push(
        attachRecommendation(
          createAlert({
            level: ALERT_LEVEL.CRITICAL,
            category: MONITORING_CATEGORIES.SEO_HEALTH,
            code: "seo_duplicate_slug",
            message: `Duplicate SEO slug "${slug}" in ${count} drafts.`,
            entityId: slug,
            metadata: { count },
          })
        )
      );
    }
  }

  const manifestSlugs = new Set(
    (snapshot.contentManifest?.entries || []).map((e) => e.contentSlug)
  );
  for (const job of jobs.filter((j) => j.status === "published")) {
    const slug = job.seoPage?.slug;
    if (slug && manifestSlugs.size > 0 && !manifestSlugs.has(slug)) {
      alerts.push(
        attachRecommendation(
          createAlert({
            level: ALERT_LEVEL.WARNING,
            category: MONITORING_CATEGORIES.SEO_HEALTH,
            code: "seo_orphan_page",
            message: `Published SEO slug "${slug}" not in content manifest.`,
            entityId: slug,
          })
        )
      );
    }
  }

  return alerts;
}

export function evaluateRegistryHealth(snapshot) {
  const alerts = [];
  const registry = snapshot.registry || [];
  const now = snapshot.now ? new Date(snapshot.now) : new Date();

  for (const entry of registry) {
    const slug = entry.familySlug || entry.id;

    if (!entry.brochureUrl || entry.flags?.missingBrochure) {
      alerts.push(
        attachRecommendation(
          createAlert({
            level: ALERT_LEVEL.INFO,
            category: MONITORING_CATEGORIES.REGISTRY_HEALTH,
            code: "registry_missing_brochure",
            message: `Missing brochure URL for ${slug}.`,
            entityId: slug,
          })
        )
      );
    }

    if (entry.flags?.unreachableUrl) {
      alerts.push(
        attachRecommendation(
          createAlert({
            level: ALERT_LEVEL.CRITICAL,
            category: MONITORING_CATEGORIES.REGISTRY_HEALTH,
            code: "registry_unverified_url",
            message: `Registry marks OEM URL unreachable for ${slug}.`,
            entityId: slug,
          })
        )
      );
    }

    if (entry.lastVerifiedAt) {
      const age = daysSince(entry.lastVerifiedAt, now);
      if (age != null && age > FRESHNESS_THRESHOLDS_DAYS.registryVerification) {
        alerts.push(
          attachRecommendation(
            createAlert({
              level: ALERT_LEVEL.WARNING,
              category: MONITORING_CATEGORIES.REGISTRY_HEALTH,
              code: "registry_verification_expired",
              message: `Verification expired for ${slug} (${Math.round(age)}d ago).`,
              entityId: slug,
              metadata: { ageDays: age },
            })
          )
        );
      }
    } else if (entry.status !== "verified") {
      alerts.push(
        attachRecommendation(
          createAlert({
            level: ALERT_LEVEL.WARNING,
            category: MONITORING_CATEGORIES.REGISTRY_HEALTH,
            code: "registry_unverified_url",
            message: `Unverified registry entry: ${slug}.`,
            entityId: slug,
          })
        )
      );
    }
  }

  return alerts;
}

export function runMonitoringWorkflow(snapshot) {
  const alerts = [
    ...evaluateCatalogFreshness(snapshot),
    ...evaluateOemHealth(snapshot),
    ...evaluateAgentHealth(snapshot),
    ...evaluateScoreDrift(snapshot),
    ...evaluateSeoHealth(snapshot),
    ...evaluateRegistryHealth(snapshot),
  ];

  return { alerts, snapshot };
}
