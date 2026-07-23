/**
 * Meta (Facebook) Pixel — future provider stub.
 * Activated only when VITE_META_PIXEL_ID is set.
 */
import { analyticsConfig, isMetaPixelConfigured } from "../config.js";

let initialized = false;

export function initMetaPixel() {
  if (typeof window === "undefined" || !isMetaPixelConfigured() || initialized) {
    return;
  }

  if (window.__EVSAVARI_META_INIT__) {
    initialized = true;
    return;
  }

  window.__EVSAVARI_META_INIT__ = true;
  initialized = true;

  /* eslint-disable no-unused-expressions */
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function fbqStub() {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(
    window,
    document,
    "script",
    "https://connect.facebook.net/en_US/fbevents.js"
  );

  window.fbq("init", analyticsConfig.metaPixelId);
  window.fbq("track", "PageView");

  if (analyticsConfig.debug) {
    console.info("[analytics] Meta Pixel initialized");
  }
}

export function metaEvent(eventName, params = {}) {
  if (!isMetaPixelConfigured() || typeof window.fbq !== "function") {
    return;
  }

  window.fbq("trackCustom", eventName, params);
}
