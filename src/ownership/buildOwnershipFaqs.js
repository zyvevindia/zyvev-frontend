import { buildReviewSlug, reviewPagePath } from "../reviews/reviewRoutes.js";
import { vehicleFamilyPath } from "../utils/vehicleRoutes.js";
import {
  OWNERSHIP_PAGE_TYPES,
  ownershipPagePath,
} from "../pages/ownership/ownershipRoutes.js";
import {
  formatOwnershipFaqQuestion,
  getOwnershipFaqQuestions,
} from "./ownershipFaqConstants.js";

/**
 * @typedef {"text"|"link"} OwnershipFaqSegmentType
 * @typedef {{ type: "text", value: string }} OwnershipFaqTextSegment
 * @typedef {{ type: "link", label: string, href: string }} OwnershipFaqLinkSegment
 * @typedef {OwnershipFaqTextSegment|OwnershipFaqLinkSegment} OwnershipFaqSegment
 * @typedef {{ id: string, question: string, answerText: string, answerSegments: OwnershipFaqSegment[] }} OwnershipFaqItem
 */

/**
 * @param {OwnershipFaqSegment[]} segments
 * @returns {string}
 */
export function flattenOwnershipFaqAnswer(segments) {
  return segments
    .map((segment) => {
      if (segment.type === "link") {
        return `${segment.label} (${segment.href})`;
      }
      return segment.value;
    })
    .join("");
}

/**
 * @param {OwnershipFaqSegment[]} segments
 * @returns {Array<{ question: string, answer: string }>}
 */
function toSchemaFaqItems(items) {
  return items.map((item) => ({
    question: item.question,
    answer: item.answerText,
  }));
}

/**
 * @param {{
 *   pageType: import("../pages/ownership/ownershipRoutes.js").OwnershipPageType,
 *   vehicleSlug: string,
 *   vehicleName: string,
 *   summaryText?: string,
 *   hasReview?: boolean,
 * }} params
 * @returns {OwnershipFaqItem[]}
 */
