import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * This SDK carries two parallel type systems, and they drifted.
 *
 * `src/generated/api-types.ts` is produced from the OpenAPI spec by
 * `npm run generate`. `src/types.ts` is hand-written, with friendlier names and
 * doc comments, and it is what the examples and most consumers actually import.
 * Nothing kept the second in step with the first.
 *
 * Measured 2026-10-13: the hand-written agent interfaces were missing 30, 24
 * and 22 properties respectively. Among them `tx_approval_policy`,
 * `address_screening_policy`, the whole `memory_*` group, the `federation_*`
 * group, `environment` / `environment_locked`, `allow_eip7702`,
 * `allow_erc4337`, `default_llm_provider` / `default_llm_model` and
 * `discoverable`. An SDK user on these types could not set or read any of it,
 * and `examples/guardrail-hitl` failed to typecheck against the published
 * package while the feature it demonstrates has shipped for months.
 *
 * So this is additive-only by design: the check is that every property in the
 * spec schema appears in the hand-written interface. The reverse is allowed —
 * the hand-written types legitimately carry deprecated aliases (`tx_max_value_eth`)
 * and convenience shapes the wire format does not have.
 */

const SPEC = resolve(__dirname, "../../../openapi-spec/openapi.json");
const TYPES = resolve(__dirname, "../types.ts");

/** Property names declared in a `export interface X { ... }` block. */
function handWrittenProps(src: string, iface: string): Set<string> {
  const m = new RegExp(`export interface ${iface} \\{([\\s\\S]*?)\\n\\}`).exec(src);
  if (!m) throw new Error(`interface ${iface} not found in types.ts`);
  return new Set([...m[1].matchAll(/^\s*(\w+)\??:/gm)].map((x) => x[1]));
}

describe("hand-written types cover the OpenAPI schema", () => {
  const spec = JSON.parse(readFileSync(SPEC, "utf8"));
  const types = readFileSync(TYPES, "utf8");

  // The agent schemas are where the drift was and where the product surface
  // grows fastest. Extending this list is the right move when another
  // hand-written interface starts mattering.
  for (const iface of ["CreateAgentRequest", "UpdateAgentRequest", "AgentResponse"]) {
    it(`${iface} declares every property in the spec`, () => {
      const schema = spec?.components?.schemas?.[iface];
      expect(schema, `${iface} is not in the spec — regenerate openapi.json`).toBeTruthy();
      const specProps = Object.keys(schema.properties ?? {});
      expect(
        specProps.length,
        `${iface} has no properties in the spec, so this test is asserting nothing`,
      ).toBeGreaterThan(10);

      const hand = handWrittenProps(types, iface);
      const missing = specProps.filter((p) => !hand.has(p)).sort();
      expect(
        missing,
        `src/types.ts ${iface} is missing ${missing.length} propert${
          missing.length === 1 ? "y" : "ies"
        } the API accepts. A consumer importing this type cannot reach them. ` +
          `Add them (types map straightforwardly from the schema) rather than ` +
          `pointing people at src/generated/api-types.ts, which is not what the ` +
          `examples import.`,
      ).toEqual([]);
    });
  }

  it("the spec being read is the generated one, not a stale copy", () => {
    // The committed openapi.json is generated from openapi.yaml and has gone
    // stale before (2026-10-12: the two resume fields outlived their removal
    // from the YAML). If this test read a stale spec it would pass while the
    // types were behind the real API.
    const spec = JSON.parse(readFileSync(SPEC, "utf8"));
    const pkg = JSON.parse(
      readFileSync(resolve(__dirname, "../../../openapi-spec/package.json"), "utf8"),
    );
    expect(
      spec.info?.version,
      "openapi.json's info.version does not match the openapi-spec package version, " +
        "so the committed JSON was not regenerated. Run `npm run build` in packages/openapi-spec.",
    ).toBe(pkg.version);
  });
});
