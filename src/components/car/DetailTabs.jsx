import { useEffect, useRef } from "react";

export const DETAIL_TABS = [
  { id: "detail-overview", label: "Overview" },
  { id: "detail-variants", label: "Variants" },
  { id: "detail-compare", label: "Compare" },
  { id: "detail-charging", label: "Charging" },
  { id: "detail-emi-calculator", label: "EMI" },
  { id: "detail-faqs", label: "FAQs" },
  { id: "detail-reviews", label: "Reviews" },
];

export default function DetailTabs({
  activeId,
  onSelect,
}) {
  const listRef = useRef(null);

  useEffect(() => {
    const activeBtn = listRef.current?.querySelector(
      `[data-tab-id="${activeId}"]`
    );
    activeBtn?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    });
  }, [activeId]);

  return (
    <div className="cd-tabs-wrap">
      <div
        ref={listRef}
        className="cd-tabs"
        role="tablist"
        aria-label="Vehicle sections"
      >
        {DETAIL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            data-tab-id={tab.id}
            aria-selected={activeId === tab.id}
            className={`cd-tab${activeId === tab.id ? " cd-tab--active" : ""}`}
            onClick={() => onSelect(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
