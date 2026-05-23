/**
 * Soft-launch manual QA checklist sections.
 */

export const LAUNCH_CHECKLIST_STORAGE_KEY = "evsavari-launch-checklist-v1";

export const LAUNCH_CHECKLIST_SECTIONS = [
  {
    id: "homepage",
    title: "Homepage QA",
    items: [
      { id: "home-load", label: "Catalog loads without dual error states" },
      { id: "home-cards", label: "EV cards show listing images (not compare thumbs only)" },
      { id: "home-filters", label: "Filters return results or empty state (not spinner forever)" },
      { id: "home-cold", label: "Cold-start message + retry works if API slow" },
    ],
  },
  {
    id: "compare",
    title: "Compare QA",
    items: [
      { id: "cmp-2", label: "2-EV compare renders scores + pills" },
      { id: "cmp-3", label: "3-EV compare — no overflow / clipped scores on mobile" },
      { id: "cmp-seo", label: "Compare SEO page (e.g. comet vs tiago) loads both vehicles" },
      { id: "cmp-hub", label: "Compare hub empty state + popular links work" },
    ],
  },
  {
    id: "leads",
    title: "Lead-flow QA",
    items: [
      { id: "lead-callback", label: "Callback / inquiry submit shows success or clear error" },
      { id: "lead-finance", label: "Finance inquiry modal closes after success" },
      { id: "lead-testdrive", label: "Test drive flow — no frozen modal" },
      { id: "lead-wa", label: "WhatsApp intent (if configured) fires without console errors" },
      { id: "lead-turnstile", label: "Turnstile / validation errors are human-readable" },
    ],
  },
  {
    id: "mobile",
    title: "Mobile QA",
    items: [
      { id: "mob-iphone", label: "iPhone width — nav, compare CTA, no horizontal bleed" },
      { id: "mob-android", label: "Android mid-range — sticky compare bar does not overlap content" },
      { id: "mob-tablet", label: "Tablet — compare table scrolls horizontally when needed" },
    ],
  },
  {
    id: "seo",
    title: "SEO QA",
    items: [
      { id: "seo-canonical", label: "Canonical URLs on compare + discovery pages" },
      { id: "seo-sitemap", label: "sitemap.xml + child sitemaps reachable" },
      { id: "seo-robots", label: "robots.txt allows indexing of public routes" },
      { id: "seo-schema", label: "JSON-LD present on compare hub (no duplicate blocks)" },
    ],
  },
  {
    id: "analytics",
    title: "Analytics QA",
    items: [
      { id: "ana-ga", label: "GA4 page_view on navigation (if VITE_GA_ID set)" },
      { id: "ana-sentry", label: "Sentry captures test error in staging (if DSN set)" },
      { id: "ana-no-pii", label: "No PII in custom event payloads" },
    ],
  },
  {
    id: "images",
    title: "Image QA",
    items: [
      { id: "img-cdn", label: "No requests to cdn.evsavari.com in Network tab" },
      { id: "img-tier1", label: "Tier-1 families show Cloudinary images (not broken 404)" },
      { id: "img-placeholder", label: "Placeholder text only when asset truly missing" },
    ],
  },
];

export function defaultChecklistState() {
  const completed = {};
  const notes = {};
  const blockers = {};
  for (const section of LAUNCH_CHECKLIST_SECTIONS) {
    for (const item of section.items) {
      completed[item.id] = false;
      notes[item.id] = "";
      blockers[item.id] = false;
    }
  }
  return { completed, notes, blockers, updatedAt: null };
}

export function loadChecklistState() {
  try {
    const raw = localStorage.getItem(LAUNCH_CHECKLIST_STORAGE_KEY);
    if (!raw) return defaultChecklistState();
    const parsed = JSON.parse(raw);
    const base = defaultChecklistState();
    return {
      ...base,
      completed: { ...base.completed, ...parsed.completed },
      notes: { ...base.notes, ...parsed.notes },
      blockers: { ...base.blockers, ...parsed.blockers },
      updatedAt: parsed.updatedAt || null,
    };
  } catch {
    return defaultChecklistState();
  }
}

export function saveChecklistState(state) {
  const payload = {
    ...state,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(
    LAUNCH_CHECKLIST_STORAGE_KEY,
    JSON.stringify(payload)
  );
  return payload;
}

export function checklistProgress(state) {
  const ids = LAUNCH_CHECKLIST_SECTIONS.flatMap((s) =>
    s.items.map((i) => i.id)
  );
  const done = ids.filter((id) => state.completed?.[id]).length;
  const blockers = ids.filter((id) => state.blockers?.[id]).length;
  return {
    total: ids.length,
    done,
    blockers,
    percent: ids.length ? Math.round((done / ids.length) * 100) : 0,
  };
}
