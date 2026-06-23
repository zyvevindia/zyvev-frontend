import ScoreListCard from "./ScoreListCard.jsx";

export default function ScoreAvoidIfCard({ avoidIf = [], className = "" }) {
  return (
    <ScoreListCard
      title="Avoid if"
      items={avoidIf}
      className={className}
    />
  );
}
