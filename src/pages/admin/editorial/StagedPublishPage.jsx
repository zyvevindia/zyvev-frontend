import { useEffect, useState } from "react";
import { fetchStaged } from "../../../services/editorial/editorialApi";
import StagedManifestList from "../../../components/editorial/StagedManifestList";
import { h1, muted, editorialColors } from "../../../components/editorial/editorialStyles";

export default function StagedPublishPage() {
  const [staged, setStaged] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    try {
      const res = await fetchStaged();
      setStaged(res.data);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 style={h1}>Staged publish</h1>
      <p style={muted}>
        Safe staging archive — rollback removes published copies only; Tier-1 JSON unchanged.
      </p>
      {error && (
        <p style={{ color: editorialColors.danger }}>{error}</p>
      )}
      <StagedManifestList staged={staged} onRefresh={load} />
    </div>
  );
}
