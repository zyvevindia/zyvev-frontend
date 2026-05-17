import { useReportIssue } from "./ReportIssueProvider";

export default function ReportIssueLink({
  label = "Report issue",
  context = {},
  style = {},
}) {
  const { openReportIssue } = useReportIssue();

  return (
    <button
      type="button"
      onClick={() => openReportIssue(context)}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        color: "rgba(255,255,255,0.75)",
        fontSize: "0.85rem",
        cursor: "pointer",
        textDecoration: "underline",
        textUnderlineOffset: "3px",
        ...style,
      }}
    >
      {label}
    </button>
  );
}
