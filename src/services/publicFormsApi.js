import { API_URL } from "../config";
import { isTurnstileConfigured } from "../utils/turnstile";

async function postLowIntentForm(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      data.message ||
      data.error ||
      "Unable to submit. Please try again.";
    const err = new Error(message);
    err.status = res.status;
    err.errors = data.errors;
    throw err;
  }

  return data;
}

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

export async function submitContactForm({
  name,
  email,
  phone,
  subject,
  message,
  turnstileToken,
}) {
  assertTurnstileToken(turnstileToken);

  return postLowIntentForm("/api/contact", {
    name,
    email,
    phone,
    subject,
    message,
    turnstileToken,
  });
}

export async function subscribeNewsletter({
  email,
  source = "footer",
  turnstileToken,
}) {
  assertTurnstileToken(turnstileToken);

  return postLowIntentForm("/api/newsletter", {
    email,
    source,
    turnstileToken,
  });
}
