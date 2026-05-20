/**
 * Cloudflare Turnstile — low-intent forms only.
 * https://developers.cloudflare.com/turnstile/
 */

const SCRIPT_ID = "evsavari-turnstile";

export function getTurnstileSiteKey() {
  return String(
    import.meta.env.VITE_TURNSTILE_SITE_KEY || ""
  ).trim();
}

export function isTurnstileConfigured() {
  return Boolean(getTurnstileSiteKey());
}

function loadTurnstileScript() {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("turnstile_unavailable")
    );
  }

  if (window.turnstile?.render) {
    return Promise.resolve(window.turnstile);
  }

  const existing = document.getElementById(SCRIPT_ID);

  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => {
        if (window.turnstile?.render) {
          resolve(window.turnstile);
        } else {
          reject(new Error("turnstile_not_ready"));
        }
      });
      existing.addEventListener("error", () => {
        reject(new Error("turnstile_script_failed"));
      });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.turnstile?.render) {
        resolve(window.turnstile);
      } else {
        reject(new Error("turnstile_not_ready"));
      }
    };

    script.onerror = () => {
      reject(new Error("turnstile_script_failed"));
    };

    document.head.appendChild(script);
  });
}

export async function ensureTurnstileReady() {
  return loadTurnstileScript();
}
