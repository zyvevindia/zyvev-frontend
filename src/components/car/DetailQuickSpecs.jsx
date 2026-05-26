export default function DetailQuickSpecs({
  range,
  battery,
  chargingSummary,
  fourthMetric,
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
      label: "Charging",
      value: chargingSummary || "—",
      action: onScrollCharging,
      actionLabel: "View charging details →",
    },
  ];

  if (fourthMetric?.value) {
    items.push({
      icon: fourthMetric.icon,
      label: fourthMetric.label,
      value: fourthMetric.value,
    });
  }

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
            {item.action && item.actionLabel ? (
              <span className="cd-quick-spec__link">{item.actionLabel}</span>
            ) : null}
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
