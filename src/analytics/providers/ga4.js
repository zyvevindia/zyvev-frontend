import { analyticsConfig, isGa4Configured, isGtmConfigured } from "../config";
import { gtmEvent } from "./gtm";

let initialized = false;

export function initGa4() {
  if (
    typeof window === "undefined" ||
    !isGa4Configured() ||
    initialized
  ) {
    return;
  }

  if (window.__EVSAVARI_GA_INIT__) {
    initialized = true;
    return;
  }

  window.__EVSAVARI_GA_INIT__ = true;
  initialized = true;

  const gaId = analyticsConfig.gaId;

  window.dataLayer = window.dataLayer || [];

  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
  document.head.appendChild(script);

  window.gtag("js", new Date());
  window.gtag("config", gaId, {
    send_page_view: false,
    anonymize_ip: true,
  });
}

export function ga4PageView(path, title) {
  const payload = {
    page_path: path,
    page_title: title || document.title,
  };

  if (isGtmConfigured()) {
    gtmEvent("page_view", payload);
    return;
  }

  if (!window.gtag || !isGa4Configured()) {
    return;
  }

  window.gtag("event", "page_view", payload);
}

export function ga4Event(eventName, params = {}) {
  if (isGtmConfigured()) {
    gtmEvent(eventName, params);
    return;
  }

  if (!window.gtag || !isGa4Configured()) {
    return;
  }

  window.gtag("event", eventName, params);
}
