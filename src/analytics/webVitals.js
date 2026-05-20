import { ANALYTICS_EVENTS } from "./events";
import { trackAnalytics } from "./track";

/**
 * Lightweight Core Web Vitals — no extra dependency.
 * Emits ANALYTICS_EVENTS.WEB_VITAL for LCP, CLS (on tab hide), and interaction delays
 * (event timing where supported — INP-style signal on supported browsers).
 */
export function initWebVitals() {
  if (
    typeof window === "undefined" ||
    !("PerformanceObserver" in window)
  ) {
    return;
  }

  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];

      if (!last) {
        return;
      }

      reportVital("LCP", last.startTime, {
        element: last.element?.tagName,
      });
    });

    lcpObserver.observe({
      type: "largest-contentful-paint",
      buffered: true,
    });
  } catch {
    /* unsupported */
  }

  try {
    let clsValue = 0;

    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
    });

    clsObserver.observe({ type: "layout-shift", buffered: true });

    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.visibilityState === "hidden") {
          reportVital("CLS", clsValue * 1000, {
            raw: clsValue,
          });
        }
      },
      { once: true }
    );
  } catch {
    /* unsupported */
  }

  try {
    const inpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const delay =
          entry.processingStart - entry.startTime;

        if (delay > 0) {
          reportVital("INP", delay, {
            interaction: entry.name,
          });
        }
      }
    });

    inpObserver.observe({
      type: "event",
      buffered: true,
      durationThreshold: 16,
    });
  } catch {
    /* INP may be unavailable — ignore */
  }
}

function reportVital(name, value, extra = {}) {
  trackAnalytics(
    ANALYTICS_EVENTS.WEB_VITAL,
    {
      metric_name: name,
      metric_value: Math.round(value),
      page_path: window.location.pathname,
      ...extra,
    },
    {
      dedupeKey: `${name}:${window.location.pathname}`,
    }
  );
}
