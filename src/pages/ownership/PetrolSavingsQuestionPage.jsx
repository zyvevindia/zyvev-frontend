import PetrolSavingsOwnershipPage from "./PetrolSavingsOwnershipPage.jsx";
import { OWNERSHIP_QUESTION_TYPES } from "./ownershipQuestionRoutes.js";

export default function PetrolSavingsQuestionPage() {
  return (
    <PetrolSavingsOwnershipPage
      questionType={OWNERSHIP_QUESTION_TYPES.HOW_MUCH_SAVE}
    />
  );
}
