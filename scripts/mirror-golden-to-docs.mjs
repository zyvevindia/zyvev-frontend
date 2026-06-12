/**
 * Mirror public/catalog/golden-dataset → docs/catalog/golden-dataset (read-only copy).
 * Public is canonical; docs must not be edited manually.
 */

import fs from "node:fs";
import path from "node:path";

import { DOCS_GOLDEN, PUBLIC_GOLDEN, listGoldenFiles } from "./lib/goldenCatalogPaths.mjs";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyTree(srcRoot, destRoot) {
  ensureDir(destRoot);

  for (const entry of fs.readdirSync(srcRoot, { withFileTypes: true })) {
    const srcPath = path.join(srcRoot, entry.name);
    const destPath = path.join(destRoot, entry.name);

    if (entry.isDirectory()) {
      copyTree(srcPath, destPath);
    } else {
      ensureDir(path.dirname(destPath));
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function removeOrphans(destRoot, allowedRelativeFiles) {
  const allowed = new Set(allowedRelativeFiles);

  const walk = (dir, prefix = "") => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const abs = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(abs, rel);
        if (fs.readdirSync(abs).length === 0) {
          fs.rmdirSync(abs);
        }
      } else if (!allowed.has(rel.replace(/\\/g, "/"))) {
        fs.unlinkSync(abs);
      }
    }
  };

  if (fs.existsSync(destRoot)) {
    walk(destRoot);
  }
}

function main() {
  if (!fs.existsSync(PUBLIC_GOLDEN)) {
    console.error(`Missing canonical golden dataset: ${PUBLIC_GOLDEN}`);
    process.exit(1);
  }

  copyTree(PUBLIC_GOLDEN, DOCS_GOLDEN);

  const publicFiles = listGoldenFiles(PUBLIC_GOLDEN);
  removeOrphans(DOCS_GOLDEN, publicFiles);

  console.log(
    `Mirrored ${publicFiles.length} file(s) from public/catalog/golden-dataset → docs/catalog/golden-dataset`,
  );
}

main();
