import OwnershipCostPage from "./OwnershipCostPage.jsx";
import { OWNERSHIP_QUESTION_TYPES } from "./ownershipQuestionRoutes.js";

export default function OwnershipCostQuestionPage() {
  return (
    <OwnershipCostPage questionType={OWNERSHIP_QUESTION_TYPES.OWNERSHIP_COST} />
  );
}
