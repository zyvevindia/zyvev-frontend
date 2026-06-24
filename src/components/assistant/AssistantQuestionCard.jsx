import AssistantAnswerChips from "./AssistantAnswerChips.jsx";

export default function AssistantQuestionCard({
  question,
  selectedOptionId,
  onSelect,
}) {
  if (!question) {
    return null;
  }

  return (
    <section className="assistant-card assistant-question-card" aria-live="polite">
      <p className="assistant-card__eyebrow">Buyer Assistant</p>
      <h2 className="assistant-card__title">{question.prompt}</h2>
      <AssistantAnswerChips
        name={question.id}
        options={question.options}
        selectedId={selectedOptionId}
        onSelect={onSelect}
      />
    </section>
  );
}
