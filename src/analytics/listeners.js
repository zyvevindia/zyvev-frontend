/**
 * Global analytics listeners — delegated DOM events without modifying page components.
 */
import { trackAnalytics } from "./track.js";
import { ANALYTICS_EVENTS } from "./events.js";
import { EVENT_CATEGORIES } from "./categories.js";

const INTERNAL_LINK_SELECTORS = [
  ".landing-internal-links a[href]",
  ".compare-internal-links a[href]",
  ".seo-related-links__link[href]",
].join(",");

let bound = false;

export function setupAnalyticsListeners() {
  if (typeof window === "undefined" || bound) {
    return;
  }

  bound = true;

  document.addEventListener(
    "click",
    (event) => {
      const anchor = event.target?.closest?.("a[href]");
      if (!anchor || !anchor.matches(INTERNAL_LINK_SELECTORS)) {
        return;
      }

      const href = anchor.getAttribute("href") || "";
      if (!href.startsWith("/") || href.startsWith("//")) {
        return;
      }

      trackAnalytics(
        ANALYTICS_EVENTS.INTERNAL_LINK_CLICKED,
        {
          link_href: href,
          link_text: (anchor.textContent || "").trim().slice(0, 120),
          source_page: window.location.pathname,
          link_domain: anchor.closest(".landing-internal-links")
            ? "landing"
            : anchor.closest(".compare-internal-links")
              ? "compare"
              : "guide",
          event_category: EVENT_CATEGORIES.ENGAGEMENT,
        },
        { dedupeKey: `${window.location.pathname}:${href}` }
      );
    },
    { capture: true }
  );
}
