/**
 * Catalog intelligence layer — feature-flagged decision support.
 */

export const CATALOG_INTELLIGENCE =
  import.meta.env.VITE_CATALOG_INTELLIGENCE === "true";

export function hasCatalogIntelligence(car) {
  if (!CATALOG_INTELLIGENCE) return false;
  const meta = car?.catalogMeta;
  if (!meta) return false;
  return Boolean(
    meta.intelligenceEnabled ||
      meta.decision?.whoShouldBuy?.length ||
      meta.personaFit ||
      meta.safety ||
      meta.comparePicks
  );
}

export function mergeIntelligenceIntoCatalogMeta(
  meta,
  catalogDto
) {
  if (!catalogDto) return meta;

  return {
    ...meta,
    intelligenceEnabled: true,
    safety: catalogDto.safety ?? meta.safety,
    comfort: catalogDto.comfort ?? meta.comfort,
    chargingEcosystem:
      catalogDto.chargingEcosystem ?? meta.chargingEcosystem,
    ownershipIntelligence:
      catalogDto.ownershipIntelligence ??
      meta.ownershipIntelligence,
    psychologyExtended:
      catalogDto.psychologyExtended ?? meta.psychologyExtended,
    decision: catalogDto.decision ?? meta.decision,
    personaFit: catalogDto.personaFit ?? meta.personaFit,
    comparePicks:
      catalogDto.compare?.picks ?? meta.comparePicks,
    compareNarrative:
      catalogDto.compare?.narrative ?? meta.compareNarrative,
    commercial: catalogDto.commercial ?? meta.commercial,
    scenarioFit: catalogDto.scenarioFit ?? meta.scenarioFit,
    editorialNarratives:
      catalogDto.editorialNarratives ?? meta.editorialNarratives,
    intelligenceGovernance:
      catalogDto.intelligenceGovernance ??
      meta.intelligenceGovernance,
    rangeReality: catalogDto.rangeReality ?? meta.rangeReality,
    chargingReality:
      catalogDto.chargingReality ?? meta.chargingReality,
    buyerAssurance:
      catalogDto.buyerAssurance ?? meta.buyerAssurance,
    ownershipTradeoffs:
      catalogDto.ownershipTradeoffs ?? meta.ownershipTradeoffs,
    scenarioCompare:
      catalogDto.scenarioCompare ?? meta.scenarioCompare,
    rangeRealityExpanded:
      catalogDto.rangeRealityExpanded ?? meta.rangeRealityExpanded,
    chargingPracticality:
      catalogDto.chargingPracticality ?? meta.chargingPracticality,
    ownershipConfidence:
      catalogDto.ownershipConfidence ?? meta.ownershipConfidence,
    trustPresentation:
      catalogDto.trustPresentation ?? meta.trustPresentation,
    compareTrust: catalogDto.compareTrust ?? meta.compareTrust,
    ownershipPracticality:
      catalogDto.ownershipPracticality ?? meta.ownershipPracticality,
  };
}
