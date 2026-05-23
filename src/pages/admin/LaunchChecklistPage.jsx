import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  LAUNCH_CHECKLIST_SECTIONS,
  defaultChecklistState,
  loadChecklistState,
  saveChecklistState,
  checklistProgress,
} from "../../ops/launchChecklistData";
import { adminBadge, adminCard } from "./adminOpsStyles";

export default function LaunchChecklistPage() {
  const [state, setState] = useState(() => loadChecklistState());

  const progress = useMemo(() => checklistProgress(state), [state]);

  const persist = useCallback((next) => {
    const saved = saveChecklistState(next);
    setState(saved);
  }, []);

  const toggle = (id, field) => {
    const next = {
      ...state,
      [field]: {
        ...state[field],
        [id]: !state[field][id],
      },
    };
    persist(next);
  };

  const setNote = (id, value) => {
    persist({
      ...state,
      notes: { ...state.notes, [id]: value },
    });
  };

  const resetAll = () => {
    if (!window.confirm("Reset all checklist items?")) return;
    persist(defaultChecklistState());
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "1.5rem" }}>
      <p style={{ marginBottom: "0.5rem" }}>
        <Link to="/admin">← Admin</Link>
        {" · "}
        <Link to="/admin/system-status">System status</Link>
        {" · "}
        <Link to="/admin/ops-qa">Operational QA</Link>
      </p>

      <h1 style={{ marginTop: 0 }}>Soft launch checklist</h1>
      <p style={{ color: "#64748b" }}>
        Manual QA tracker — saved in this browser ({progress.done}/{progress.total}{" "}
        complete
        {progress.blockers > 0
          ? ` · ${progress.blockers} blocker(s)`
          : ""}
        ).
      </p>

      <div style={adminCard}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <strong style={{ fontSize: "1.5rem" }}>{progress.percent}%</strong>
          <span style={adminBadge(progress.percent === 100 ? "green" : "blue")}>
            {progress.percent === 100 ? "Complete" : "In progress"}
          </span>
          <button
            type="button"
            onClick={resetAll}
            style={{
              marginLeft: "auto",
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#fff",
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            Reset all
          </button>
        </div>
        {state.updatedAt ? (
          <p style={{ margin: "8px 0 0", fontSize: "0.8rem", color: "#94a3b8" }}>
            Last saved: {new Date(state.updatedAt).toLocaleString("en-IN")}
          </p>
        ) : null}
      </div>

      {LAUNCH_CHECKLIST_SECTIONS.map((section) => (
        <section key={section.id} style={adminCard}>
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>{section.title}</h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {section.items.map((item) => (
              <li
                key={item.id}
                style={{
                  borderTop: "1px solid #f1f5f9",
                  padding: "12px 0",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(state.completed[item.id])}
                    onChange={() => toggle(item.id, "completed")}
                  />
                  {item.label}
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 6,
                    fontSize: "0.8rem",
                    color: "#b45309",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(state.blockers[item.id])}
                    onChange={() => toggle(item.id, "blockers")}
                  />
                  Blocker
                </label>
                <textarea
                  placeholder="Notes…"
                  value={state.notes[item.id] || ""}
                  onChange={(e) => setNote(item.id, e.target.value)}
                  rows={2}
                  style={{
                    width: "100%",
                    marginTop: 8,
                    padding: 8,
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: "0.85rem",
                    resize: "vertical",
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
