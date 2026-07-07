/**
 * Vercel serverless — frontend liveness probe.
 * GET /api/health → 200 JSON (no auth, read-only).
 */

export const config = {
  runtime: "nodejs",
};

export default function handler() {
  const commit =
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ||
    process.env.VITE_APP_RELEASE ||
    "unknown";

  return new Response(
    JSON.stringify({
      ok: true,
      service: "evsavari-frontend",
      timestamp: new Date().toISOString(),
      commit,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    }
  );
}
