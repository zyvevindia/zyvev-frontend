/* =========================================================
   ================ CRM PIPELINE (EVSavari) ================
   ========================================================= */

export const PIPELINE_STAGES = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "follow_up", label: "Follow-up" },
  { key: "interested", label: "Interested" },
  { key: "test_drive", label: "Test drive" },
  { key: "negotiation", label: "Negotiation" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" }
];

const PIPELINE_KEYS = new Set(
  PIPELINE_STAGES.map((s) => s.key)
);

/* =========================================================
   Map stored status → Kanban column key (legacy support).
   ========================================================= */

export function kanbanBucketKey(status) {

  const s =
    status || "new";

  if (s === "assigned") {

    return "new";
  }

  if (s === "converted") {

    return "won";
  }

  if (s === "follow-up" || s === "followup") {

    return "follow_up";
  }

  if (!PIPELINE_KEYS.has(s)) {

    return "new";
  }

  return s;
}

export function labelForStatus(status) {

  const key =
    kanbanBucketKey(status);

  const row =
    PIPELINE_STAGES.find(
      (p) => p.key === key
    );

  return row
    ? row.label
    : key;
}

export const PIPELINE_STATUS_VALUES =
  PIPELINE_STAGES.map((s) => s.key);
