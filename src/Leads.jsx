import { useEffect, useState } from "react";

import { API_URL } from "./config";

function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/leads`);
      const data = await res.json();
      setLeads(data);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  return (
    <div style={{ padding: "30px", maxWidth: "900px", margin: "auto" }}>
      <h1 style={{ textAlign: "center" }}>Leads Dashboard 📊</h1>

      {loading ? (
        <h3>Loading leads... ⏳</h3>
      ) : leads.length === 0 ? (
        <h3>No leads yet 🚫</h3>
      ) : (
        leads.map((lead) => (
          <div
            key={lead._id}
            style={{
              border: "1px solid #eee",
              padding: "15px",
              margin: "10px 0",
              borderRadius: "10px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            }}
          >
            <h3>{lead.name}</h3>
            <p>📞 {lead.phone}</p>
            <p>
              🚗 {lead.carId?.name} ({lead.carId?.brand})
            </p>
          </div>
        ))
      )}
    </div>
  );
}

export default Leads;