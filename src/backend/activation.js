/**
 * Production-safe backend activation — no secret logging.
 */

import { isBackendPersistenceConfigured, validateBackendEnv } from "./config.js";
import { checkPersistenceConnection } from "./services/persistenceUtils.js";
import { touchSession } from "./services/sessionService.js";

let activationState = {
  attempted: false,
  activated: false,
  configured: false,
  reason: "idle",
};

/**
 * Initialize persistence layer once per page load.
 * Safe to call without env — returns immediately.
 */
export async function activateBackendPersistence(sessionKey) {
  if (activationState.attempted) {
    return { ...activationState };
  }
  activationState.attempted = true;

  const env = validateBackendEnv();
  activationState.configured = env.configured;

  if (!isBackendPersistenceConfigured()) {
    activationState.reason = "not_configured";
    return { ...activationState };
  }

  try {
    const connection = await checkPersistenceConnection();
    if (!connection.ok) {
      activationState.reason = "connection_unavailable";
      return { ...activationState };
    }

    if (sessionKey) {
      await touchSession({ sessionKey, source: "activation" });
    }

    activationState.activated = true;
    activationState.reason = "active";
  } catch {
    activationState.reason = "activation_failed";
  }

  return { ...activationState };
}

export function getBackendActivationState() {
  return { ...activationState };
}
