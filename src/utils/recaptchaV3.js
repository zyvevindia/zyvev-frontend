/**
 * Google reCAPTCHA v3 — invisible score-based verification for lead forms.
 * Set VITE_RECAPTCHA_SITE_KEY in env. Backend must verify with RECAPTCHA_SECRET_KEY.
 */

const SCRIPT_ID = "evsavari-recaptcha-v3";

let loadPromise = null;

export function getRecaptchaSiteKey() {
  return String(
    import.meta.env.VITE_RECAPTCHA_SITE_KEY || ""
  ).trim();
}

export function isRecaptchaConfigured() {
  return Boolean(getRecaptchaSiteKey());
}

/**
 * @returns {Promise<typeof window.grecaptcha | null>}
 */
export function loadRecaptchaV3() {
  const siteKey = getRecaptchaSiteKey();

  if (!siteKey) {
    return Promise.resolve(null);
  }

  if (
    typeof window !== "undefined" &&
    window.grecaptcha?.execute
  ) {
    return Promise.resolve(window.grecaptcha);
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("recaptcha_unavailable"));
      return;
    }

    const existing = document.getElementById(
      SCRIPT_ID
    );

    if (existing) {
      existing.addEventListener("load", () => {
        window.grecaptcha.ready(() =>
          resolve(window.grecaptcha)
        );
      });
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      window.grecaptcha.ready(() =>
        resolve(window.grecaptcha)
      );
    };

    script.onerror = () => {
      loadPromise = null;
      reject(new Error("recaptcha_script_failed"));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * @param {string} [action='lead_submit']
 * @returns {Promise<string|null>} token or null when not configured
 */
export async function getRecaptchaToken(
  action = "lead_submit"
) {
  const siteKey = getRecaptchaSiteKey();

  if (!siteKey) {
    return null;
  }

  const grecaptcha = await loadRecaptchaV3();

  if (!grecaptcha?.execute) {
    throw new Error("recaptcha_not_ready");
  }

  return grecaptcha.execute(siteKey, { action });
}
