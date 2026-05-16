/**
 * Local session journey buffer — anonymous, for client-side context only.
 */

const BUFFER_KEY = "evsavari_journey_buffer";
const MAX_STEPS = 25;

export function appendJourneyStep(step) {
  if (typeof window === "undefined") return;

  try {
    const raw = sessionStorage.getItem(BUFFER_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.push({
      ...step,
      at: new Date().toISOString(),
    });
    const trimmed = list.slice(-MAX_STEPS);
    sessionStorage.setItem(
      BUFFER_KEY,
      JSON.stringify(trimmed)
    );
  } catch {
    /* ignore */
  }
}

export function getJourneyBuffer() {
  try {
    const raw = sessionStorage.getItem(BUFFER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getLastSeoSource() {
  const steps = getJourneyBuffer();
  for (let i = steps.length - 1; i >= 0; i--) {
    if (steps[i].type === "seo_to_detail") {
      return steps[i].seoPageSlug || null;
    }
  }
  return null;
}
