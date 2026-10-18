import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient } from "../core/client";
import { DPoPManager } from "../auth/dpop";
import type { PaymentRequirement } from "../types";

const BASE = "https://api.test";
const PATH = "/v1/vaults/v1/secrets/key";
const requirement: PaymentRequirement = {
    x402Version: 1,
    description: "Pay per query",
    accepts: [{
        scheme: "exact",
        network: "eip155:8453",
        payTo: "0xabc",
        maxAmountRequired: "1000",
        resource: BASE + PATH,
        maxTimeoutSeconds: 300,
        asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        description: "Pay per query",
        mimeType: "application/json",
    }],
};
const secret = { value: "test-secret" };

function json(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

function headers(init?: RequestInit): Headers {
    return new Headers(init?.headers);
}

function makeSigner() {
    return {
        getAddress: vi.fn().mockResolvedValue("0xsigner"),
        signPayment: vi.fn().mockResolvedValue("test-signature"),
    };
}

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
});

describe("X402Resource.withPayment", () => {
    it.each([
        { apiKey: "1ck_test", endpoint: "/v1/auth/api-key-token", agentId: undefined },
        { apiKey: "ocv_test", endpoint: "/v1/auth/agent-token", agentId: undefined },
        { apiKey: "ocv_test", endpoint: "/v1/auth/agent-token", agentId: "agent-1" },
    ])("waits for the initial exchange with $apiKey and agentId=$agentId", async ({ apiKey, endpoint, agentId }) => {
        let release!: () => void;
        const gate = new Promise<void>(resolve => { release = resolve; });
        const fetcher = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
            if (String(url) === BASE + endpoint) {
                await gate;
                return json(200, { access_token: "exchanged-jwt", expires_in: 3600 });
            }
            return headers(init).get("Authorization") === "Bearer exchanged-jwt"
                ? json(200, secret)
                : json(401, { message: "Missing authentication" });
        });
        vi.stubGlobal("fetch", fetcher);
        const client = createClient({ baseUrl: BASE, apiKey, agentId });
        const signer = makeSigner();
        const pending = client.x402.withPayment("v1", "key", signer);
        await new Promise(resolve => setImmediate(resolve));
        const callsWhileExchangePending = fetcher.mock.calls.length;
        // Release before asserting, including against code that races the exchange.
        release();
        const result = await pending;

        expect(callsWhileExchangePending).toBe(1);
        expect(String(fetcher.mock.calls[0][0])).toBe(BASE + endpoint);
        expect(JSON.parse(fetcher.mock.calls[0][1]!.body as string)).toEqual({
            api_key: apiKey,
            ...(agentId ? { agent_id: agentId } : {}),
        });
        expect(fetcher).toHaveBeenCalledTimes(2);
        expect(String(fetcher.mock.calls[1][0])).toBe(BASE + PATH);
        expect(headers(fetcher.mock.calls[1][1]).get("Authorization")).toBe("Bearer exchanged-jwt");
        expect(result).toEqual({ data: secret, error: null, meta: { status: 200 } });
        expect(signer.signPayment).not.toHaveBeenCalled();
    });

    it("refreshes an expired agent token before the initial secret request", async () => {
        const now = Date.now();
        const clock = vi.spyOn(Date, "now").mockReturnValue(now);
        let exchanges = 0;
        const fetcher = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
            if (String(url).endsWith("/v1/auth/agent-token")) {
                return json(200, { access_token: `agent-${++exchanges}`, expires_in: 120 });
            }
            if (String(url).endsWith("/v1/vaults")) return json(200, { vaults: [] });
            return headers(init).get("Authorization") === "Bearer agent-2"
                ? json(200, secret)
                : json(401, { message: "Expired token" });
        });
        vi.stubGlobal("fetch", fetcher);
        const client = createClient({ baseUrl: BASE, apiKey: "ocv_test" });
        await client.vault.list();
        clock.mockReturnValue(now + 121_000);

        const result = await client.x402.withPayment("v1", "key");

        expect(exchanges).toBe(2);
        expect(result).toEqual({ data: secret, error: null, meta: { status: 200 } });
        expect(headers(fetcher.mock.calls[3][1]).get("Authorization")).toBe("Bearer agent-2");
    });

    it("uses current Bearer, fresh DPoP and runtime headers on both attempts", async () => {
        vi.stubEnv("ONECLAW_RUNTIME_ID", "runtime-1");
        const initDPoP = vi.spyOn(DPoPManager.prototype, "init").mockResolvedValue();
        const proof = vi.spyOn(DPoPManager.prototype, "generateProof")
            .mockResolvedValueOnce("proof-1")
            .mockResolvedValueOnce("proof-2");
        const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) =>
            headers(init).has("X-PAYMENT") ? json(200, secret) : json(402, requirement));
        vi.stubGlobal("fetch", fetcher);
        const client = createClient({ baseUrl: BASE, token: "token-1", dpop: true });
        const signer = makeSigner();
        signer.signPayment.mockImplementation(async () => {
            client.http.setToken("token-2");
            vi.stubEnv("ONECLAW_RUNTIME_ID", "runtime-2");
            return "test-signature";
        });

        const result = await client.x402.withPayment("v1", "key", signer);

        expect(result).toEqual({ data: secret, error: null, meta: { status: 200 } });
        expect(initDPoP).toHaveBeenCalledOnce();
        expect(proof.mock.calls).toEqual([["GET", BASE + PATH], ["GET", BASE + PATH]]);
        expect(fetcher).toHaveBeenCalledTimes(2);
        for (const [index, call] of fetcher.mock.calls.entries()) {
            expect(String(call[0])).toBe(BASE + PATH);
            expect(call[1]!.method).toBe("GET");
            const sent = headers(call[1]);
            expect(sent.get("Content-Type")).toBe("application/json");
            expect(sent.get("Authorization")).toBe(`Bearer token-${index + 1}`);
            expect(sent.get("DPoP")).toBe(`proof-${index + 1}`);
            expect(sent.get("X-1Claw-Runtime-Id")).toBe(`runtime-${index + 1}`);
        }
        expect(headers(fetcher.mock.calls[0][1]).has("X-PAYMENT")).toBe(false);
        expect(JSON.parse(headers(fetcher.mock.calls[1][1]).get("X-PAYMENT")!)).toEqual({
            x402Version: 1,
            scheme: "exact",
            network: "eip155:8453",
            payload: "test-signature",
        });
        expect(signer.signPayment).toHaveBeenCalledExactlyOnceWith(requirement.accepts[0]);
    });

    it("refreshes agent auth after the token expires during signing", async () => {
        const now = Date.now();
        const clock = vi.spyOn(Date, "now").mockReturnValue(now);
        let exchanges = 0;
        const fetcher = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
            if (String(url).endsWith("/v1/auth/agent-token")) {
                return json(200, { access_token: `agent-${++exchanges}`, expires_in: 120 });
            }
            if (!headers(init).has("X-PAYMENT")) return json(402, requirement);
            return headers(init).get("Authorization") === "Bearer agent-2"
                ? json(200, secret)
                : json(401, { message: "Expired token" });
        });
        vi.stubGlobal("fetch", fetcher);
        const client = createClient({ baseUrl: BASE, apiKey: "ocv_test" });
        const signer = makeSigner();
        signer.signPayment.mockImplementation(async () => {
            clock.mockReturnValue(now + 121_000);
            return "test-signature";
        });

        const result = await client.x402.withPayment("v1", "key", signer);

        expect(result).toEqual({ data: secret, error: null, meta: { status: 200 } });
        expect(exchanges).toBe(2);
        expect(fetcher).toHaveBeenCalledTimes(4);
        expect(headers(fetcher.mock.calls[1][1]).get("Authorization")).toBe("Bearer agent-1");
        expect(headers(fetcher.mock.calls[3][1]).get("Authorization")).toBe("Bearer agent-2");
        expect(signer.signPayment).toHaveBeenCalledOnce();
    });

    it.each(["initial", "paid"])("stops if agent authentication fails before the %s request", async attempt => {
        const now = Date.now();
        const clock = vi.spyOn(Date, "now").mockReturnValue(now);
        let exchanges = 0;
        const fetcher = vi.fn(async (url: string | URL | Request) => {
            if (String(url).endsWith("/v1/auth/agent-token")) {
                exchanges++;
                if (attempt === "initial" || exchanges === 2) {
                    return json(401, { message: "Key deactivated" });
                }
                return json(200, { access_token: "agent-1", expires_in: 120 });
            }
            return json(402, requirement);
        });
        vi.stubGlobal("fetch", fetcher);
        const client = createClient({ baseUrl: BASE, apiKey: "ocv_test" });
        const signer = makeSigner();
        signer.signPayment.mockImplementation(async () => {
            clock.mockReturnValue(now + 121_000);
            return "test-signature";
        });

        await expect(client.x402.withPayment("v1", "key", signer)).rejects.toThrow(
            "Agent token refresh failed: HTTP 401 — Key deactivated",
        );
        expect(fetcher).toHaveBeenCalledTimes(attempt === "paid" ? 3 : 1);
        expect(signer.signPayment).toHaveBeenCalledTimes(attempt === "paid" ? 1 : 0);
    });

    it.each([0, 1])("keeps explicit signing separate from automatic payment with maxAutoPayUsd=%s", async maxAutoPayUsd => {
        const fetcher = vi.fn()
            .mockResolvedValueOnce(json(402, requirement))
            .mockResolvedValueOnce(json(200, secret));
        vi.stubGlobal("fetch", fetcher);
        const configuredSigner = makeSigner();
        const explicitSigner = makeSigner();
        const client = createClient({ baseUrl: BASE, token: "jwt", x402Signer: configuredSigner, maxAutoPayUsd });

        const result = await client.x402.withPayment("v1", "key", explicitSigner);

        expect(result.data).toEqual(secret);
        expect(fetcher).toHaveBeenCalledTimes(2);
        expect(explicitSigner.signPayment).toHaveBeenCalledExactlyOnceWith(requirement.accepts[0]);
        expect(configuredSigner.signPayment).not.toHaveBeenCalled();
    });

    it("uses the configured signer when no per-call signer is provided", async () => {
        const fetcher = vi.fn()
            .mockResolvedValueOnce(json(402, requirement))
            .mockResolvedValueOnce(json(200, secret));
        vi.stubGlobal("fetch", fetcher);
        const signer = makeSigner();
        const client = createClient({ baseUrl: BASE, token: "jwt", x402Signer: signer });

        expect((await client.x402.withPayment("v1", "key")).data).toEqual(secret);
        expect(signer.signPayment).toHaveBeenCalledExactlyOnceWith(requirement.accepts[0]);
        expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it("returns a free secret without needing or invoking a signer", async () => {
        const fetcher = vi.fn().mockResolvedValue(json(200, secret));
        vi.stubGlobal("fetch", fetcher);
        const client = createClient({ baseUrl: BASE, token: "jwt" });

        expect(await client.x402.withPayment("v1", "key")).toEqual({
            data: secret, error: null, meta: { status: 200 },
        });
        expect(fetcher).toHaveBeenCalledOnce();
    });

    it.each(["initial", "paid"])("preserves the error envelope for the %s authorization denial", async attempt => {
        const fetcher = vi.fn();
        if (attempt === "paid") fetcher.mockResolvedValueOnce(json(402, requirement));
        fetcher.mockResolvedValueOnce(json(403, { type: "approval_required", approval_request_id: "approval-1", detail: "Approval required" }));
        vi.stubGlobal("fetch", fetcher);
        const signer = makeSigner();
        const client = createClient({ baseUrl: BASE, token: "jwt" });

        expect(await client.x402.withPayment("v1", "key", signer)).toEqual({
            data: null,
            error: { type: "approval_required", message: "Approval required" },
            meta: { status: 403 },
        });
        expect(fetcher).toHaveBeenCalledTimes(attempt === "paid" ? 2 : 1);
        expect(signer.signPayment).toHaveBeenCalledTimes(attempt === "paid" ? 1 : 0);
    });

    it("returns a second 402 without signing or retrying again", async () => {
        const fetcher = vi.fn().mockImplementation(async () => json(402, requirement));
        vi.stubGlobal("fetch", fetcher);
        const signer = makeSigner();
        const client = createClient({ baseUrl: BASE, token: "jwt", x402Signer: signer, maxAutoPayUsd: 1 });

        expect(await client.x402.withPayment("v1", "key")).toEqual({
            data: null,
            error: { type: "payment_required", message: "HTTP 402" },
            meta: { status: 402 },
        });
        expect(fetcher).toHaveBeenCalledTimes(2);
        expect(signer.signPayment).toHaveBeenCalledOnce();
    });

    it("propagates signer refusal without making a paid request", async () => {
        const fetcher = vi.fn().mockResolvedValue(json(402, requirement));
        vi.stubGlobal("fetch", fetcher);
        const signer = makeSigner();
        const refusal = new Error("Payment refused by signer policy");
        signer.signPayment.mockRejectedValue(refusal);
        const client = createClient({ baseUrl: BASE, token: "jwt" });

        await expect(client.x402.withPayment("v1", "key", signer)).rejects.toBe(refusal);
        expect(fetcher).toHaveBeenCalledOnce();
    });

    it("rejects a payment requirement without a signer and never retries", async () => {
        const fetcher = vi.fn().mockResolvedValue(json(402, requirement));
        vi.stubGlobal("fetch", fetcher);
        const client = createClient({ baseUrl: BASE, token: "jwt" });

        await expect(client.x402.withPayment("v1", "key")).rejects.toThrow("No x402 signer configured");
        expect(fetcher).toHaveBeenCalledOnce();
    });

    it("rejects unsupported payment requirements before invoking the signer", async () => {
        const fetcher = vi.fn().mockResolvedValue(json(402, { ...requirement, accepts: [] }));
        vi.stubGlobal("fetch", fetcher);
        const signer = makeSigner();
        const client = createClient({ baseUrl: BASE, token: "jwt" });

        await expect(client.x402.withPayment("v1", "key", signer)).rejects.toThrow("Payment requirement has no accepted payment methods");
        expect(signer.signPayment).not.toHaveBeenCalled();
        expect(fetcher).toHaveBeenCalledOnce();
    });

    it.each(["initial", "paid"])("propagates %s network errors without extra retries", async attempt => {
        const fetcher = vi.fn();
        if (attempt === "paid") fetcher.mockResolvedValueOnce(json(402, requirement));
        const failure = new TypeError("Mock connection failed");
        fetcher.mockRejectedValueOnce(failure);
        vi.stubGlobal("fetch", fetcher);
        const signer = makeSigner();
        const client = createClient({ baseUrl: BASE, token: "jwt" });

        await expect(client.x402.withPayment("v1", "key", signer)).rejects.toBe(failure);
        expect(fetcher).toHaveBeenCalledTimes(attempt === "paid" ? 2 : 1);
        expect(signer.signPayment).toHaveBeenCalledTimes(attempt === "paid" ? 1 : 0);
    });
});
