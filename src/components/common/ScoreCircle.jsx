/**
 * SVG progress ring for EVSavari scores (0–100).
 * Arc starts at 12 o'clock and fills clockwise.
 */

const TRACK_COLOR = "#e8f5e9";
const PROGRESS_COLOR = "#15803d";

export default function ScoreCircle({
  score,
  size = 88,
  className = "",
  valueClassName = "score-circle__value",
  suffixClassName = "score-circle__suffix",
}) {
  const normalizedScore = Math.max(
    0,
    Math.min(Number(score) || 0, 100)
  );
  const displayScore = Math.round(normalizedScore);

  const radius = 42;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const progressOffset =
    circumference - (normalizedScore / 100) * circumference;

  const rootClass = ["score-circle", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={rootClass}
      style={{
        width: size,
        height: size,
        position: "relative",
        flexShrink: 0,
      }}
      role="img"
      aria-label={`EVSavari score ${displayScore} out of 100`}
    >
      <svg
        className="score-circle__svg"
        viewBox="0 0 100 100"
        width={size}
        height={size}
        aria-hidden
      >
        <circle
          className="score-circle__track"
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={TRACK_COLOR}
          strokeWidth={strokeWidth}
        />
        <circle
          className="score-circle__progress"
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={PROGRESS_COLOR}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="score-circle__label">
        <span className={valueClassName}>{displayScore}</span>
        <span className={suffixClassName}>/100</span>
      </div>
    </div>
  );
}
