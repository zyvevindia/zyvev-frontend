/**
 * EVSavari backend persistence layer — public entrypoint.
 * Gracefully degrades when Supabase env is not configured.
 */

export {
  BACKEND_CONFIG,
  isBackendPersistenceConfigured,
  validateBackendEnv,
  validateOperationalEnv,
  formatOperationalEnvErrors,
  isOperationalSupabaseAdminConfigured,
  maskSecret,
} from "./config.js";

export { getSupabaseClient, resetSupabaseClientForTests } from "./supabase/client.js";
export { PersistenceError, mapSupabaseError } from "./supabase/errors.js";

export { checkPersistenceConnection } from "./services/persistenceUtils.js";

export {
  insertCompareEvent,
  listRecentCompareEvents,
} from "./services/compareEventService.js";

export {
  insertTrustFeedback,
  listRecentTrustFeedback,
} from "./services/trustFeedbackService.js";

export { insertLead, listRecentLeads } from "./services/leadService.js";

export {
  insertOperationalSnapshot,
  listOperationalSnapshots,
} from "./services/operationalSnapshotService.js";

export {
  getSupabaseSession,
  ensureAdminProfile,
  signOutSupabase,
  isSupabaseAuthConfigured,
  normalizeRole,
} from "./services/authService.js";

export {
  upsertVehicle,
  upsertVehicleVariant,
  getVehicleBySlug,
  listActiveVehicles,
} from "./services/vehicleService.js";

export {
  upsertVehicleMedia,
  listVehicleMedia,
  buildMediaRoleMap,
} from "./services/vehicleMediaService.js";

export {
  createCatalogImport,
  updateCatalogImport,
  getCatalogImport,
  listCatalogImports,
  insertCatalogImportSnapshot,
  listImportSnapshots,
} from "./services/catalogImportService.js";

export {
  insertEvidenceRecords,
  deleteEvidenceRecordsForImport,
  listEvidenceRecords,
  replaceEvidenceRecords,
} from "./services/evidenceRecordService.js";

export {
  listCatalogSourceRegistry,
  upsertCatalogSourceRegistryEntry,
  markRegistryNeedsVerification,
} from "./services/catalogSourceRegistryService.js";

export { touchSession, getSessionByKey } from "./services/sessionService.js";

export {
  persistUsageLearningEvent,
  mirrorUsageLearningEvent,
} from "./services/persistenceMirror.js";

export {
  activateBackendPersistence,
  getBackendActivationState,
} from "./activation.js";

/**
 * Connection + optional write/read self-test (non-destructive when skipped).
 */
export async function runPersistenceSanityCheck() {
  const { isBackendPersistenceConfigured: configuredFn } = await import("./config.js");
  const configured = configuredFn();
  if (!configured) {
    return {
      ok: true,
      configured: false,
      connection: { ok: false, configured: false, reachable: false },
      writeSkipped: true,
      readSkipped: true,
      message: "Supabase not configured — persistence layer idle",
    };
  }

  const { checkPersistenceConnection } = await import("./services/persistenceUtils.js");
  const connection = await checkPersistenceConnection();

  return {
    ok: connection.ok,
    configured: true,
    connection,
    writeSkipped: !connection.ok,
    readSkipped: !connection.ok,
    message: connection.ok
      ? "Supabase reachable"
      : connection.message || "Connection check failed",
  };
}
