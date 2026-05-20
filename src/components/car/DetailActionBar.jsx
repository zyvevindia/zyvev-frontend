const ICONS = {
  emi: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M8 6h8M8 10h2M12 10h2M8 14h2M12 14h2M8 18h8" />
    </svg>
  ),
  dealer: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 14v-2a4 4 0 0 1 4-4h1" />
      <path d="M20 14v-2a4 4 0 0 0-4-4h-1" />
      <path d="M8 18h8" />
      <path d="M12 14v4" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  tag: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M8 14h2v2H8zM14 14h2v2h-2z" />
    </svg>
  ),
  finance: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 8h4.5a2.5 2.5 0 0 1 0 5H9v-5zM9 13h5a2.5 2.5 0 0 1 0 5H9v-5z" />
    </svg>
  ),
  compare: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 7h4v10H4zM10 4h4v16h-4zM16 9h4v8h-4z" />
    </svg>
  ),
};

const ACTIONS = [
  { id: "emi", label: "Calculate EMI", icon: ICONS.emi, variant: "default" },
  {
    id: "dealer",
    label: "Get Dealer Assistance",
    icon: ICONS.dealer,
    variant: "default",
  },
  {
    id: "callback",
    label: "Request Call Back",
    icon: ICONS.phone,
    variant: "default",
  },
  {
    id: "best-deal",
    label: "Get Best Deal",
    icon: ICONS.tag,
    variant: "accent",
  },
  {
    id: "test-drive",
    label: "Book Test Drive",
    icon: ICONS.calendar,
    variant: "primary",
  },
  {
    id: "finance",
    label: "Get Finance Help",
    icon: ICONS.finance,
    variant: "default",
  },
  {
    id: "compare",
    label: "Compare EV",
    icon: ICONS.compare,
    variant: "default",
  },
];

function ActionButton({ label, icon, variant, onClick }) {
  const className = [
    "cd-action-bar__btn",
    variant === "primary" && "cd-action-bar__btn--primary",
    variant === "accent" && "cd-action-bar__btn--accent",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={className} onClick={onClick}>
      <span className="cd-action-bar__icon">{icon}</span>
      <span className="cd-action-bar__label">{label}</span>
    </button>
  );
}

export default function DetailActionBar({
  onEmi,
  onDealer,
  onRequestCallback,
  onGetBestDeal,
  onTestDrive,
  onFinanceHelp,
  onCompare,
}) {
  const handlers = {
    emi: onEmi,
    dealer: onDealer,
    callback: onRequestCallback,
    "best-deal": onGetBestDeal,
    "test-drive": onTestDrive,
    finance: onFinanceHelp,
    compare: onCompare,
  };

  return (
    <div className="cd-action-bar-wrap">
      <nav
        className="cd-action-bar"
        aria-label="Quick actions"
      >
        {ACTIONS.map((action) => (
          <ActionButton
            key={action.id}
            label={action.label}
            icon={action.icon}
            variant={action.variant}
            onClick={handlers[action.id]}
          />
        ))}
      </nav>
    </div>
  );
}
