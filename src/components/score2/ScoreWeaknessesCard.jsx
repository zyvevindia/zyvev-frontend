import ScoreListCard from "./ScoreListCard.jsx";

export default function ScoreWeaknessesCard({ weaknesses = [], className = "" }) {
  return (
    <ScoreListCard
      title="Weaknesses"
      items={weaknesses}
      tone="neutral"
      className={className}
    />
  );
}
