/**
 * Ownership authority depth — education clusters, guide ecosystem, buyer guidance.
 */

import {
  AUTHORITY_DEPTH_TOPICS,
  buildAuthorityDepthReport,
} from "./authorityDepthOps.js";
import { buildSeoAuthorityReport } from "./seoAuthorityOps.js";

export const AUTHORITY_MATURITY = Object.freeze({
  MATURE: "mature",
  DEVELOPING: "developing",
  EARLY: "early",
});

/** High-intent ownership guidance personas (support only). */
export const OWNERSHIP_GUIDANCE_PERSONAS = Object.freeze([
  {
    id: "first_time_ev",
    label: "First-time EV buyers",
    guidePaths: ["/ownership/running-cost", "/discover/under-15-lakh"],
    cluster: "ownership",
  },
  {
    id: "apartment_resident",
    label: "Apartment residents",
    guidePaths: ["/discover/apartment-living", "/charging-guides/home-charging"],
    cluster: "charging",
  },
  {
    id: "city_commuter",
    label: "City commuters",
    guidePaths: ["/discover/city-driving", "/ownership/running-cost"],
    cluster: "discovery",
  },
  {
    id: "highway_user",
    label: "Highway-heavy users",
    guidePaths: ["/discover/highway-evs", "/ownership/highway-ownership"],
    cluster: "discovery",
  },
  {
    id: "family_buyer",
    label: "Family EV buyers",
    guidePaths: ["/discover/family-friendly", "/ownership/running-cost"],
    cluster: "ownership",
  },
  {
    id: "budget_conscious",
    label: "Budget-conscious buyers",
    guidePaths: ["/best-evs/under-10-lakh", "/discover/under-15-lakh"],
    cluster: "best_ev_authority",
  },
]);

function pathReachable(path, ctx) {
  const orphans = ctx.seoDiscipline?.orphanDiscoveryPaths || [];
  return !orphans.includes(path);
}

function scorePersona(persona, ctx) {
  const pathsOk = persona.guidePaths.filter((p) => pathReachable(p, ctx)).length;
  const completeness = Math.round((pathsOk / persona.guidePaths.length) * 100);
  const educationalSupport = Math.min(100, completeness + (pathsOk >= 2 ? 10 : 0));
  const guidanceConfidence =
    completeness >= 80 ? "high" : completeness >= 50 ? "medium" : "low";
  const practicalGuidanceMaturity = Math.round(
    educationalSupport * (guidanceConfidence === "high" ? 1 : 0.85)
  );

  const weak =
    completeness < 50
      ? ["missing_ownership_guidance"]
      : completeness < 80
        ? ["weak_practical_explanations"]
        : [];

  return {
    ...persona,
    guideSupportCompleteness: completeness,
    ownershipGuidanceConfidence: guidanceConfidence,
    practicalGuidanceMaturity,
    educationalSupportScore: educationalSupport,
    weak,
  };
}

export function buildOwnershipAuthorityReport(ctx = {}) {
  const base = buildAuthorityDepthReport(ctx);
  const seo = buildSeoAuthorityReport(ctx);

  const personas = OWNERSHIP_GUIDANCE_PERSONAS.map((p) => scorePersona(p, ctx));

  const weakAuthorityClusters = {};
  for (const topic of base.topics) {
    if (topic.guideSupportCompleteness < 70) {
      weakAuthorityClusters[topic.id] = {
        id: topic.id,
        title: topic.title,
        completeness: topic.guideSupportCompleteness,
        suggestion: `Deepen editorial on ${topic.title}`,
      };
    }
  }
  for (const p of personas.filter((x) => x.weak.length)) {
    weakAuthorityClusters[p.id] = {
      id: p.id,
      title: p.label,
      completeness: p.guideSupportCompleteness,
      suggestion: "Add practical charging/ownership context links from compare + detail",
    };
  }

  const missingGuidance = personas
    .filter((p) => p.guideSupportCompleteness < 60)
    .map((p) => p.label);

  const compareLinkMaturity =
    base.compareGuideLinks.length >= 6
      ? "mature"
      : base.compareGuideLinks.length >= 3
        ? "developing"
        : "early";

  const ownershipClusterCompleteness = Math.round(
    base.topics
      .filter((t) => t.cluster === "ownership")
      .reduce((s, t) => s + t.guideSupportCompleteness, 0) /
      Math.max(base.topics.filter((t) => t.cluster === "ownership").length, 1)
  );

  const chargingEducationMaturity = Math.round(
    base.topics
      .filter((t) => t.cluster === "charging")
      .reduce((s, t) => s + t.guideSupportCompleteness, 0) /
      Math.max(base.topics.filter((t) => t.cluster === "charging").length, 1)
  );

  const guideOpportunityMaturity = Math.round(
    (seo.guideOpportunities || []).reduce(
      (s, g) => s + (g.guideOpportunityScore || 0),
      0
    ) / Math.max((seo.guideOpportunities || []).length, 1)
  );

  const authorityEcosystemScore = Math.round(
    base.avgAuthorityDepthScore * 0.35 +
      ownershipClusterCompleteness * 0.2 +
      chargingEducationMaturity * 0.2 +
      guideOpportunityMaturity * 0.15 +
      (compareLinkMaturity === "mature" ? 10 : compareLinkMaturity === "developing" ? 5 : 0)
  );

  const authorityMaturityLevel =
    authorityEcosystemScore >= 80
      ? AUTHORITY_MATURITY.MATURE
      : authorityEcosystemScore >= 65
        ? AUTHORITY_MATURITY.DEVELOPING
        : AUTHORITY_MATURITY.EARLY;

  const editorialDepthSuggestions = [
    ...Object.values(weakAuthorityClusters).slice(0, 4).map((c) => c.suggestion),
    compareLinkMaturity === "early"
      ? "Link top compare pairs to charging + ownership hubs"
      : null,
  ].filter(Boolean);

  const premiumGuideEcosystem = {
    compareToOwnership: base.compareGuideLinks.filter((l) =>
      String(l.to).includes("/ownership")
    ),
    compareToCharging: base.compareGuideLinks.filter((l) =>
      String(l.to).includes("/charging")
    ),
    discoveryBridges: AUTHORITY_DEPTH_TOPICS.map((t) => ({
      topic: t.id,
      primaryPath: t.paths[0],
    })),
  };

  return {
    ...base,
    personas,
    authorityDepthScore: base.avgAuthorityDepthScore,
    authorityMaturityLevel,
    authorityEcosystemScore,
    ownershipEducationCompleteness: ownershipClusterCompleteness,
    chargingEducationMaturity,
    compareGuideLinkMaturity: compareLinkMaturity,
    guideOpportunityMaturity,
    ownershipRealismSupport: Math.round(
      (ownershipClusterCompleteness + chargingEducationMaturity) / 2
    ),
    weakAuthorityClusters: Object.values(weakAuthorityClusters),
    missingGuidanceAreas: missingGuidance,
    editorialDepthSuggestions,
    premiumGuideEcosystem,
    generatedAt: new Date().toISOString(),
  };
}
