/**
 * EVSavari Internal Link Graph Engine — single entry point.
 *
 * Current Page → getRelatedPages() → resolveRelationships() → rankRelationships() → groups
 */

import { normalizePageContext } from "./pageContext.js";
import { getRelationshipsForPageFamily } from "./relationshipMatrix.js";
import { resolveRelationship } from "./resolveRelationships.js";
import { rankAndGroupRelationships, dedupeAcrossGroups } from "./rankRelationships.js";
import { getCachedLinkGroups } from "./cache.js";

/**
 * @param {import('./types.js').LinkGraphPageContext} rawContext
 * @param {object} [options]
 * @param {number} [options.maxGroups]
 * @param {number} [options.maxPerGroup]
 * @returns {import('./types.js').LinkGraphGroup[]}
 */
export function getRelatedPages(rawContext, options = {}) {
  const context = normalizePageContext(rawContext);

  return getCachedLinkGroups(context, options, () => {
    const relationshipTypes = getRelationshipsForPageFamily(context.pageFamily);
    /** @type {Record<string, import('./types.js').LinkGraphNode[]>} */
    const byType = {};

    for (const relationshipType of relationshipTypes) {
      byType[relationshipType] = resolveRelationship(context, relationshipType, options);
    }

    return dedupeAcrossGroups(
      rankAndGroupRelationships(byType, context, options),
      context.path
    );
  });
}

export {
  normalizePageContext,
  buildLandingPageContext,
  buildVehiclePageContext,
  buildGuidePageContext,
  buildComparePageContext,
  buildHomePageContext,
} from "./pageContext.js";

export {
  getRelationshipMatrixRows,
  LINK_RELATIONSHIP_MATRIX,
} from "./relationshipMatrix.js";

export { LINK_RELATIONSHIP_TYPES, LINK_PAGE_FAMILIES } from "./types.js";

export { __clearLinkGraphCacheForTests } from "./cache.js";
