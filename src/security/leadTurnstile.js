import { isTurnstileConfigured } from "../utils/turnstile";

/**
 * Sprint 1: lead enquiry Turnstile is opt-in via VITE_LEAD_TURNSTILE_ENABLED=true.
 * Low-intent forms (contact, newsletter, feedback) still use isTurnstileConfigured().
 */
export function isLeadTurnstileEnabled() {
  return (
    isTurnstileConfigured() &&
    import.meta.env.VITE_LEAD_TURNSTILE_ENABLED === "true"
  );
}
