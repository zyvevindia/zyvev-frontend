import RunningCostPage from "./RunningCostPage.jsx";
import { OWNERSHIP_QUESTION_TYPES } from "./ownershipQuestionRoutes.js";

export default function RunningCostQuestionPage() {
  return (
    <RunningCostPage questionType={OWNERSHIP_QUESTION_TYPES.HOW_MUCH_TO_RUN} />
  );
}
