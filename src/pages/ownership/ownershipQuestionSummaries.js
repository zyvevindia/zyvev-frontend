import { formatCostPerKmRate } from "../../tools/costPerKmCalculator.js";
import { formatTcoLakh } from "../../tools/tcoCalculator.js";
import { buildOwnershipSummaryText } from "./ownershipPageSummaries.js";
import { resolveOwnershipPageTypeFromQuestion } from "./ownershipQuestionRoutes.js";

/**
 * @param {import("./ownershipQuestionRoutes.js").OwnershipQuestionType} questionType
 * @param {string} vehicleName
 * @param {object} values
 * @returns {string}
 */
export function buildOwnershipQuestionShortAnswer(
  questionType,
  vehicleName,
  values = {}
) {
  const pageType = resolveOwnershipPageTypeFromQuestion(questionType);
  if (!pageType) return "";
  return buildOwnershipSummaryText(pageType, vehicleName, values);
}

/**
 * @param {import("./ownershipQuestionRoutes.js").OwnershipQuestionType} questionType
 * @param {object} values
 * @returns {string}
 */
export function formatOwnershipQuestionQuickAnswer(questionType, values = {}) {
  switch (questionType) {
    case "how-much-does-it-cost-to-run":
      return formatCostPerKmRate(values.costPerKm || 0);
    case "ownership-cost":
      return formatTcoLakh(values.totalOwnershipCostInr || 0);
    case "how-much-can-you-save": {
      const savings = values.savingsInr || 0;
      const label = formatTcoLakh(Math.abs(savings));
      return savings < 0 ? `-${label}` : label;
    }
    case "emi-calculator": {
      const emi = Math.round(values.emiInr || 0);
      return emi > 0
        ? `₹${emi.toLocaleString("en-IN")}/month`
        : "—";
    }
    default:
      return "—";
  }
}
