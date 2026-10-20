import { describe, it, expect, vi, afterEach } from "vitest";
import { createClient } from "../index";

describe("agents.update / platform.patchConnectionAgent step-up", () => {
    afterEach(() => vi.restoreAllMocks());

    function capture() {
        const calls: { url: string; init: RequestInit }[] = [];
        vi.stubGlobal(
            "fetch",
            vi.fn(async (url: string, init: RequestInit) => {
                calls.push({ url, init });
                return new Response(JSON.stringify({ id: "a" }), { status: 200, headers: { "Content-Type": "application/json" } });
            }),
        );
        return calls;
    }

    it("sends X-Auth-Confirm when confirm is given (raw signing needs a step-up)", async () => {
        const calls = capture();
        const c = createClient({ baseUrl: "https://api.test", token: "t" });
        await c.agents.update("a", { raw_signing_enabled: true } as never, { confirm: "pw" });
        const h = calls[0].init.headers as Record<string, string>;
        expect(h["X-Auth-Confirm"]).toBe("pw");
    });

    it("sends no X-Auth-Confirm without confirm", async () => {
        const calls = capture();
        const c = createClient({ baseUrl: "https://api.test", token: "t" });
        await c.agents.update("a", { name: "x" } as never);
        const h = calls[0].init.headers as Record<string, string>;
        expect(h["X-Auth-Confirm"]).toBeUndefined();
    });

    it("platform patch forwards the end user's re-auth token", async () => {
        const calls = capture();
        const c = createClient({ baseUrl: "https://api.test", token: "plt_x" });
        await c.platform.patchConnectionAgent("c", "a", { raw_signing_enabled: true }, { confirm: "rt" });
        const h = calls[0].init.headers as Record<string, string>;
        expect(h["X-Auth-Confirm"]).toBe("rt");
    });
});
