import {
  OWNERSHIP_PAGE_TYPES,
  ownershipPagePath,
} from "./ownershipRoutes.js";

/** @typedef {{ label: string, href: string }} OwnershipHubExampleLink */

/** @typedef {{ id: string, title: string, description: string, toolPath: string, toolLabel: string, exampleLinks: OwnershipHubExampleLink[] }} OwnershipHubSection */

export const OWNERSHIP_HUB_PATH = "/ownership";
export const OWNERSHIP_VEHICLE_INDEX_PATH = "/ownership/vehicles";

/** @type {OwnershipHubSection[]} */
export const OWNERSHIP_HUB_SECTIONS = Object.freeze([
  {
    id: "running-cost",
    title: "Running Cost",
    description:
      "See what an EV costs per kilometre with home and public charging assumptions you can edit.",
    toolPath: "/tools/cost-per-km",
    toolLabel: "Open cost per km calculator",
    exampleLinks: [
      {
        label: "Tata Nexon EV running cost",
        href: ownershipPagePath("tata-nexon-ev", OWNERSHIP_PAGE_TYPES.RUNNING_COST),
      },
      {
        label: "BYD Seal running cost",
        href: ownershipPagePath("byd-seal", OWNERSHIP_PAGE_TYPES.RUNNING_COST),
      },
    ],
  },
  {
    id: "tco",
    title: "Ownership Cost",
    description:
      "Estimate five-year ownership cost including depreciation, charging, maintenance, and insurance.",
    toolPath: "/tools/tco",
    toolLabel: "Open ownership cost calculator",
    exampleLinks: [
      {
        label: "Tata Nexon EV ownership cost",
        href: ownershipPagePath("tata-nexon-ev", OWNERSHIP_PAGE_TYPES.TCO),
      },
      {
        label: "Mahindra BE 6 ownership cost",
        href: ownershipPagePath("mahindra-be-6", OWNERSHIP_PAGE_TYPES.TCO),
      },
    ],
  },
  {
    id: "petrol-savings",
    title: "Petrol Savings",
    description:
      "Compare lifetime EV ownership cost against an equivalent petrol car at your driving pattern.",
    toolPath: "/tools/savings-vs-petrol",
    toolLabel: "Open petrol savings calculator",
    exampleLinks: [
      {
        label: "Tata Nexon EV petrol savings",
        href: ownershipPagePath(
          "tata-nexon-ev",
          OWNERSHIP_PAGE_TYPES.PETROL_SAVINGS
        ),
      },
      {
        label: "MG Comet EV petrol savings",
        href: ownershipPagePath("mg-comet-ev", OWNERSHIP_PAGE_TYPES.PETROL_SAVINGS),
      },
    ],
  },
  {
    id: "emi",
    title: "EMI Calculator",
    description:
      "Estimate monthly loan EMI and total finance outflow before you shortlist an EV.",
    toolPath: "/tools/emi",
    toolLabel: "Open EMI calculator",
    exampleLinks: [
      {
        label: "Tata Nexon EV EMI",
        href: ownershipPagePath("tata-nexon-ev", OWNERSHIP_PAGE_TYPES.EMI),
      },
      {
        label: "BYD Seal EMI",
        href: ownershipPagePath("byd-seal", OWNERSHIP_PAGE_TYPES.EMI),
      },
    ],
  },
]);
