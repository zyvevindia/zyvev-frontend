import { INTELLIGENCE_DISCOVERY_PRESETS } from "../data/intelligenceDiscoveryPresets.js";

const BUDGET_HUB = INTELLIGENCE_DISCOVERY_PRESETS["budget-evs"];
const LEGACY_BUDGET_SLUGS = new Set([
  "under-10-lakh",
  "under-15-lakh",
  "under-20-lakh",
]);

/**
 * Internal links for intelligence discovery hub sections.
 */
export function getIntelligenceDiscoveryLinks({ limit = 8 } = {}) {
  const budgetLink = BUDGET_HUB
    ? {
        slug: BUDGET_HUB.slug,
        label: "Budget EVs",
        href: BUDGET_HUB.path,
      }
    : null;

  const rest = Object.values(INTELLIGENCE_DISCOVERY_PRESETS)
    .filter(
      (preset) =>
        preset.slug !== BUDGET_HUB?.slug &&
        !preset.redirectToBudgetHub &&
        !LEGACY_BUDGET_SLUGS.has(preset.slug)
    )
    .map((preset) => ({
      slug: preset.slug,
      label: preset.h1,
      href: preset.path,
    }));

  const links = budgetLink ? [budgetLink, ...rest] : rest;
  return links.slice(0, limit);
}
