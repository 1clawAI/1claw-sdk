/**
 * Every relative import in the published declarations must carry a `.js`
 * extension. Under `moduleResolution: "NodeNext"` an extensionless one does
 * not resolve, and with `skipLibCheck` TypeScript does not say so — it types
 * the whole import as `any`. The client, every resource and every response
 * type came out `any` for such consumers until 2026-09-19.
 *
 * Runs against `dist/` when it exists (CI builds before testing); skips
 * otherwise so a source-only checkout still passes.
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir: string): string[] {
    return readdirSync(dir).flatMap((n) => {
        const p = join(dir, n);
        return statSync(p).isDirectory() ? walk(p) : p.endsWith(".d.ts") ? [p] : [];
    });
}

describe("published declarations", () => {
    const dist = join(__dirname, "..", "..", "dist");
    it.skipIf(!existsSync(dist))("use explicit .js extensions on every relative import", () => {
        const bad: string[] = [];
        for (const f of walk(dist)) {
            const src = readFileSync(f, "utf8");
            for (const m of src.matchAll(/from\s+["'](\.\.?\/[^"']+)["']/g)) {
                if (!m[1].endsWith(".js") && !m[1].endsWith(".json")) bad.push(`${f}: ${m[1]}`);
            }
        }
        expect(bad, bad.slice(0, 5).join("\n")).toEqual([]);
    });
});
