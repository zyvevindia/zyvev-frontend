export default function AssistantAnswerChips({
  options,
  selectedId,
  onSelect,
  name,
  label = "Answer options",
}) {
  return (
    <div
      className="assistant-chips"
      role="radiogroup"
      aria-label={label}
    >
      {options.map((option) => {
        const selected = selectedId === option.id;

        return (
          <button
            key={option.id}
            type="button"
            className={`assistant-chip${selected ? " assistant-chip--selected" : ""}`}
            role="radio"
            aria-checked={selected}
            name={name}
            onClick={() => onSelect(option)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
