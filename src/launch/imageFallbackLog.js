/**
 * Logs image fallback chain usage in development only.
 */

import { devWarn } from "./devDiagnostics";

const logged = new Set();

export function logImageFallback({
  role = "listing",
  failedUrl = "",
  fallbackUrl = "",
  slug = "",
} = {}) {
  if (!import.meta.env.DEV) return;

  const key = `${slug}|${role}|${failedUrl}`;
  if (logged.has(key)) return;
  logged.add(key);

  devWarn("Image fallback activated", {
    slug: slug || "(unknown)",
    role,
    failedUrl: failedUrl || "(empty)",
    fallbackUrl: fallbackUrl || "(local)",
  });
}
