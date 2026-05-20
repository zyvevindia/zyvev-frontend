/**
 * Compact accordion section for secondary detail-page blocks.
 */

export default function DetailCollapsibleSection({
  id,
  title,
  preview = "",
  defaultOpen = true,
  children,
  className = "",
}) {
  return (
    <section
      id={id}
      className={`cd-section cd-collapsible-section cd-card ${className}`.trim()}
    >
      <details className="cd-collapsible-section__details" open={defaultOpen}>
        <summary className="cd-collapsible-section__summary">
          <span className="cd-collapsible-section__summary-text">
            <span className="cd-collapsible-section__title">{title}</span>
            {preview ? (
              <span className="cd-collapsible-section__preview">
                {preview}
              </span>
            ) : null}
          </span>
          <span className="cd-collapsible-section__chevron" aria-hidden>
            ▾
          </span>
        </summary>
        <div className="cd-collapsible-section__body cd-content-card">
          {children}
        </div>
      </details>
    </section>
  );
}
