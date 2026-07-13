import { lazy } from "react";

import { LANDING_SECTION_IDS } from "../types.js";

import HeroSection from "./HeroSection.jsx";
import IntroSection from "./IntroSection.jsx";
import CtaSection from "./CtaSection.jsx";

const VehicleGridSection = lazy(() => import("./VehicleGridSection.jsx"));
const BuyingGuideSection = lazy(() => import("./BuyingGuideSection.jsx"));
const FaqSection = lazy(() => import("./FaqSection.jsx"));
const InternalLinksSection = lazy(() => import("./InternalLinksSection.jsx"));

/**
 * Section registry — add new section types here without modifying LandingPage.jsx.
 * @type {Record<string, React.ComponentType<any>>}
 */
export const LANDING_SECTION_COMPONENTS = Object.freeze({
  [LANDING_SECTION_IDS.HERO]: HeroSection,
  [LANDING_SECTION_IDS.INTRO]: IntroSection,
  [LANDING_SECTION_IDS.VEHICLE_GRID]: VehicleGridSection,
  [LANDING_SECTION_IDS.BUYING_GUIDE]: BuyingGuideSection,
  [LANDING_SECTION_IDS.FAQ]: FaqSection,
  [LANDING_SECTION_IDS.INTERNAL_LINKS]: InternalLinksSection,
  [LANDING_SECTION_IDS.CTA]: CtaSection,
});

/** Future extension slots — register before content sprints */
export const LANDING_SECTION_EXTENSION_SLOTS = Object.freeze([
  LANDING_SECTION_IDS.NEWS,
  LANDING_SECTION_IDS.VIDEOS,
  LANDING_SECTION_IDS.CHARGING,
  LANDING_SECTION_IDS.OWNERSHIP,
  LANDING_SECTION_IDS.DEALER_CTA,
  LANDING_SECTION_IDS.AI_SUMMARY,
  LANDING_SECTION_IDS.EDITORIAL,
]);

/**
 * @type {Map<string, React.LazyExoticComponent<React.ComponentType<any>>|React.ComponentType<any>>}
 */
const extensionRegistry = new Map();

export function registerLandingSectionComponent(sectionId, component) {
  extensionRegistry.set(sectionId, component);
}

export function resolveLandingSectionComponent(sectionId) {
  return extensionRegistry.get(sectionId) || LANDING_SECTION_COMPONENTS[sectionId] || null;
}

export function isLazySectionComponent(Component) {
  return Component?.$$typeof === Symbol.for("react.lazy");
}
