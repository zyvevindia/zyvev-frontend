export default function DetailQuickSpecs({
  range,
  battery,
  charging,
  safety,
  topSpeed,
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
    },
    {
      icon: "🛡",
      label: "Safety",
      value: safety || topSpeed || "—",
    },
  ];

  return (
    <div className="cd-quick-specs" role="list">
      {items.map((item) => (
        <div key={item.label} className="cd-quick-spec" role="listitem">
          <span className="cd-quick-spec__icon" aria-hidden>
            {item.icon}
          </span>
          <span className="cd-quick-spec__label">{item.label}</span>
          <span className="cd-quick-spec__value">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
