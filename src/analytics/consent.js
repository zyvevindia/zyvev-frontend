const STORAGE_KEY = "evsavari_analytics_consent_v1";

/**
 * Privacy-conscious consent gate.
 * Default: allowed in production soft launch unless REQUIRE_CONSENT is set.
 */
export function hasAnalyticsConsent() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw === "denied") {
      return false;
    }

    if (raw === "granted") {
      return true;
    }
  } catch {
    /* storage blocked */
  }

  return true;
}

export function setAnalyticsConsent(granted) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      granted ? "granted" : "denied"
    );
  } catch {
    /* ignore */
  }
}
