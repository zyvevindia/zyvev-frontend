/**
 * Lightweight CSV download for ops exports.
 */

function escapeCell(value) {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * @param {string[]} headers
 * @param {Array<Record<string, unknown>>} rows
 * @param {string} filename
 */
export function downloadCsv(headers, rows, filename) {
  const lines = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) =>
      headers.map((h) => escapeCell(row[h])).join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * @param {object[]} items
 * @param {(item: object) => Record<string, unknown>} mapRow
 * @param {string} filename
 */
export function downloadCsvFromObjects(items, mapRow, filename) {
  if (!items.length) return false;
  const rows = items.map(mapRow);
  const headers = Object.keys(rows[0]);
  downloadCsv(headers, rows, filename);
  return true;
}
