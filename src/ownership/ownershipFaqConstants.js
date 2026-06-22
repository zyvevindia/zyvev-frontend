/** @typedef {"running-cost"|"tco"|"petrol-savings"|"emi"} OwnershipFaqCategory */

/** @typedef {{ id: string, question: string }} OwnershipFaqQuestionTemplate */

/** @type {Record<OwnershipFaqCategory, { label: string, questions: OwnershipFaqQuestionTemplate[] }>} */
export const OWNERSHIP_FAQ_CATEGORIES = Object.freeze({
  "running-cost": {
    label: "Running Cost",
    questions: [
      {
        id: "cost-per-km",
        question: "How much does {vehicle} cost per km?",
      },
      {
        id: "running-cost-factors",
        question: "What affects EV running cost?",
      },
      {
        id: "home-charging-cheaper",
        question: "Is home charging cheaper?",
      },
      {
        id: "public-charging-cost",
        question: "How much does public charging cost?",
      },
    ],
  },
  tco: {
    label: "TCO",
    questions: [
      {
        id: "ownership-cost",
        question: "What is the ownership cost of {vehicle}?",
      },
      {
        id: "largest-cost-component",
        question: "Which component contributes most to ownership cost?",
      },
      {
        id: "depreciation-impact",
        question: "How does depreciation affect EV ownership?",
      },
    ],
  },
  "petrol-savings": {
    label: "Petrol Savings",
    questions: [
      {
        id: "savings-amount",
        question: "How much money can I save?",
      },
      {
        id: "break-even",
        question: "When does the EV break even?",
      },
      {
        id: "ev-vs-petrol",
        question: "Is an EV cheaper than petrol?",
      },
    ],
  },
  emi: {
    label: "EMI",
    questions: [
      {
        id: "estimated-emi",
        question: "What is the estimated EMI?",
      },
      {
        id: "reduce-emi",
        question: "How can I reduce EMI?",
      },
      {
        id: "down-payment",
        question: "Does higher down payment help?",
      },
    ],
  },
});

/** @type {OwnershipFaqCategory[]} */
export const OWNERSHIP_FAQ_CATEGORY_LIST = Object.freeze([
  "running-cost",
  "tco",
  "petrol-savings",
  "emi",
]);

/**
 * @param {OwnershipFaqCategory} category
 * @returns {OwnershipFaqQuestionTemplate[]}
 */
export function getOwnershipFaqQuestions(category) {
  return OWNERSHIP_FAQ_CATEGORIES[category]?.questions || [];
}

/**
 * @param {string} template
 * @param {string} vehicleName
 * @returns {string}
 */
export function formatOwnershipFaqQuestion(template, vehicleName) {
  const name = vehicleName || "this EV";
  return String(template).replace(/\{vehicle\}/g, name);
}
