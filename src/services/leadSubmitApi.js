import { API_URL } from "../config";
import { buildLeadRoutingPlan } from "../utils/leadRouting";
import { isLeadTurnstileEnabled } from "../security/leadTurnstile";

function assertTurnstileToken(turnstileToken) {
  if (!isLeadTurnstileEnabled()) {
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const res = await fetch(`${API_URL}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({}));

    return {
      ok: res.ok,
      status: res.status,
      data,
      error: res.ok ? null : data?.message || `HTTP ${res.status}`,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export { assertTurnstileToken, isLeadTurnstileEnabled };
