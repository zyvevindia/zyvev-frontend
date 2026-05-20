import "../../styles/compare-page.css";

export default function CompareGuideLoading() {
  return (
    <div className="compare-guide-loading" aria-busy="true" aria-label="Loading comparison">
      <div className="compare-hero compare-hero--skeleton">
        <div className="compare-guide-loading__shimmer compare-guide-loading__title" />
        <div className="compare-guide-loading__shimmer compare-guide-loading__subtitle" />
      </div>
      <div className="compare-page-grid">
        <div className="compare-deferred-skeleton" />
        <div className="compare-deferred-skeleton" />
      </div>
    </div>
  );
}
