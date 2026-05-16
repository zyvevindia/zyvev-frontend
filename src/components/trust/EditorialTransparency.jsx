/**
 * Editorial transparency — how EVSavari ranks and what we do not do.
 */

const card = {
  background: "#f8fafc",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  padding: "1.25rem 1.5rem",
  marginTop: "2rem",
  marginBottom: "1.5rem",
};

const title = {
  fontSize: "1rem",
  fontWeight: 700,
  color: "#0f172a",
  margin: "0 0 0.75rem",
};

const list = {
  margin: 0,
  paddingLeft: "1.25rem",
  color: "#475569",
  fontSize: "0.9rem",
  lineHeight: 1.65,
};

export default function EditorialTransparency({ compact = false }) {
  return (
    <aside style={card} aria-label="Editorial transparency">
      <h2 style={title}>How EVSavari guides work</h2>
      <ul style={list}>
        <li>
          Rankings use catalog intelligence scores — not paid placement or
          dealer bids.
        </li>
        <li>
          We say &ldquo;well suited&rdquo; rather than universal &ldquo;best
          EV&rdquo; claims; your charging and commute context matters.
        </li>
        <li>
          Prices shown are indicative ex-showroom; confirm on-road quotes in
          your city.
        </li>
        {!compact && (
          <>
            <li>
              Compare pages highlight tradeoffs — neither side is declared an
              automatic winner.
            </li>
            <li>
              Legacy URLs at <code>/cars/…</code> may still work; canonical
              links point to current discovery paths for search engines.
            </li>
          </>
        )}
      </ul>
    </aside>
  );
}
