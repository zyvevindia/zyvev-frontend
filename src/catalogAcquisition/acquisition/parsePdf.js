/**
 * PDF parsing — Node (pdf-parse) with table/variant matrix heuristics.
 */

/**
 * Extract table-like rows from plain text (pipe, tab, or multi-space separated).
 * @param {string} text
 * @returns {string[][]}
 */
export function extractTableRowsFromText(text = "") {
  const lines = String(text).split(/\r?\n/);
  const tables = [];
  let current = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (current.length >= 2) tables.push(current);
      current = [];
      continue;
    }

    const cells = trimmed.includes("|")
      ? trimmed.split("|").map((c) => c.trim()).filter(Boolean)
      : trimmed.includes("\t")
        ? trimmed.split("\t").map((c) => c.trim()).filter(Boolean)
        : trimmed.split(/\s{2,}/).map((c) => c.trim()).filter(Boolean);

    if (cells.length >= 2) {
      current.push(cells);
    } else if (current.length >= 2) {
      tables.push(current);
      current = [];
    }
  }
  if (current.length >= 2) tables.push(current);

  return tables;
}

/**
 * Detect variant matrix blocks from parsed PDF text.
 * @param {string} text
 * @returns {object[]}
 */
export function detectVariantMatrixFromText(text = "") {
  const tables = extractTableRowsFromText(text);
  const variants = [];

  for (const table of tables) {
    const header = table[0]?.join(" ").toLowerCase() || "";
    const looksLikeVariant =
      /variant|trim|grade|version|pack/i.test(header) ||
      /variant|trim|creative|empowered|pure/i.test(table.map((r) => r.join(" ")).join(" "));

    if (!looksLikeVariant || table.length < 2) continue;

    for (let i = 1; i < table.length; i++) {
      const row = table[i];
      if (!row[0]) continue;
      variants.push({
        variantName: row[0],
        rawCells: row.slice(1),
        source: "pdf_table",
      });
    }
  }

  return variants.slice(0, 12);
}

/**
 * Parse PDF buffer to structured content (Node only).
 * @param {Buffer|Uint8Array} buffer
 */
export async function parsePdfBuffer(buffer) {
  let pdfParse;
  try {
    const mod = await import("pdf-parse");
    pdfParse = mod.default || mod;
  } catch (err) {
    return {
      ok: false,
      errors: [`PDF parser unavailable: ${err?.message}`],
    };
  }

  try {
    const data = await pdfParse(buffer);
    const text = String(data.text || "").trim();
    const tables = extractTableRowsFromText(text);
    const variantMatrix = detectVariantMatrixFromText(text);

    return {
      ok: true,
      text,
      numPages: data.numpages ?? null,
      info: data.info || {},
      tables,
      variantMatrix,
      parsedAt: new Date().toISOString(),
      method: "pdf-parse",
    };
  } catch (err) {
    return {
      ok: false,
      errors: [err?.message || "PDF parse failed"],
    };
  }
}

/**
 * Build combined content string for AI/heuristic extraction from PDF parse result.
 */
export function pdfParseToExtractionContent(parseResult = {}) {
  if (!parseResult.ok) return "";
  const parts = [parseResult.text || ""];

  if (parseResult.tables?.length) {
    parts.push("\n\n--- EXTRACTED TABLES ---\n");
    for (const table of parseResult.tables.slice(0, 8)) {
      parts.push(table.map((row) => row.join(" | ")).join("\n"));
      parts.push("\n");
    }
  }

  if (parseResult.variantMatrix?.length) {
    parts.push("\n--- VARIANT MATRIX ---\n");
    for (const v of parseResult.variantMatrix) {
      parts.push(`${v.variantName}: ${(v.rawCells || []).join(" | ")}`);
    }
  }

  return parts.join("\n").trim();
}
