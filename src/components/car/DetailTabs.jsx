import { useEffect, useRef } from "react";

import { DETAIL_NAV_TABS } from "../../utils/detailPageNav";

export { DETAIL_NAV_TABS as DETAIL_TABS };

export default function DetailTabs({
  activeId,
  onSelect,
  excludeTabIds = [],
}) {
  const listRef = useRef(null);
  const hidden = new Set(excludeTabIds);
  const tabs = DETAIL_NAV_TABS.filter((tab) => !hidden.has(tab.id));

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
        {tabs.map((tab) => (
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
