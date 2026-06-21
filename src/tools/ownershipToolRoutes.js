/**
 * Ownership tool hub routes — placeholders until calculator phases ship.
 */

export const OWNERSHIP_TOOL_CARDS = [
  {
    id: "tco",
    path: "/tools/tco",
    title: "Total Cost of Ownership (TCO)",
    description:
      "Understand charging, maintenance, insurance and depreciation costs.",
  },
  {
    id: "cost-per-km",
    path: "/tools/cost-per-km",
    title: "Cost Per Km",
    description:
      "Estimate running cost based on usage and charging habits.",
  },
  {
    id: "savings-vs-petrol",
    path: "/tools/savings-vs-petrol",
    title: "Savings vs Petrol/Diesel",
    description: "Compare EV ownership with ICE vehicles.",
  },
  {
    id: "emi",
    path: "/tools/emi",
    title: "EMI Calculator",
    description: "Estimate EMI and total loan outflow.",
  },
];

export const OWNERSHIP_TOOL_BENEFITS = [
  {
    id: "smarter-decisions",
    title: "Make smarter decisions",
    description:
      "Compare EV ownership scenarios with clear numbers before you buy.",
  },
  {
    id: "real-costs",
    title: "Understand real ownership costs",
    description:
      "See beyond showroom price with charging, service, and running costs.",
  },
  {
    id: "plan-better",
    title: "Plan your EV ownership better",
    description:
      "Model monthly outflow and long-term savings for your driving pattern.",
  },
];

/**
 * @param {string} toolId
 * @returns {typeof OWNERSHIP_TOOL_CARDS[number]|undefined}
 */
export function getOwnershipToolById(toolId) {
  return OWNERSHIP_TOOL_CARDS.find((tool) => tool.id === toolId);
}
