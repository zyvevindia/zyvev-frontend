import { useCallback, useEffect, useState } from "react";
import {
  fetchObservations,
  moderateObservation,
} from "../../../services/editorial/editorialApi";
import {
  card,
  h1,
  h2,
  muted,
  table,
  th,
  td,
  editorialColors,
} from "../../../components/editorial/editorialStyles";

const btn = {
  marginRight: 6,
  marginTop: 4,
  padding: "6px 10px",
  fontSize: 12,
  borderRadius: 6,
  border: "1px solid #cbd5e1",
  background: "#fff",
  cursor: "pointer",
};

export default function ObservationsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");

  const load = useCallback(() => {
    const params = filter ? { status: filter } : {};
    fetchObservations(params)
      .then((res) => setData(res.data))
      .catch((e) => setError(e.message));
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id, action) {
    try {
      await moderateObservation(id, {
        action,
        reviewerNotes: `Moderation: ${action}`,
      });
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div>
      <h1 style={h1}>Observation moderation</h1>
      <p style={muted}>
        Internal real-world observations — never published to buyers without
        editorial sign-off.
      </p>
      {error && <p style={{ color: editorialColors.danger }}>{error}</p>}

      <div style={card}>
        <label style={{ fontSize: 13 }}>
          Filter status{" "}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            <option value="">All</option>
            {(data?.statuses || []).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <p style={{ ...muted, marginTop: 8 }}>
          {data?.count ?? 0} observations
        </p>
      </div>

      <div style={card}>
        <h2 style={h2}>Queue</h2>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>Variant</th>
              <th style={th}>Type</th>
              <th style={th}>Summary</th>
              <th style={th}>Status</th>
              <th style={th}>Freshness</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items || []).map((item) => (
              <tr key={item.observationId}>
                <td style={td}>
                  <code style={{ fontSize: 11 }}>{item.tier1VariantSlug}</code>
                </td>
                <td style={td}>{item.observationType}</td>
                <td style={{ ...td, maxWidth: 280 }}>{item.summary}</td>
                <td style={td}>{item.status}</td>
                <td style={td}>
                  {item.freshness?.tier || "—"}
                  {item.duplicateCandidates?.length > 0 && (
                    <div style={{ fontSize: 11, color: "#b45309" }}>
                      {item.duplicateCandidates.length} duplicate candidate(s)
                    </div>
                  )}
                </td>
                <td style={td}>
                  {item.status !== "verified_editorial" && (
                    <button
                      type="button"
                      style={btn}
                      onClick={() => act(item.observationId, "approve")}
                    >
                      Verify
                    </button>
                  )}
                  {item.status !== "archived" && (
                    <>
                      <button
                        type="button"
                        style={btn}
                        onClick={() => act(item.observationId, "low_confidence")}
                      >
                        Low conf.
                      </button>
                      <button
                        type="button"
                        style={btn}
                        onClick={() => act(item.observationId, "archive")}
                      >
                        Archive
                      </button>
                      <button
                        type="button"
                        style={btn}
                        onClick={() => act(item.observationId, "reject")}
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
