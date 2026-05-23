import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { API_URL } from "../../config";
import { safeFetchJsonWithRetry } from "../../utils/safeFetch";
import {
  buildTier1FamilyMediaRows,
  summarizeTier1MediaHealth,
  auditProductionFamilyManifest,
  MEDIA_HEALTH_STATUS,
} from "../../ops/tier1MediaHealth";
import { buildMediaIntegrityReport, buildMediaPolishReport } from "../../utils/mediaAudit";
import { tier1ManifestCoverage } from "../../ops/tier1Families";
import OpsExportActions from "../../components/admin/OpsExportActions";
import { adminBadge, adminCard, statusTone } from "./adminOpsStyles";

export default function MediaHealthPage() {
  const [loading, setLoading] = useState(false);
  const [fetchNote, setFetchNote] = useState("");

  const rows = useMemo(() => buildTier1FamilyMediaRows(), []);
  const summary = useMemo(() => summarizeTier1MediaHealth(rows), [rows]);
  const manifestAudit = useMemo(() => auditProductionFamilyManifest(), []);
  const coverage = tier1ManifestCoverage();
  const integrity = useMemo(
    () => buildMediaIntegrityReport({ brokenProbeResults: [] }),
    []
  );
  const polish = useMemo(
    () => buildMediaPolishReport({ brokenProbeResults: [] }),
    []
  );

  const loadCatalogSample = useCallback(async () => {
    setLoading(true);
    setFetchNote("");
    const result = await safeFetchJsonWithRetry(`${API_URL}/cars?limit=80`, {
      label: "media-health-catalog",
      timeoutMs: 20000,
    });
    setLoading(false);
    if (!result.ok) {
      setFetchNote(result.error || "Catalog fetch failed");
      return;
    }
    const cars = result.data?.cars || [];
    const tier1 = cars.filter((c) => {
      const slug = String(c.slug || "").toLowerCase();
      return summary.missingManifest?.some(
        (f) => slug === f || slug.startsWith(`${f}-`)
      );
    });
    setFetchNote(
      `API sample: ${cars.length} vehicles · ${tier1.length} tier-1 variant rows without manifest`
    );
  }, [summary.missingManifest]);

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem" }}>
      <p style={{ marginBottom: "0.5rem" }}>
        <Link to="/admin">← Admin</Link>
        {" · "}
        <Link to="/admin/system-status">System status</Link>
        {" · "}
        <Link to="/admin/media-qa">Media QA</Link>
      </p>

      <h1 style={{ marginTop: 0 }}>Tier-1 media health</h1>
      <p style={{ color: "#64748b", maxWidth: 720 }}>
        Tata, MG, Mahindra, BYD, Hyundai — manifest completeness and Cloudinary
        readiness. Run <code>npm run media:verify</code> locally for live URL probes.
        See <code>docs/operations/media-gap-audit.md</code>.
      </p>
      <OpsExportActions
        reportType="media-health"
        rows={rows}
        fullReport={{ summary, rows, coverage, manifestAudit, integrity, polish }}
        filenamePrefix="media-health"
        mapCsvRow={(r) => ({
          familySlug: r.familySlug,
          oem: r.oem,
          status: r.status,
          completenessPercent: r.completenessPercent,
          inManifest: r.inManifest,
        })}
      />

      <div style={adminCard}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "1rem",
          }}
        >
          <div>
            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Manifest coverage</div>
            <strong style={{ fontSize: "1.25rem" }}>{coverage.percent}%</strong>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
              {coverage.manifestCount}/{coverage.total} families
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Avg role completeness</div>
            <strong style={{ fontSize: "1.25rem" }}>{summary.avgCompletenessPercent}%</strong>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Missing compare</div>
            <strong style={{ fontSize: "1.25rem" }}>{summary.missingCompare}</strong>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Placeholder families</div>
            <strong style={{ fontSize: "1.25rem" }}>{summary.placeholderFamilies}</strong>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Fallback usage</div>
            <strong style={{ fontSize: "1.25rem" }}>{integrity.fallbackUsagePct}%</strong>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Compare ready</div>
            <strong style={{ fontSize: "1.25rem" }}>{integrity.compareReadyPct}%</strong>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Gallery complete</div>
            <strong style={{ fontSize: "1.25rem" }}>{integrity.galleryCompletePct}%</strong>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>READY</div>
            <strong style={{ fontSize: "1.25rem" }}>
              {summary.statusCounts?.[MEDIA_HEALTH_STATUS.READY] ?? 0}
            </strong>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
              Visual consistency
            </div>
            <strong style={{ fontSize: "1.25rem" }}>
              {polish.premiumVisualConsistencyScore}
            </strong>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Social images</div>
            <strong style={{ fontSize: "1.25rem" }}>
              {polish.socialImageCompletenessPct}%
            </strong>
          </div>
        </div>
        {summary.auditedAt ? (
          <p style={{ marginTop: 12, fontSize: "0.8rem", color: "#94a3b8" }}>
            Audited: {new Date(summary.auditedAt).toLocaleString("en-IN")}
          </p>
        ) : null}
        <button
          type="button"
          onClick={loadCatalogSample}
          disabled={loading}
          style={{
            marginTop: 16,
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: "#2563eb",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {loading ? "Loading API sample…" : "Probe API tier-1 slugs"}
        </button>
        {fetchNote ? (
          <p style={{ marginTop: 8, fontSize: "0.85rem", color: "#475569" }}>
            {fetchNote}
          </p>
        ) : null}
      </div>

      {coverage.missingManifest.length > 0 ? (
        <div style={adminCard}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Missing Cloudinary manifest</h2>
          <p style={{ fontSize: "0.9rem", color: "#b45309" }}>
            {coverage.missingManifest.join(", ")}
          </p>
        </div>
      ) : null}

      {polish.weakAuthorityVisuals?.length > 0 ? (
        <div style={adminCard}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Weak authority visuals</h2>
          <ul style={{ fontSize: "0.85rem", lineHeight: 1.7 }}>
            {polish.weakAuthorityVisuals.map((row) => (
              <li key={row.familySlug}>
                <code>{row.familySlug}</code>
                {Array.isArray(row.roles) ? ` — ${row.roles.join(", ")}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {polish.lowTrustSocialPreviews?.length > 0 ? (
        <div style={adminCard}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>
            Low-trust social previews
          </h2>
          <p style={{ fontSize: "0.85rem" }}>
            Quality: {polish.socialPreviewTrustQuality} ·{" "}
            {polish.lowTrustSocialPreviews.join(", ")}
          </p>
        </div>
      ) : null}

      <div style={adminCard}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Practical visual usefulness</h2>
        <p style={{ fontSize: "0.85rem" }}>
          Practical visuals: {polish.practicalVisualUsefulness ?? "—"} · Authority memorability:{" "}
          {polish.authorityVisualMemorability ?? "—"}
        </p>
      </div>

      {polish.guideImageUsefulnessGaps?.length > 0 ? (
        <div style={adminCard}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Guide-image usefulness gaps</h2>
          <p style={{ fontSize: "0.85rem" }}>
            {Array.isArray(polish.guideImageUsefulnessGaps)
              ? polish.guideImageUsefulnessGaps.join(", ")
              : "—"}
          </p>
        </div>
      ) : null}

      <div style={adminCard}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Retention-oriented visual trust</h2>
        <p style={{ fontSize: "0.85rem" }}>
          Authority visual retention: {polish.authorityVisualRetentionQuality ?? "—"}
          {" · "}
          Social preview persistence: {polish.socialPreviewTrustPersistence ?? "—"}
          {" · "}
          Compare image trust: {polish.compareImageTrustConsistency ?? "—"}
        </p>
      </div>

      {polish.weakSocialPreviewTrust?.length > 0 ? (
        <div style={adminCard}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Weak social-preview trust</h2>
          <p style={{ fontSize: "0.85rem" }}>
            Durability: {polish.socialPreviewTrustDurability ?? "—"} ·{" "}
            {polish.weakSocialPreviewTrust.join(", ")}
          </p>
        </div>
      ) : null}

      {polish.lowTrustPracticalVisuals?.length > 0 ? (
        <div style={adminCard}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>
            Low-trust practical visuals
          </h2>
          <p style={{ fontSize: "0.85rem" }}>
            {polish.lowTrustPracticalVisuals.join(", ")}
          </p>
        </div>
      ) : null}

      {polish.guideImageRetentionGaps?.length > 0 ? (
        <div style={adminCard}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Guide-image retention gaps</h2>
          <p style={{ fontSize: "0.85rem" }}>
            {Array.isArray(polish.guideImageRetentionGaps)
              ? polish.guideImageRetentionGaps.join(", ")
              : "—"}
          </p>
        </div>
      ) : null}

      {polish.practicalGuideVisualGaps?.length > 0 ? (
        <div style={adminCard}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>
            Practical-guide visual gaps
          </h2>
          <p style={{ fontSize: "0.85rem" }}>
            {polish.practicalGuideVisualGaps.join(", ")}
          </p>
        </div>
      ) : null}

      {polish ? (
        <div style={adminCard}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Media stability under traffic</h2>
          <p style={{ fontSize: "0.85rem", lineHeight: 1.7 }}>
            Media stability: {polish.mediaStabilityUnderTraffic ?? "—"}
            {" · "}
            Perceived speed: {polish.perceivedSpeedConsistency ?? "—"}
            {" · "}
            Visual trust persistence: {polish.visualTrustPersistence ?? "—"}
          </p>
        </div>
      ) : null}

      {polish?.guideImageQualityGaps?.length > 0 ? (
        <div style={adminCard}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Guide-image quality gaps</h2>
          <p style={{ fontSize: "0.85rem" }}>
            {polish.guideImageQualityGaps.join(", ")}
          </p>
        </div>
      ) : null}

      {polish ? (
        <div style={adminCard}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Practical & authority visual trust</h2>
          <p style={{ fontSize: "0.85rem", lineHeight: 1.7 }}>
            Practical visual usefulness: {polish.practicalVisualUsefulness ?? "—"}
            {" · "}
            Authority visual trust: {polish.authorityVisualTrustDurability ?? "—"}
            {" · "}
            Social preview memorability: {polish.socialPreviewMemorability ?? "—"}
          </p>
        </div>
      ) : null}

      {polish?.weakAuthorityImagery?.length > 0 ? (
        <div style={adminCard}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Weak authority imagery</h2>
          <ul style={{ fontSize: "0.85rem", lineHeight: 1.7 }}>
            {polish.weakAuthorityImagery.map((row, i) => (
              <li key={row.familySlug || i}>
                <code>{row.familySlug}</code>
                {row.roles?.length ? ` — ${row.roles.join(", ")}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {polish?.lowTrustPracticalVisuals?.length > 0 ? (
        <div style={adminCard}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Low-trust practical visuals</h2>
          <p style={{ fontSize: "0.85rem" }}>
            {Array.isArray(polish.lowTrustPracticalVisuals)
              ? polish.lowTrustPracticalVisuals.join(", ")
              : "Review practical guide imagery"}
          </p>
        </div>
      ) : null}

      {polish.weakPracticalGuideVisuals?.length > 0 ? (
        <div style={adminCard}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Weak practical visuals</h2>
          <p style={{ fontSize: "0.85rem" }}>
            {polish.weakPracticalGuideVisuals.join(", ")}
          </p>
        </div>
      ) : null}

      {polish.lowTrustAuthorityImagery?.length > 0 ? (
        <div style={adminCard}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Low-trust authority imagery</h2>
          <ul style={{ fontSize: "0.85rem", lineHeight: 1.7 }}>
            {polish.lowTrustAuthorityImagery.map((row, i) => (
              <li key={row.familySlug || i}>
                <code>{row.familySlug}</code>
                {row.roles?.length ? ` — ${row.roles.join(", ")}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {polish.weakSocialPreviewTrust?.length > 0 ? (
        <div style={adminCard}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Weak social-preview trust</h2>
          <p style={{ fontSize: "0.85rem" }}>
            {polish.weakSocialPreviewTrust.join(", ")}
          </p>
        </div>
      ) : null}

      {polish.guideImageUsefulnessGaps?.length > 0 ? (
        <div style={adminCard}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Guide-image usefulness gaps</h2>
          <p style={{ fontSize: "0.85rem" }}>
            {Array.isArray(polish.guideImageUsefulnessGaps)
              ? polish.guideImageUsefulnessGaps.join(", ")
              : "Review manifest gaps"}
          </p>
        </div>
      ) : null}

      {polish.weakTrustVisuals?.length > 0 ? (
        <div style={adminCard}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Weak trust visuals</h2>
          <ul style={{ fontSize: "0.85rem", lineHeight: 1.7 }}>
            {polish.weakTrustVisuals.map((row) => (
              <li key={row.familySlug}>
                <code>{row.familySlug}</code> — {row.roles?.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {polish.authorityContentImageGaps?.length > 0 ? (
        <div style={adminCard}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>
            Authority-content image gaps
          </h2>
          <ul style={{ fontSize: "0.85rem", lineHeight: 1.7 }}>
            {polish.authorityContentImageGaps.map((row) => (
              <li key={row.familySlug}>
                <code>{row.familySlug}</code> — {row.missing?.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {polish.needsOemReplacement?.length > 0 ? (
        <div style={adminCard}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Needs OEM replacement</h2>
          <ul style={{ fontSize: "0.85rem", lineHeight: 1.7 }}>
            {polish.needsOemReplacement.map((row) => (
              <li key={row.familySlug}>
                <code>{row.familySlug}</code>
                {row.missing?.length ? ` — ${row.missing.join(", ")}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {polish.weakSocialImageCoverage?.length > 0 ? (
        <div style={adminCard}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Weak social image coverage</h2>
          <p style={{ fontSize: "0.85rem" }}>
            {polish.weakSocialImageCoverage.join(", ")}
          </p>
        </div>
      ) : null}

      {polish.visualInconsistencyHotspots?.length > 0 ? (
        <div style={adminCard}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>
            Visual inconsistency hotspots
          </h2>
          <ul style={{ fontSize: "0.85rem", lineHeight: 1.7 }}>
            {polish.visualInconsistencyHotspots.map((row) => (
              <li key={row.familySlug}>
                <code>{row.familySlug}</code> — {row.roles?.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {integrity.topMissing.length > 0 ? (
        <div style={adminCard}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Top manifest gaps</h2>
          <ul style={{ fontSize: "0.85rem", lineHeight: 1.7 }}>
            {integrity.topMissing.map((row) => (
              <li key={row.familySlug}>
                <code>{row.familySlug}</code> — {row.missing.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            fontSize: "0.85rem",
            borderCollapse: "collapse",
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
          }}
        >
          <thead>
            <tr style={{ textAlign: "left", background: "#f8fafc" }}>
              <th style={{ padding: 10 }}>OEM</th>
              <th style={{ padding: 10 }}>Family</th>
              <th style={{ padding: 10 }}>Status</th>
              <th style={{ padding: 10 }}>Manifest</th>
              <th style={{ padding: 10 }}>Hero</th>
              <th style={{ padding: 10 }}>Compare</th>
              <th style={{ padding: 10 }}>Thumb</th>
              <th style={{ padding: 10 }}>Gallery</th>
              <th style={{ padding: 10 }}>%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.familySlug} style={{ borderTop: "1px solid #f1f5f9" }}>
                <td style={{ padding: 10 }}>{row.oem}</td>
                <td style={{ padding: 10 }}>
                  <code>{row.familySlug}</code>
                </td>
                <td style={{ padding: 10 }}>
                  <span style={adminBadge(statusTone[row.status] || "neutral")}>
                    {row.status}
                  </span>
                </td>
                <td style={{ padding: 10 }}>
                  <span style={adminBadge(row.inManifest ? "green" : "yellow")}>
                    {row.inManifest ? "Yes" : "No"}
                  </span>
                </td>
                {["hero", "compare", "listing", "gallery"].map((role) => (
                  <td key={role} style={{ padding: 10 }}>
                    <span
                      style={adminBadge(
                        row.roles[role]?.status === "ok" ? "green" : "red"
                      )}
                    >
                      {row.roles[role]?.status === "ok" ? "OK" : "Gap"}
                    </span>
                  </td>
                ))}
                <td style={{ padding: 10, fontWeight: 700 }}>
                  {row.completenessPercent}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ ...adminCard, marginTop: "1.25rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Production manifest audit</h2>
        <ul style={{ fontSize: "0.85rem", lineHeight: 1.7 }}>
          {manifestAudit.map((f) => (
            <li key={f.familySlug}>
              <code>{f.familySlug}</code> —{" "}
              {f.complete ? "complete" : `missing: ${f.missing.join(", ")}`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
