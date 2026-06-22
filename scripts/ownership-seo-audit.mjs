import "./lib/bootstrapEnv.mjs";

import {
  auditOwnershipSeo,
  formatOwnershipSeoAuditReport,
} from "../src/ownership/ownershipSeoAudit.js";

const report = auditOwnershipSeo();
console.log(formatOwnershipSeoAuditReport(report));
process.exit(report.passed ? 0 : 1);
