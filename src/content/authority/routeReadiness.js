/**
 * Whether an authority topic has a live routable destination.
 */

import { INTELLIGENCE_DISCOVERY_PRESETS } from "../../data/intelligenceDiscoveryPresets.js";
import { getRegistryEntryByPath } from "../registry.js";
import { resolveGuideCanonicalPath } from "../../seo/legacyCanonicalMap.js";

/**
 * @param {{ canonicalPath?: string, contentSlug?: string }} topic
 */
export function isAuthorityTopicRouteReady(topic = {}) {
  const paths = [];
  if (topic.canonicalPath) paths.push(topic.canonicalPath);
  if (topic.contentSlug) {
    paths.push(resolveGuideCanonicalPath(topic.contentSlug));
  }

  for (const path of paths) {
    if (!path) continue;
    if (path === "/guides") return true;
    if (path.startsWith("/discover/")) {
      const slug = path.replace("/discover/", "");
      if (INTELLIGENCE_DISCOVERY_PRESETS[slug]) return true;
    }
    if (getRegistryEntryByPath(path)) return true;
  }
  return false;
}
