/**
 * Authority depth audit — re-exports scoring from content/authority modules.
 */

export {
  CONCERN_COVERAGE_MAP,
  scoreConcernCoverage,
  scoreBeginnerConcernCompleteness,
  scoreAuthorityDepth,
  generateAuthorityDepthAuditReport,
  authorityDepthAuditMarkdown,
} from "../content/authority/depthScoring.js";
