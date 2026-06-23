import ScoreListCard from "./ScoreListCard.jsx";

export default function ScoreBestForCard({ bestFor = [], className = "" }) {
  return (
    <ScoreListCard
      title="Best for"
      items={bestFor}
      className={className}
    />
  );
}
