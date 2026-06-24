export default function AssistantProgress({ currentStep, totalSteps }) {
  const safeTotal = Math.max(totalSteps, 1);
  const safeCurrent = Math.min(Math.max(currentStep, 0), safeTotal);
  const percent = Math.round((safeCurrent / safeTotal) * 100);

  return (
    <div className="assistant-progress" aria-label={`Step ${safeCurrent} of ${safeTotal}`}>
      <div className="assistant-progress__meta">
        <span className="assistant-progress__label">
          Step {safeCurrent} of {safeTotal}
        </span>
        <span className="assistant-progress__percent">{percent}%</span>
      </div>
      <div
        className="assistant-progress__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div
          className="assistant-progress__fill"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
