import ScoreListCard from "./ScoreListCard.jsx";

export default function ScoreStrengthsCard({ strengths = [], className = "" }) {
  return (
    <ScoreListCard
      title="Strengths"
      items={strengths}
      tone="positive"
      className={className}
    />
  );
}
