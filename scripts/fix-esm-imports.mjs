#!/usr/bin/env node
/**
 * Node ESM requires explicit .js extensions on relative imports.
 * TypeScript (moduleResolution: bundler) omits them — this postbuild patches dist/.
 *
 * Declarations too. A `.d.ts` that says `from "../types"` does not resolve
 * under `moduleResolution: "NodeNext"`, and with `skipLibCheck` (everyone's
 * default) TypeScript does not complain — it types the import as `any`. The
 * whole `OneclawClient` came out as `any` for such consumers, which is how
 * the muse-connector caught it (2026-09-19). `.d.ts` imports get the `.js`
 * extension, which is what TypeScript itself emits for NodeNext projects.
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
    // A declaration's sibling is `x.d.ts`; the specifier still says `x.js`.
    const exists = (rel) =>
      fs.existsSync(path.join(fromDir, rel + ".js")) ||
      fs.existsSync(path.join(fromDir, rel + ".d.ts"));
    if (exists(spec)) {
      return `${keyword} ${quote}${spec}.js${quote}`;
    }
    if (exists(path.join(spec, "index"))) {
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
    else if (ent.name.endsWith(".js") || ent.name.endsWith(".d.ts")) {
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
