import { Link } from "react-router-dom";
import { badge, editorialColors, table, td, th } from "./editorialStyles";

const LIFECYCLE_COLORS = {
  pending_review: "#fef3c7",
  needs_manual_review: "#fde68a",
  approved: "#d1fae5",
  rejected: "#fee2e2",
  staged: "#dbeafe",
};

export default function JobListTable({ jobs = [] }) {
  if (!jobs.length) {
    return <p style={{ color: editorialColors.muted }}>No review jobs match filters.</p>;
  }

  return (
    <table style={table}>
      <thead>
        <tr>
          <th style={th}>Job</th>
          <th style={th}>Variant</th>
          <th style={th}>OEM</th>
          <th style={th}>Lifecycle</th>
          <th style={th}>Created</th>
          <th style={th}></th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((job) => (
          <tr key={job.jobId}>
            <td style={td}>
              <code style={{ fontSize: 12 }}>{job.jobId}</code>
            </td>
            <td style={td}>{job.tier1VariantSlug}</td>
            <td style={td}>{job.brand || "—"}</td>
            <td style={td}>
              <span
                style={badge(
                  LIFECYCLE_COLORS[job.lifecycle] || "#f1f5f9"
                )}
              >
                {job.lifecycle || job.status}
              </span>
            </td>
            <td style={td}>
              {job.createdAt
                ? new Date(job.createdAt).toLocaleString()
                : "—"}
            </td>
            <td style={td}>
              <Link to={`/admin/editorial/jobs/${job.jobId}`}>Review →</Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
