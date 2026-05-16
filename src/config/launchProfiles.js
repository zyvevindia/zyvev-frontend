/**
 * Launch profile reference — actual flags remain env-driven.
 * Validate backend: node scripts/validate-launch-profile.js soft-launch
 */

export const LAUNCH_PROFILE = import.meta.env.VITE_LAUNCH_PROFILE || "";

export const LAUNCH_PROFILE_NOTES = {
  staging: "Minimal public surface; intelligence and tracking off",
  "soft-launch":
    "Catalog + static SEO JSON; behavioral API off; recommended first public cut",
  "public-beta": "Enable VITE_* flags per backend launchProfiles.js",
};
