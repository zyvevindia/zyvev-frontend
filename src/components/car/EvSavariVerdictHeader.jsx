import "./ev-savari-verdict-header.css";

/**
 * EVSavari advisor verdict — plain-English headline and summary.
 */
export default function EvSavariVerdictHeader({
  verdict = null,
  className = "",
  id = undefined,
}) {
  if (!verdict?.headline) {
    return null;
  }

  const rootClass = ["ev-verdict-header", className].filter(Boolean).join(" ");

  return (
    <div className={rootClass} id={id}>
      <p className="ev-verdict-header__headline">{verdict.headline}</p>
      {verdict.summary ? (
        <p className="ev-verdict-header__summary">{verdict.summary}</p>
      ) : null}
    </div>
  );
}
