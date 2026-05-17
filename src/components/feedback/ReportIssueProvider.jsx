import { createContext, useCallback, useContext, useMemo, useState } from "react";

import ReportIssueModal from "./ReportIssueModal";

const ReportIssueContext = createContext({
  openReportIssue: () => {},
});

export function useReportIssue() {
  return useContext(ReportIssueContext);
}

export function ReportIssueProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState({});

  const openReportIssue = useCallback((ctx = {}) => {
    setContext(ctx);
    setOpen(true);
  }, []);

  const value = useMemo(
    () => ({ openReportIssue }),
    [openReportIssue]
  );

  return (
    <ReportIssueContext.Provider value={value}>
      {children}
      <ReportIssueModal
        isOpen={open}
        onClose={() => setOpen(false)}
        context={context}
      />
    </ReportIssueContext.Provider>
  );
}
