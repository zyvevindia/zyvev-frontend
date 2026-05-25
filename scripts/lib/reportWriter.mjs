/**
 * Write machine-readable + markdown audit reports under reports/.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

/**
 * @param {{ subdir: string; basename: string; json: object; markdown?: string }} opts
 * @returns {{ jsonPath: string; mdPath: string | null }}
 */
export function writeAuditReport({
  subdir,
  basename,
  json,
  markdown = "",
}) {
  const dir = join(ROOT, "reports", subdir);
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `${basename}-${stamp}`;
  const jsonPath = join(dir, `${fileBase}.json`);
  writeFileSync(jsonPath, `${JSON.stringify(json, null, 2)}\n`, "utf8");

  let mdPath = null;
  if (markdown) {
    mdPath = join(dir, `${fileBase}.md`);
    writeFileSync(mdPath, markdown, "utf8");
  }

  return { jsonPath, mdPath, dir };
}

export function formatPercent(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${Math.round(n)}%`;
}

function formatSummaryValue(value) {
  if (value == null) return "—";
  if (Array.isArray(value)) {
    if (
      value.every(
        (item) => item && typeof item === "object" && "field" in item
      )
    ) {
      return value.map((item) => `${item.field}: ${item.count}`).join("; ");
    }
    return value.join(", ");
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function reportHeader(title, summary = {}) {
  const lines = [
    `# ${title}`,
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
  ];
  for (const [k, v] of Object.entries(summary)) {
    lines.push(`- **${k}**: ${formatSummaryValue(v)}`);
  }
  lines.push("");
  return lines.join("\n");
}
