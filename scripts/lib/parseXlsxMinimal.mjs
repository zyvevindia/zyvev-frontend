/**
 * Minimal XLSX reader — shared strings + sheet grid (no npm deps).
 */
import { readFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";

function colLettersToIndex(col) {
  let n = 0;
  for (const ch of col) {
    n = n * 26 + (ch.charCodeAt(0) - 64);
  }
  return n - 1;
}

function parseCellRef(ref) {
  const m = /^([A-Z]+)(\d+)$/.exec(ref);
  if (!m) return { col: 0, row: 0 };
  return { col: colLettersToIndex(m[1]), row: Number(m[2]) - 1 };
}

function decodeXmlEntities(s) {
  return String(s)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseSharedStrings(xml) {
  const strings = [];
  const siBlocks = xml.match(/<si[\s\S]*?<\/si>/g) || [];
  for (const block of siBlocks) {
    const parts = block.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || [];
    const text = parts
      .map((p) => {
        const inner = p.replace(/<t[^>]*>/, "").replace(/<\/t>$/, "");
        return decodeXmlEntities(inner);
      })
      .join("");
    strings.push(text);
  }
  return strings;
}

function parseSheet(xml, sharedStrings) {
  const grid = [];
  const rowBlocks = xml.match(/<row[^>]*>[\s\S]*?<\/row>/g) || [];
  for (const rowBlock of rowBlocks) {
    const cells = rowBlock.match(/<c [^>]+>[\s\S]*?<\/c>/g) || [];
    for (const cell of cells) {
      const refMatch = / r="([^"]+)"/.exec(cell);
      if (!refMatch) continue;
      const { col, row } = parseCellRef(refMatch[1]);
      const typeMatch = / t="([^"]+)"/.exec(cell);
      const type = typeMatch ? typeMatch[1] : null;
      const vMatch = /<v>([\s\S]*?)<\/v>/.exec(cell);
      if (!vMatch) continue;
      let value = vMatch[1];
      if (type === "s") {
        value = sharedStrings[Number(value)] ?? "";
      } else if (/^\d+(\.\d+)?$/.test(value)) {
        value = Number(value);
      }
      if (!grid[row]) grid[row] = [];
      grid[row][col] = value;
    }
  }
  return grid;
}

function unzipXlsx(xlsxPath, destDir) {
  const zipPath = join(destDir, "workbook.zip");
  execFileSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `Copy-Item -LiteralPath '${xlsxPath.replace(/'/g, "''")}' -Destination '${zipPath.replace(/'/g, "''")}'; Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force`,
    ],
    { stdio: "pipe" }
  );
}

/**
 * @param {string} xlsxPath
 * @returns {Record<string, unknown[][]>}
 */
export function readXlsxSheets(xlsxPath) {
  if (!existsSync(xlsxPath)) {
    throw new Error(`Workbook not found: ${xlsxPath}`);
  }
  const tempDir = mkdtempSync(join(tmpdir(), "xlsx-"));
  try {
    unzipXlsx(xlsxPath, tempDir);
    const xlDir = join(tempDir, "xl");
    const sharedStrings = parseSharedStrings(
      readFileSync(join(xlDir, "sharedStrings.xml"), "utf8")
    );
    const workbookXml = readFileSync(join(xlDir, "workbook.xml"), "utf8");
    const relsXml = readFileSync(
      join(xlDir, "_rels", "workbook.xml.rels"),
      "utf8"
    );
    const sheetNameMatches = [
      ...workbookXml.matchAll(/<sheet name="([^"]+)"[^>]+r:id="([^"]+)"/g),
    ];
    const relMap = Object.fromEntries(
      [...relsXml.matchAll(/Id="([^"]+)"[^>]+Target="([^"]+)"/g)].map((m) => [
        m[1],
        m[2].replace(/^\//, ""),
      ])
    );
    const out = {};
    for (const [, name, rid] of sheetNameMatches) {
      const target = relMap[rid];
      if (!target) continue;
      const sheetPath = join(xlDir, target.replace(/\//g, "\\"));
      const grid = parseSheet(readFileSync(sheetPath, "utf8"), sharedStrings);
      out[name] = grid;
    }
    return out;
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

/** Key-value sheet (Field | Value | Status) → object */
export function sheetToKeyValue(grid) {
  const obj = {};
  for (let i = 1; i < grid.length; i += 1) {
    const row = grid[i] || [];
    const key = String(row[0] ?? "").trim();
    const value = row[1];
    if (!key) continue;
    obj[key] = value;
  }
  return obj;
}

/** Table with header row */
export function sheetToTable(grid, headerRowIndex = 0) {
  const headers = (grid[headerRowIndex] || []).map((h) =>
    String(h ?? "").trim()
  );
  const rows = [];
  for (let i = headerRowIndex + 1; i < grid.length; i += 1) {
    const row = grid[i] || [];
    if (!row.some((c) => c != null && String(c).trim() !== "")) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      if (!h) return;
      obj[h] = row[idx];
    });
    rows.push(obj);
  }
  return rows;
}
