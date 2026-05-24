export default function DetailQuickSpecs({
  range,
  battery,
  charging,
  safety,
  topSpeed,
  onScrollCharging,
}) {
  const items = [
    {
      icon: "⚡",
      label: "Range",
      value: range > 0 ? `Up to ${range} km` : "—",
    },
    {
      icon: "🔋",
      label: "Battery",
      value: battery || "—",
    },
    {
      icon: "⚡",
      label: "Fast charging",
      value: charging || "—",
      action: onScrollCharging,
    },
    {
      icon: "🛡",
      label: "Safety",
      value: safety || topSpeed || "—",
    },
  ];

  return (
    <div className="cd-quick-specs" role="list">
      {items.map((item) => {
        const inner = (
          <>
            <span className="cd-quick-spec__icon" aria-hidden>
              {item.icon}
            </span>
            <span className="cd-quick-spec__label">{item.label}</span>
            <span className="cd-quick-spec__value">{item.value}</span>
          </>
        );

        if (item.action) {
          return (
            <button
              key={item.label}
              type="button"
              className="cd-quick-spec cd-quick-spec--action"
              role="listitem"
              onClick={item.action}
            >
              {inner}
            </button>
          );
        }

        return (
          <div key={item.label} className="cd-quick-spec" role="listitem">
            {inner}
          </div>
        );
      })}
    </div>
  );
}
