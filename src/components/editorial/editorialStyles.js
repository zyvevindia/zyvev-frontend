export const editorialColors = {
  bg: "#f5f7fb",
  sidebar: "#0f172a",
  card: "#ffffff",
  border: "#e2e8f0",
  text: "#0f172a",
  muted: "#64748b",
  primary: "#2563eb",
  success: "#059669",
  warning: "#d97706",
  danger: "#dc2626",
  added: "#ecfdf5",
  removed: "#fef2f2",
  changed: "#eff6ff",
  warning: "#d97706",
};

export const layout = {
  display: "flex",
  minHeight: "calc(100vh - 80px)",
  background: editorialColors.bg,
};

export const sidebar = {
  width: 220,
  background: editorialColors.sidebar,
  color: "#fff",
  padding: "20px 16px",
  flexShrink: 0,
};

export const main = {
  flex: 1,
  padding: "24px 28px",
  overflow: "auto",
};

export const card = {
  background: editorialColors.card,
  borderRadius: 12,
  padding: 20,
  marginBottom: 16,
  border: `1px solid ${editorialColors.border}`,
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};

export const h1 = {
  fontSize: 22,
  fontWeight: 700,
  margin: "0 0 4px",
  color: editorialColors.text,
};

export const h2 = {
  fontSize: 16,
  fontWeight: 600,
  margin: "0 0 12px",
  color: editorialColors.text,
};

export const muted = {
  fontSize: 13,
  color: editorialColors.muted,
  margin: 0,
};

export const btnPrimary = {
  padding: "8px 14px",
  background: editorialColors.primary,
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
};

export const btnSecondary = {
  ...btnPrimary,
  background: "#fff",
  color: editorialColors.text,
  border: `1px solid ${editorialColors.border}`,
};

export const btnDanger = {
  ...btnPrimary,
  background: editorialColors.danger,
};

export const statGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
  gap: 12,
  marginBottom: 20,
};

export const statBox = {
  ...card,
  marginBottom: 0,
  textAlign: "center",
};

export const table = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
};

export const th = {
  textAlign: "left",
  padding: "10px 12px",
  borderBottom: `2px solid ${editorialColors.border}`,
  color: editorialColors.muted,
  fontWeight: 600,
};

export const td = {
  padding: "10px 12px",
  borderBottom: `1px solid ${editorialColors.border}`,
  verticalAlign: "top",
};

export const badge = (color) => ({
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 600,
  background: color,
  color: editorialColors.text,
});
