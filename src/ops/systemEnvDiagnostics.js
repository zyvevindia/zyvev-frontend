/** Re-exports — prefer `src/utils/systemStatus.js`. */
export {
  API_HEALTH_LABELS,
  classifyApiHealthState,
  collectBuildInfo,
  collectDeploymentDiagnostics,
  collectRuntimeEnvRows,
  runSystemHealthProbe,
} from "../utils/systemStatus.js";
