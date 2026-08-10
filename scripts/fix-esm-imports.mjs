#!/usr/bin/env node
/**
 * Node ESM requires explicit .js extensions on relative imports.
 * TypeScript (moduleResolution: bundler) omits them — this postbuild patches dist/.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const distDir =
  process.argv[2] ||
  path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");

if (!fs.existsSync(distDir)) {
  console.error(`fix-esm-imports: directory not found: ${distDir}`);
  process.exit(1);
}

const IMPORT_RE =
  /\b(from|export\s+\*?\s*(?:\{[^}]*\}\s*)?from)\s+(["'])(\.\.?[^"']+)\2/g;

function fixContent(filePath, content) {
  const fromDir = path.dirname(filePath);
  return content.replace(IMPORT_RE, (match, keyword, quote, spec) => {
    if (spec.endsWith(".js") || spec.endsWith(".json")) return match;
    if (fs.existsSync(path.join(fromDir, spec + ".js"))) {
      return `${keyword} ${quote}${spec}.js${quote}`;
    }
    if (fs.existsSync(path.join(fromDir, spec, "index.js"))) {
      return `${keyword} ${quote}${spec}/index.js${quote}`;
    }
    return match;
  });
}

function walk(dir) {
  let changed = 0;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) changed += walk(p);
    else if (ent.name.endsWith(".js")) {
      const orig = fs.readFileSync(p, "utf8");
      const fixed = fixContent(p, orig);
      if (fixed !== orig) {
        fs.writeFileSync(p, fixed);
        changed += 1;
      }
    }
  }
  return changed;
}

const changed = walk(distDir);
console.log(`fix-esm-imports: updated ${changed} file(s) in ${distDir}`);
