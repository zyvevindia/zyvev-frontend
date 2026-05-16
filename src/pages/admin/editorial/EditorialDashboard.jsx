import { useEffect, useState } from "react";
import { fetchEditorialOverview, fetchEditorialJobs } from "../../../services/editorial/editorialApi";
import JobFilters from "../../../components/editorial/JobFilters";
import JobListTable from "../../../components/editorial/JobListTable";
import {
  card,
  h1,
  muted,
  statGrid,
  statBox,
  editorialColors,
} from "../../../components/editorial/editorialStyles";

export default function EditorialDashboard() {
  const [overview, setOverview] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    loadJobs();
  }, [filters]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchEditorialOverview();
      setOverview(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadJobs() {
    try {
      const res = await fetchEditorialJobs(filters);
      setJobs(res.data.items || []);
    } catch (e) {
      setError(e.message);
    }
  }

  const c = overview?.counts || {};

  return (
    <div>
      <h1 style={h1}>Editorial operations</h1>
      <p style={muted}>
        Governed OEM intelligence — extract → review → diff → stage. No auto-publish to Tier-1.
      </p>

      {error && (
        <p style={{ color: editorialColors.danger, marginTop: 12 }}>{error}</p>
      )}

      {loading ? (
        <p style={{ marginTop: 20 }}>Loading…</p>
      ) : (
        <>
          <div style={statGrid}>
            {[
              ["Pending review", c.pendingReview],
              ["Manual review", c.needsManualReview],
              ["Approved", c.approved],
              ["Rejected", c.rejected],
              ["Staged", c.staged],
              ["Extract failures", c.extractionFailures],
            ].map(([label, val]) => (
              <div key={label} style={statBox}>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{val ?? 0}</div>
                <div style={{ fontSize: 12, color: editorialColors.muted }}>{label}</div>
              </div>
            ))}
          </div>

          {overview?.extractWarnings?.length > 0 && (
            <div style={card}>
              <strong>Extraction warnings ({overview.extractWarnings.length})</strong>
              <ul style={{ fontSize: 13, marginTop: 8 }}>
                {overview.extractWarnings.slice(0, 5).map((w, i) => (
                  <li key={i}>
                    {w.type}: {w.sourceId || w.file}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <JobFilters filters={filters} onChange={setFilters} />
          <div style={card}>
            <JobListTable jobs={jobs} />
          </div>
        </>
      )}
    </div>
  );
}
