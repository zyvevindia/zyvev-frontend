/**
 * Launch profile reference — actual flags remain env-driven.
 * Validate backend: node scripts/validate-launch-profile.js soft-launch
 */

export const LAUNCH_PROFILE = import.meta.env.VITE_LAUNCH_PROFILE || "";

/** Optional one-line acknowledgment shown under the launch banner (controlled beta). */
export const LAUNCH_ACK_LINE =
  (import.meta.env.VITE_LAUNCH_ACK_LINE || "").trim();

/** Optional known limitation (short, operational — not a legal wall). */
export const LAUNCH_KNOWN_LIMITATION =
  (import.meta.env.VITE_LAUNCH_KNOWN_LIMITATION || "").trim();

/** Optional maintenance / deploy notice (single line). */
export const MAINTENANCE_NOTE =
  (import.meta.env.VITE_MAINTENANCE_NOTE || "").trim();

/** Internal-only tag for screenshots / QA (shown small, only when set). */
export const INTERNAL_BETA_TAG =
  (import.meta.env.VITE_INTERNAL_BETA_TAG || "").trim();

/** Shown after successful issue report (optional, short). */
export const BETA_FEEDBACK_ACK_LINE =
  (import.meta.env.VITE_BETA_FEEDBACK_ACK_LINE || "").trim();

/** Optional release / trust-update line under launch banner. */
export const OPS_RELEASE_SUMMARY =
  (import.meta.env.VITE_OPS_RELEASE_SUMMARY || "").trim();

/** Optional known-issue line (ops transparency, keep concise). */
export const OPS_KNOWN_ISSUES =
  (import.meta.env.VITE_OPS_KNOWN_ISSUES || "").trim();

export const LAUNCH_PROFILE_NOTES = {
  staging: "Minimal public surface; intelligence and tracking off",
  "soft-launch":
    "Catalog + static SEO JSON; behavioral API off; recommended first public cut",
  "public-beta": "Enable VITE_* flags per backend launchProfiles.js",
};
