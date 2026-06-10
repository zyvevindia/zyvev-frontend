import { DIMENSION_LABELS } from "../../scoring/scoreExplanations";
import "./compare-score-comparison.css";

const COMPARE_DIMENSIONS = [
  "range",
  "charging",
  "performance",
  "feature",
  "safety",
  "value",
  "city",
  "highway",
];

function resolveScores(car) {
  return car?.evSavariScores || null;
}

function cellScore(car, key) {
  const scores = resolveScores(car);
  return scores?.breakdown?.[key]?.score ?? null;
}

function resolveOverall(car) {
  const scores = resolveScores(car);
  return {
    score: scores?.overall?.score ?? car?.evScores?.composite ?? null,
    grade: scores?.overall?.grade ?? car?.evScores?.grade ?? null,
  };
}

export default function CompareScoreComparison({
  cars = [],
  compact = false,
  title = "EVSavari score comparison",
}) {
  const list = (cars || []).filter(Boolean);
  if (list.length < 2) return null;

  const hasAnyScore = list.some(
    (car) => resolveOverall(car).score != null || resolveScores(car)?.hasData
  );
  if (!hasAnyScore) return null;

  const dimensionRows = COMPARE_DIMENSIONS.map((key) => {
    const values = list.map((car) => ({
      car,
      score: cellScore(car, key),
    }));
    const present = values.filter((v) => v.score != null);
    if (present.length < 2) return null;

    const max = Math.max(...present.map((v) => v.score));
    return {
      key,
      label: DIMENSION_LABELS[key] || key,
      values: values.map((v) => ({
        ...v,
        isBest: v.score != null && v.score === max && max > 0,
      })),
    };
  }).filter(Boolean);

  return (
    <section
      className={`compare-score-comparison${
        compact ? " compare-score-comparison--compact" : ""
      }`}
      aria-labelledby="compare-score-comparison-title"
    >
      <h2 id="compare-score-comparison-title" className="compare-score-comparison__title">
        {title}
      </h2>
      <div className="compare-score-comparison__table-wrap">
        <table className="compare-score-comparison__table">
          <thead>
            <tr>
              <th scope="col">Dimension</th>
              {list.map((car) => (
                <th key={car._id || car.slug} scope="col">
                  {car.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="compare-score-comparison__overall-row">
              <th scope="row">Overall</th>
              {list.map((car) => {
                const { score, grade } = resolveOverall(car);
                return (
                  <td key={car._id || car.slug}>
                    {score != null ? (
                      <>
                        <strong>{score}</strong>
                        {grade ? (
                          <span className="compare-score-comparison__grade">
                            {grade}
                          </span>
                        ) : null}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                );
              })}
            </tr>
            {dimensionRows.map((row) => (
              <tr key={row.key}>
                <th scope="row">{row.label}</th>
                {row.values.map(({ car, score, isBest }) => (
                  <td
                    key={car._id || car.slug}
                    className={isBest ? "compare-score-comparison__best" : ""}
                  >
                    {score != null ? `${score}/100` : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
