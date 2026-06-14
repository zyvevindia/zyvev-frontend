import { useEffect, useRef } from "react";

export default function DetailTabs({
  activeId,
  onSelect,
  tabs = [],
}) {
  const listRef = useRef(null);
  const scrollTabs = tabs.filter((tab) => !tab.cta);
  const ctaTab = tabs.find((tab) => tab.cta);

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
        {scrollTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            data-tab-id={tab.id}
            aria-selected={activeId === tab.id}
            className={`cd-tab${activeId === tab.id ? " cd-tab--active" : ""}`}
            onClick={() => onSelect(tab.id)}
          >
            {tab.title ?? tab.label}
          </button>
        ))}
      </div>
      {ctaTab ? (
        <button
          type="button"
          className="cd-tab cd-tab--cta"
          data-tab-id={ctaTab.id}
          onClick={() => onSelect(ctaTab.id)}
        >
          {ctaTab.title ?? ctaTab.label}
        </button>
      ) : null}
    </div>
  );
}
