import { INTELLIGENCE_DISCOVERY_PRESETS } from "../data/intelligenceDiscoveryPresets.js";

/**
 * Internal links for intelligence discovery hub sections.
 */
export function getIntelligenceDiscoveryLinks({ limit = 8 } = {}) {
  return Object.values(INTELLIGENCE_DISCOVERY_PRESETS)
    .slice(0, limit)
    .map((preset) => ({
      slug: preset.slug,
      label: preset.h1,
      href: preset.path,
    }));
}
