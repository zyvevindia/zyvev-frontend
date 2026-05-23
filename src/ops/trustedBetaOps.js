/**
 * Trusted beta trend snapshots — extends public beta ops envelope.
 */

const TRUST_WEEKLY_KEY = "evsavari-trusted-beta-weekly-v1";
const MAX = 10;

function readTrustWeekly() {
  try {
    const raw = localStorage.getItem(TRUST_WEEKLY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeTrustWeekly(arr) {
  try {
    localStorage.setItem(TRUST_WEEKLY_KEY, JSON.stringify(arr.slice(0, MAX)));
  } catch {
    /* quota */
  }
}

export function recordTrustedBetaWeeklySnapshot(snapshot) {
  const week = new Date().toISOString().slice(0, 10);
  const filtered = readTrustWeekly().filter((s) => s.week !== week);
  writeTrustWeekly([
    { week, at: new Date().toISOString(), ...snapshot },
    ...filtered,
  ]);
}

export function getTrustedBetaWeeklySnapshots() {
  return readTrustWeekly().slice(0, 8);
}
