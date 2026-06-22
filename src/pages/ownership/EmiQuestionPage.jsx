import EmiOwnershipPage from "./EmiOwnershipPage.jsx";
import { OWNERSHIP_QUESTION_TYPES } from "./ownershipQuestionRoutes.js";

export default function EmiQuestionPage() {
  return (
    <EmiOwnershipPage questionType={OWNERSHIP_QUESTION_TYPES.EMI_CALCULATOR} />
  );
}