export function buildOwnershipFaqs({
  pageType,
  vehicleSlug,
  vehicleName,
  summaryText = "",
  hasReview = false,
}) {
  const questions = getOwnershipFaqQuestions(pageType);
  if (!questions.length || !vehicleSlug) return [];

  const name = vehicleName || "This EV";
  const vehiclePath = vehicleFamilyPath(vehicleSlug);
  const runningCostPath = ownershipPagePath(
    vehicleSlug,
    OWNERSHIP_PAGE_TYPES.RUNNING_COST
  );
  const tcoPath = ownershipPagePath(vehicleSlug, OWNERSHIP_PAGE_TYPES.TCO);
  const petrolSavingsPath = ownershipPagePath(
    vehicleSlug,
    OWNERSHIP_PAGE_TYPES.PETROL_SAVINGS
  );
  const emiPath = ownershipPagePath(vehicleSlug, OWNERSHIP_PAGE_TYPES.EMI);
  const reviewPath = reviewPagePath(buildReviewSlug(vehicleSlug));

  const links = {
    runningCost: { label: "running cost estimate", href: runningCostPath },
    ownershipCost: { label: "ownership cost estimate", href: tcoPath },
    petrolSavings: { label: "petrol savings comparison", href: petrolSavingsPath },
    emi: { label: "EMI estimate", href: emiPath },
    vehicle: { label: `${name} vehicle page`, href: vehiclePath },
    review: { label: `${name} review`, href: reviewPath },
  };

  /** @type {Record<string, OwnershipFaqSegment[]>} */
  const answerBuilders = {
    "cost-per-km": [
      {
        type: "text",
        value:
          summaryText ||
          `Use the calculator above to see a per-km estimate for ${name} with editable tariff and charging assumptions.`,
      },
      { type: "text", value: " See the " },
      links.runningCost,
      { type: "text", value: " or visit the " },
      links.vehicle,
      { type: "text", value: " for specs and pricing." },
    ],
    "running-cost-factors": [
      {
        type: "text",
        value:
          "Running cost depends on electricity tariff, home versus public charging share, and real-world efficiency (km per kWh).",
      },
      { type: "text", value: " Adjust these inputs on the " },
      links.runningCost,
      { type: "text", value: " to match your driving pattern." },
    ],
    "home-charging-cheaper": [
      {
        type: "text",
        value:
          "Home charging is usually cheaper per unit than public DC fast charging, so a higher home-charging share lowers your per-km cost.",
      },
      { type: "text", value: " Compare scenarios on the " },
      links.runningCost,
      { type: "text", value: "." },
    ],
    "public-charging-cost": [
      {
        type: "text",
        value:
          "Public charging rates vary by network and location. The calculator uses a typical public tariff alongside your home rate.",
      },
      { type: "text", value: " Update assumptions on the " },
      links.runningCost,
      { type: "text", value: " to reflect your local charging mix." },
    ],
    "ownership-cost": [
      {
        type: "text",
        value:
          summaryText ||
          `The ownership cost estimate above covers depreciation, charging, maintenance, and insurance for ${name} over a typical five-year horizon.`,
      },
      { type: "text", value: " Open the " },
      links.ownershipCost,
      { type: "text", value: " to change annual driving or ownership years." },
    ],
    "largest-cost-component": [
      {
        type: "text",
        value:
          "Depreciation is usually the largest share of five-year EV ownership cost, followed by charging and insurance.",
      },
      { type: "text", value: " See the breakdown on the " },
      links.ownershipCost,
      { type: "text", value: " and compare trims on the " },
      links.vehicle,
      { type: "text", value: "." },
    ],
    "depreciation-impact": [
      {
        type: "text",
        value:
          "Depreciation reduces resale value each year and is a major part of total ownership cost. Battery perception and model demand can affect used EV prices.",
      },
      { type: "text", value: " Model this on the " },
      links.ownershipCost,
      ...(hasReview
        ? [
            { type: "text", value: " and read the " },
            links.review,
            { type: "text", value: " for ownership context." },
          ]
        : [
            { type: "text", value: " and check the " },
            links.vehicle,
            { type: "text", value: " for variant pricing." },
          ]),
    ],
    "savings-amount": [
      {
        type: "text",
        value:
          summaryText ||
          `Savings versus an equivalent petrol car depend on your annual driving, fuel price, and charging mix for ${name}.`,
      },
      { type: "text", value: " Use the " },
      links.petrolSavings,
      { type: "text", value: " to match your assumptions." },
    ],
    "break-even": [
      {
        type: "text",
        value:
          "Break-even is the distance at which lower EV running costs offset a higher purchase price. It depends on annual km, petrol price, and how you charge.",
      },
      { type: "text", value: " Check the result on the " },
      links.petrolSavings,
      { type: "text", value: " after updating your inputs." },
    ],
    "ev-vs-petrol": [
      {
        type: "text",
        value:
          "An EV is often cheaper to run at higher annual mileage, but upfront price and charging access matter. Low yearly driving can favour petrol on total cost.",
      },
      { type: "text", value: " Compare on the " },
      links.petrolSavings,
      { type: "text", value: ", then review the " },
      links.vehicle,
      ...(hasReview
        ? [
            { type: "text", value: " and " },
            links.review,
            { type: "text", value: "." },
          ]
        : [{ type: "text", value: "." }]),
    ],
    "estimated-emi": [
      {
        type: "text",
        value:
          summaryText ||
          `The EMI calculator above estimates monthly loan payment for ${name} using default down payment, interest, and tenure.`,
      },
      { type: "text", value: " Refine figures on the " },
      links.emi,
      { type: "text", value: "." },
    ],
    "reduce-emi": [
      {
        type: "text",
        value:
          "You can lower EMI with a longer loan tenure, a lower interest rate, or a larger down payment.",
      },
      { type: "text", value: " Try different terms on the " },
      links.emi,
      { type: "text", value: " and pair with the " },
      links.ownershipCost,
      { type: "text", value: " for full ownership outflow." },
    ],
    "down-payment": [
      {
        type: "text",
        value:
          "A higher down payment reduces the loan principal, which lowers monthly EMI and total interest paid.",
      },
      { type: "text", value: " Adjust down payment on the " },
      links.emi,
      { type: "text", value: " to see the impact instantly." },
    ],
  };

  return questions.map((template) => {
    const segments = answerBuilders[template.id] || [
      {
        type: "text",
        value: `See ownership estimates for ${name} on this page.`,
      },
    ];

    return {
      id: template.id,
      question: formatOwnershipFaqQuestion(template.question, name),
      answerSegments: segments,
      answerText: flattenOwnershipFaqAnswer(segments),
    };
  });
}

/**
 * Schema-friendly FAQ items for the current ownership page.
 * @param {Parameters<typeof buildOwnershipFaqs>[0]} params
 * @returns {Array<{ question: string, answer: string }>}
 */
export function buildOwnershipFaqSchemaItems(params) {
  return toSchemaFaqItems(buildOwnershipFaqs(params));
}
