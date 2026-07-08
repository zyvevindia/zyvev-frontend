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
 *
 * Callbacks are stored in refs so parent re-renders (e.g. form typing)
 * do not destroy and recreate the widget — that would invalidate tokens
 * while stale values remained in parent state.
 */
export default function TurnstileWidget({
  onToken,
  onExpire,
  onError,
  theme = "light",
  size = "normal",
  /** Increment to request a fresh challenge without remounting the widget. */
  resetKey = 0,
}) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [loadError, setLoadError] = useState("");

  const onTokenRef = useRef(onToken);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);
  onTokenRef.current = onToken;
  onExpireRef.current = onExpire;
  onErrorRef.current = onError;

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
              onTokenRef.current?.(token);
            },
            "expired-callback": () => {
              onExpireRef.current?.();
            },
            "error-callback": () => {
              onErrorRef.current?.(
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
          onErrorRef.current?.(err);
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
  }, [theme, size]);

  useEffect(() => {
    if (!isTurnstileConfigured()) {
      return;
    }
    if (resetKey === 0 || widgetIdRef.current == null) {
      return;
    }
    if (!window.turnstile?.reset) {
      return;
    }

    try {
      window.turnstile.reset(widgetIdRef.current);
    } catch {
      /* ignore */
    }
    onExpireRef.current?.();
  }, [resetKey]);

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
