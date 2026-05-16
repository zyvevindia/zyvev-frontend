import { useEffect, useState } from "react";
import { fetchCoverage } from "../../../services/editorial/editorialApi";
import CoverageTable from "../../../components/editorial/CoverageTable";
import { h1, muted, editorialColors } from "../../../components/editorial/editorialStyles";

export default function CoveragePage() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCoverage()
      .then((res) => setReport(res.data))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h1 style={h1}>Intelligence coverage</h1>
      <p style={muted}>
        Tier-1 gap analysis, trust indicators, observation pilot coverage, and brochure verification priorities.
      </p>
      {error && (
        <p style={{ color: editorialColors.danger }}>{error}</p>
      )}
      <CoverageTable report={report} />
    </div>
  );
}
