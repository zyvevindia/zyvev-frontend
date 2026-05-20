import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ensureTurnstileReady,
  getTurnstileSiteKey,
  isTurnstileConfigured,
} from "../../utils/turnstile";

/**
 * Cloudflare Turnstile widget (managed / non-intrusive).
 * Calls onToken(token) when solved; onExpire when token expires.
 */
export default function TurnstileWidget({
  onToken,
  onExpire,
  onError,
  theme = "light",
  size = "normal",
}) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!isTurnstileConfigured()) {
      return undefined;
    }

    let cancelled = false;

    async function mount() {
      try {
        const turnstile = await ensureTurnstileReady();

        if (cancelled || !containerRef.current) {
          return;
        }

        if (widgetIdRef.current != null) {
          try {
            turnstile.remove(widgetIdRef.current);
          } catch {
            /* ignore */
          }
        }

        widgetIdRef.current = turnstile.render(
          containerRef.current,
          {
            sitekey: getTurnstileSiteKey(),
            theme,
            size,
            callback: (token) => {
              onToken?.(token);
            },
            "expired-callback": () => {
              onExpire?.();
            },
            "error-callback": () => {
              onError?.(
                new Error("turnstile_challenge_failed")
              );
            },
          }
        );
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err?.message || "Security check unavailable"
          );
          onError?.(err);
        }
      }
    }

    mount();

    return () => {
      cancelled = true;

      if (
        widgetIdRef.current != null &&
        window.turnstile?.remove
      ) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* ignore */
        }
      }

      widgetIdRef.current = null;
    };
  }, [onToken, onExpire, onError, theme, size]);

  if (!isTurnstileConfigured()) {
    return null;
  }

  if (loadError) {
    return (
      <p
        style={{
          fontSize: "0.85rem",
          color: "#b45309",
          margin: "0.5rem 0 0",
        }}
        role="alert"
      >
        Security check could not load. Refresh the page and
        try again.
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ marginTop: "0.75rem", minHeight: "65px" }}
      aria-label="Security verification"
    />
  );
}
