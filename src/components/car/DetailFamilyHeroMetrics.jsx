export default function DetailFamilyHeroMetrics({
  metrics,
  onScrollCharging,
}) {
  if (!metrics) return null;

  const rows = [
    { label: "Price", value: metrics.priceLabel },
    { label: "Range", value: metrics.rangeLabel },
    { label: "Battery", value: metrics.batteryLabel },
    { label: "Power", value: metrics.powerLabel },
    { label: "Charging", value: metrics.chargingAcLabel },
  ].filter((row) => row.value);

  if (!rows.length) return null;

  return (
    <dl className="cd-hero-family-metrics">
      {rows.map((row) => {
        const isCharging = row.label === "Charging" && onScrollCharging;

        if (isCharging) {
          return (
            <div key={row.label} className="cd-hero-family-metrics__row">
              <dt>{row.label}</dt>
              <dd>
                <button
                  type="button"
                  className="cd-hero-family-metrics__link"
                  onClick={onScrollCharging}
                >
                  {row.value}
                </button>
              </dd>
            </div>
          );
        }

        return (
          <div key={row.label} className="cd-hero-family-metrics__row">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        );
      })}
    </dl>
  );
}
