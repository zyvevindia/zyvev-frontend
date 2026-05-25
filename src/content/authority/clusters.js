/**
 * Authority content clusters — Track B architecture.
 */

import { AUTHORITY_CLUSTER_ID } from "./metadata.js";

export const AUTHORITY_CLUSTERS = Object.freeze([
  {
    id: AUTHORITY_CLUSTER_ID.BEGINNER_EDUCATION,
    label: "Beginner EV Education",
    description:
      "Calm, India-focused explainers for first-time EV buyers — no hype or fabricated savings.",
    primaryRoutes: ["/discover/under-15-lakh", "/guides", "/ownership-guides/first-time-buyers"],
    compareSupportRole: "Reduces anxiety before compare; links to running cost and charging basics.",
    seoPriority: "p0",
  },
  {
    id: AUTHORITY_CLUSTER_ID.CHARGING_GUIDES,
    label: "Charging Guides",
    description:
      "Practical charging setup, costs, safety, and myth-busting for Indian homes and apartments.",
    primaryRoutes: [
      "/charging-guides/home-charging",
      "/charging-guides/low-stress",
      "/discover/apartment-living",
    ],
    compareSupportRole: "Supports apartment vs home charging decisions during compare.",
    seoPriority: "p0",
  },
  {
    id: AUTHORITY_CLUSTER_ID.EV_MYTHS,
    label: "EV Myths vs Reality",
    description:
      "Calm myth-busting for batteries, rain, fire, highways, apartments, maintenance, and resale.",
    primaryRoutes: ["/ownership-guides/ev-myths"],
    compareSupportRole: "Reduces fear-driven compare abandonment.",
    seoPriority: "p0",
  },
  {
    id: AUTHORITY_CLUSTER_ID.OWNERSHIP_EXPLAINERS,
    label: "Ownership Explainers",
    description:
      "Realistic ownership: TCO, maintenance, highway use, family fit — aligned with catalog intelligence.",
    primaryRoutes: [
      "/ownership-guides/running-cost",
      "/ownership-guides/society-rwa",
      "/ownership-guides/highway-ownership",
    ],
    compareSupportRole: "Grounds compare outcomes in long-term ownership, not spec sheets alone.",
    seoPriority: "p0",
  },
]);

export function getAuthorityCluster(id) {
  return AUTHORITY_CLUSTERS.find((c) => c.id === id) || null;
}
