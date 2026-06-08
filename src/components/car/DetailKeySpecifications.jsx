export default function DetailKeySpecifications({ metrics }) {
  if (!metrics) return null;

  const rows = [
    { label: "Range", value: metrics.rangeLabel },
    { label: "Battery Capacity", value: metrics.batteryLabel },
    { label: "Power", value: metrics.powerLabel },
    { label: "Charging Time AC", value: metrics.chargingAcLabel },
    { label: "Charging Time DC", value: metrics.chargingDcLabel },
    { label: "Boot Space", value: metrics.bootSpaceLabel },
  ].filter((row) => row.value);

  if (!rows.length) return null;

  return (
    <section
      id="key-specifications"
      className="cd-section cd-card cd-content-card cd-key-specs"
      aria-labelledby="key-specifications-title"
    >
      <h2 id="key-specifications-title" className="cd-section__title">
        Key specifications
      </h2>
      <p className="cd-section__intro">
        Core specs for this variant.
      </p>
      <dl className="cd-key-specs__grid">
        {rows.map((row) => (
          <div key={row.label} className="cd-key-specs__item">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
