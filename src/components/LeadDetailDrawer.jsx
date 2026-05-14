import { useState } from "react";

import { API_URL } from "../config";

import {
  labelForStatus
} from "../crm/leadPipeline";

/* =========================================================
   ================= LEAD DETAIL DRAWER ===================
   ========================================================= */

export default function LeadDetailDrawer({

  lead,

  open,

  onClose,

  token,

  onUpdated
}) {

  const [noteText, setNoteText] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  if (!open || !lead) {

    return null;
  }

  const vehicleLabel =
    lead.vehicleName ||

    lead.carId?.name ||

    "—";

  const historyEntries =
    Array.isArray(lead.statusHistory) &&
    lead.statusHistory.length > 0
      ? [...lead.statusHistory].reverse()
      : [
          {
            status: lead.status,

            at: lead.createdAt
          }
        ];

  const addNote = async () => {

    const text =
      noteText.trim();

    if (!text) {

      alert("Enter a note");

      return;
    }

    try {

      setSaving(true);

      const response =
        await fetch(
          `${API_URL}/api/sales/leads/${lead._id}/notes`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`
            },

            body: JSON.stringify({
              text
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        alert(
          data.error ||
          "Could not save note"
        );

        return;
      }

      setNoteText("");

      if (typeof onUpdated === "function") {

        onUpdated(data);
      }
    } catch (err) {

      console.error(err);

      alert("Server error");
    } finally {

      setSaving(false);
    }
  };

  return (

    <div
      style={backdrop}
      onClick={onClose}
      role="presentation"
    >

      <div
        style={panel}
        onClick={(e) =>
          e.stopPropagation()
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-drawer-title"
      >

        <div style={panelHeader}>

          <h2
            id="lead-drawer-title"
            style={panelTitle}
          >
            Lead details
          </h2>

          <button
            type="button"
            style={closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>

        </div>

        <div style={panelBody}>

          <section style={section}>

            <h3 style={sectionTitle}>
              Customer
            </h3>

            <p style={row}>
              <strong>Name:</strong>{" "}
              {lead.name}
            </p>

            <p style={row}>
              <strong>Phone:</strong>{" "}
              {lead.phone}
            </p>

            <p style={row}>
              <strong>Email:</strong>{" "}
              {lead.email || "—"}
            </p>

            <p style={row}>
              <strong>City:</strong>{" "}
              {lead.city || "—"}
            </p>

          </section>

          <section style={section}>

            <h3 style={sectionTitle}>
              Vehicle & source
            </h3>

            <p style={row}>
              <strong>Vehicle:</strong>{" "}
              {vehicleLabel}
            </p>

            <p style={row}>
              <strong>Source page:</strong>{" "}
              {lead.sourcePage || "—"}
            </p>

            <p style={row}>
              <strong>Pipeline status:</strong>{" "}
              {labelForStatus(lead.status)}
            </p>

          </section>

          <section style={section}>

            <h3 style={sectionTitle}>
              Assignment
            </h3>

            <p style={row}>
              <strong>Assigned to:</strong>{" "}
              {lead.assignedTo?.name ||
                lead.assignedTo?.email ||
                "—"}
            </p>

            <p style={row}>
              <strong>Dealer account:</strong>{" "}
              {lead.dealer?.name ||
                lead.dealer?.email ||
                "—"}
            </p>

            <p style={row}>
              <strong>Dealer / desk:</strong>{" "}
              {lead.assignedDealer || "—"}
            </p>

            <p style={row}>
              <strong>Assigned at:</strong>{" "}
              {lead.assignedAt
                ? new Date(
                  lead.assignedAt
                ).toLocaleString()
                : "—"}
            </p>

          </section>

          <section style={section}>

            <h3 style={sectionTitle}>
              Timestamps
            </h3>

            <p style={row}>
              <strong>Created:</strong>{" "}
              {lead.createdAt
                ? new Date(
                  lead.createdAt
                ).toLocaleString()
                : "—"}
            </p>

            <p style={row}>
              <strong>Updated:</strong>{" "}
              {lead.updatedAt
                ? new Date(
                  lead.updatedAt
                ).toLocaleString()
                : "—"}
            </p>

          </section>

          <section style={section}>

            <h3 style={sectionTitle}>
              Status history
            </h3>

            <ul style={historyList}>

              {historyEntries.map(
                (h, i) => (

                  <li
                    key={i}
                    style={historyItem}
                  >

                    <span style={historyStatus}>
                      {labelForStatus(h.status)}
                    </span>

                    <span style={historyMeta}>
                      {h.at
                        ? new Date(
                          h.at
                        ).toLocaleString()
                        : "—"}
                      {h.changedBy?.name
                        ? ` · ${h.changedBy.name}`
                        : ""}
                      {h.changedByDealer?.name
                        ? ` · ${h.changedByDealer.name} (dealer)`
                        : ""}
                    </span>

                  </li>

                )
              )}

            </ul>

          </section>

          <section style={section}>

            <h3 style={sectionTitle}>
              Notes
            </h3>

            <textarea
              style={textarea}
              rows={3}
              placeholder="Add a note…"
              value={noteText}
              onChange={(e) =>
                setNoteText(
                  e.target.value
                )
              }
            />

            <button
              type="button"
              style={primaryBtn}
              disabled={saving}
              onClick={addNote}
            >
              {saving
                ? "Saving…"
                : "Add note"}
            </button>

            <div style={{ marginTop: "16px" }}>

              {!lead.notes ||
              lead.notes.length === 0 ? (

                <p style={muted}>
                  No notes yet.
                </p>

              ) : (

                <ul style={noteList}>

                  {[...lead.notes]
                    .reverse()
                    .map(
                      (n, idx) => (

                        <li
                          key={idx}
                          style={noteItem}
                        >

                          <p style={{ margin: "0 0 6px" }}>
                            {n.text}
                          </p>

                          <small style={muted}>
                            {n.createdAt
                              ? new Date(
                                n.createdAt
                              ).toLocaleString()
                              : ""}
                            {n.createdBy?.name
                              ? ` · ${n.createdBy.name}`
                              : ""}
                            {n.createdByDealer?.name
                              ? ` · ${n.createdByDealer.name} (dealer)`
                              : ""}
                          </small>

                        </li>

                      )
                    )}

                </ul>

              )}

            </div>

          </section>

        </div>

      </div>

    </div>

  );
}

const backdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.45)",
  zIndex: 10000,
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "stretch",
  padding: "0"
};

const panel = {
  width: "min(440px, 100vw)",
  maxHeight: "100vh",
  background: "#fff",
  boxShadow: "-8px 0 32px rgba(15,23,42,0.12)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden"
};

const panelHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "18px 20px",
  borderBottom: "1px solid #e5e7eb",
  background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
  color: "#fff"
};

const panelTitle = {
  margin: 0,
  fontSize: "20px",
  fontWeight: "800"
};

const closeBtn = {
  border: "none",
  background: "rgba(255,255,255,0.2)",
  color: "#fff",
  width: "36px",
  height: "36px",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "18px",
  lineHeight: 1
};

const panelBody = {
  padding: "20px",
  overflowY: "auto",
  flex: 1
};

const section = {
  marginBottom: "22px"
};

const sectionTitle = {
  margin: "0 0 10px",
  fontSize: "14px",
  fontWeight: "700",
  color: "#0f172a",
  textTransform: "uppercase",
  letterSpacing: "0.04em"
};

const row = {
  margin: "6px 0",
  fontSize: "14px",
  color: "#334155",
  lineHeight: 1.5
};

const historyList = {
  listStyle: "none",
  margin: 0,
  padding: 0
};

const historyItem = {
  padding: "10px 12px",
  borderRadius: "12px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  marginBottom: "8px"
};

const historyStatus = {
  display: "block",
  fontWeight: "700",
  color: "#0f172a"
};

const historyMeta = {
  display: "block",
  fontSize: "12px",
  color: "#64748b",
  marginTop: "4px"
};

const textarea = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  padding: "10px 12px",
  fontSize: "14px",
  marginBottom: "10px",
  resize: "vertical",
  fontFamily: "inherit"
};

const primaryBtn = {
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "#fff",
  border: "none",
  borderRadius: "12px",
  padding: "10px 16px",
  fontWeight: "700",
  cursor: "pointer",
  fontSize: "14px"
};

const noteList = {
  listStyle: "none",
  margin: 0,
  padding: 0
};

const noteItem = {
  padding: "12px",
  borderRadius: "12px",
  background: "#f1f5f9",
  marginBottom: "8px",
  fontSize: "14px",
  color: "#0f172a"
};

const muted = {
  color: "#64748b",
  fontSize: "13px",
  margin: 0
};
