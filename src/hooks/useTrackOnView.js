import { useEffect, useRef } from "react";

import { trackBuyerEvent } from "../event-tracking/trackBuyerEvent";

/**
 * Fire event once when element enters viewport.
 */
export default function useTrackOnView(
  eventType,
  payload,
  enabled = true
) {
  const ref = useRef(null);
  const fired = useRef(false);

  useEffect(() => {
    if (!enabled || !eventType || fired.current) return;

    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (fired.current) return;
        const entry = entries[0];
        if (entry?.isIntersecting) {
          fired.current = true;
          trackBuyerEvent(eventType, payload);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [eventType, enabled, payload]);

  return ref;
}
