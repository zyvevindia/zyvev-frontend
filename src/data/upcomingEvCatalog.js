import { LOCAL_FALLBACK_EV } from "../utils/imageUtils";

/** Placeholder upcoming launches shown when catalog has no upcoming-status families. */
export const UPCOMING_EV_CATALOG = Object.freeze([
  {
    _id: "u1",
    name: "Tata Sierra EV",
    image: LOCAL_FALLBACK_EV,
    launchDate: "October 2025",
    price: 2500000,
  },
  {
    _id: "u2",
    name: "Mahindra BE.05",
    image: LOCAL_FALLBACK_EV,
    launchDate: "December 2025",
    price: 2700000,
  },
  {
    _id: "u3",
    name: "Maruti eVX",
    image: LOCAL_FALLBACK_EV,
    launchDate: "January 2026",
    price: 2200000,
  },
]);
