import { API_URL } from "../config";
import { safeFetchJson } from "../utils/safeFetch";
import { buildLeadRoutingPlan } from "../utils/leadRouting";
import { isTurnstileConfigured } from "../utils/turnstile";

function assertTurnstileToken(turnstileToken) {
  if (!isTurnstileConfigured()) {
    return;
  }

  if (!turnstileToken) {
    throw new Error(
      "Please complete the security check before submitting."
    );
  }
}

/**
 * Submit buyer lead to production API.
 * @param {object} payload
 * @param {string} [turnstileToken]
 */
export async function submitBuyerLead(payload, turnstileToken = "") {
  assertTurnstileToken(turnstileToken);

  const routing = buildLeadRoutingPlan({
    city: payload.city,
    state: payload.state,
    familySlug: payload.familySlug,
    brand: payload.brand,
    vehicleName: payload.vehicleName,
  });

  const body = {
    ...payload,
    leadStatus: routing.plan.leadStatusTag,
    assignedDealerId: routing.plan.dealerId,
    leadMetadata: {
      ...(payload.leadMetadata || {}),
      routing: routing.plan,
      routingLog: routing.log,
    },
  };

  if (turnstileToken) {
    body.turnstileToken = turnstileToken;
  }

  return safeFetchJson(`${API_URL}/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    timeoutMs: 20000,
    label: "lead_submit",
    body: JSON.stringify(body),
  });
}

export { assertTurnstileToken, isTurnstileConfigured };
