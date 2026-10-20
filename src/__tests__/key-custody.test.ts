import { describe, it, expect, vi, afterEach, expectTypeOf } from "vitest";
import { HttpClient } from "../core/http";
import {
    KeyCustodyResource,
    type TssTreasuryPrepareRequest,
    type MultisigPrepareRequest,
    type MultisigSafePrepareRequest,
    type TssSignCompleteRequest,
    type TssPrfSaltResponse,
    type ConfirmTssKitRequest,
} from "../resources/key-custody";

const BASE = "https://api.test";
const originalFetch = globalThis.fetch;

function mockFetch(status: number, body: unknown) {
    return vi.fn().mockResolvedValue({
        ok: status >= 200 && status < 300,
        status,
        headers: new Headers(),
        json: () => Promise.resolve(body),
    } as unknown as Response);
}

function kc() {
    return new KeyCustodyResource(new HttpClient({ baseUrl: BASE, token: "t" }));
}

function lastCall() {
    const f = globalThis.fetch as ReturnType<typeof vi.fn>;
    const init = f.mock.calls[0][1] as RequestInit;
    return {
        url: f.mock.calls[0][0] as string,
        method: init.method,
        headers: init.headers as Record<string, string>,
        body: init.body ? JSON.parse(init.body as string) : undefined,
    };
}

afterEach(() => {
    globalThis.fetch = originalFetch;
});

describe("KeyCustodyResource types come from the spec", () => {
    it("prepare requests carry approval_id", () => {
        expectTypeOf<TssTreasuryPrepareRequest>().toHaveProperty("approval_id");
        expectTypeOf<MultisigPrepareRequest>().toHaveProperty("approval_id");
        expectTypeOf<MultisigSafePrepareRequest>().toHaveProperty("approval_id");
    });
    it("inline shapes resolve (not never)", () => {
        expectTypeOf<TssSignCompleteRequest>().toHaveProperty("client_signature_shares_all");
        expectTypeOf<TssPrfSaltResponse>().toHaveProperty("salt");
        expectTypeOf<ConfirmTssKitRequest>().toHaveProperty("kit_proof");
    });
});

describe("KeyCustodyResource", () => {
    it("getTssChains sends GET /v1/keys/tss/chains", async () => {
        globalThis.fetch = mockFetch(200, { chains: [] });
        await kc().getTssChains();
        expect(lastCall().url).toBe(`${BASE}/v1/keys/tss/chains`);
        expect(lastCall().method).toBe("GET");
    });

    it("putClientShare omits X-Auth-Confirm for a first wrap and sends it when given", async () => {
        globalThis.fetch = mockFetch(201, { id: "s" });
        const body = { wrap_kind: "passkey_prf", ciphertext: "c", salt: "s" } as never;
        await kc().putClientShare("k1", body);
        expect(lastCall().method).toBe("PUT");
        expect(lastCall().url).toBe(`${BASE}/v1/keys/k1/client-share`);
        expect(lastCall().headers["X-Auth-Confirm"]).toBeUndefined();

        globalThis.fetch = mockFetch(201, { id: "s" });
        await kc().putClientShare("k1", body, "rat_x");
        expect(lastCall().headers["X-Auth-Confirm"]).toBe("rat_x");
    });

    it("rewrapClientShare always sends X-Auth-Confirm", async () => {
        globalThis.fetch = mockFetch(201, { id: "s" });
        await kc().rewrapClientShare("k1", {} as never, "rat_y");
        expect(lastCall().url).toBe(`${BASE}/v1/keys/k1/client-share/rewrap`);
        expect(lastCall().headers["X-Auth-Confirm"]).toBe("rat_y");
    });

    it("confirmKit posts the kit proof to /kit", async () => {
        globalThis.fetch = mockFetch(200, {});
        await kc().confirmKit("k1", { generation: 1, group_public_key: "02ab", kit_proof: "p" });
        expect(lastCall().url).toBe(`${BASE}/v1/keys/k1/kit`);
        expect(lastCall().body.kit_proof).toBe("p");
    });

    it("signBegin sends the message and X-Passkey-Token", async () => {
        globalThis.fetch = mockFetch(201, { session_id: "x" });
        await kc().signBegin("k1", "bWVzc2FnZQ==", "pk_tok");
        expect(lastCall().url).toBe(`${BASE}/v1/keys/k1/tss/sign/begin`);
        expect(lastCall().body).toEqual({ message: "bWVzc2FnZQ==" });
        expect(lastCall().headers["X-Passkey-Token"]).toBe("pk_tok");
    });

    it("treasuryPrepare surfaces a 202 consensus hold as data", async () => {
        globalThis.fetch = mockFetch(202, { status: "pending_approval", pending_approval_id: "a1" });
        const res = await kc().treasuryPrepare("solana", { to: "x", value: "0.5" });
        expect(lastCall().url).toBe(`${BASE}/v1/treasury/wallets/solana/tss/prepare`);
        expect(res.meta?.status).toBe(202);
        expect((res.data as { pending_approval_id?: string }).pending_approval_id).toBe("a1");

        globalThis.fetch = mockFetch(200, { message: "m" });
        await kc().treasuryPrepare("solana", { to: "x", value: "0.5", approval_id: "a1" });
        expect(lastCall().body.approval_id).toBe("a1");
    });

    it("Tron multisig prepare and broadcast hit the chain routes", async () => {
        globalThis.fetch = mockFetch(200, {});
        await kc().prepareMultisigSend("tron", { to: "T...", value: "1", approval_id: "a2" });
        expect(lastCall().url).toBe(`${BASE}/v1/treasury/wallets/tron/multisig/prepare`);
        expect(lastCall().body.approval_id).toBe("a2");

        globalThis.fetch = mockFetch(200, {});
        await kc().broadcastMultisigSend("tron", { raw: "r", device_signature: "d" }, "pk");
        expect(lastCall().url).toBe(`${BASE}/v1/treasury/wallets/tron/multisig/broadcast`);
        expect(lastCall().headers["X-Passkey-Token"]).toBe("pk");
    });

    it("Safe routes: list, retire, prepare, execute", async () => {
        globalThis.fetch = mockFetch(200, { safes: [] });
        await kc().listMultisigSafes();
        expect(lastCall().url).toBe(`${BASE}/v1/treasury/multisig-safes`);

        globalThis.fetch = mockFetch(204, null);
        await kc().retireMultisigSafe("s1");
        expect(lastCall().method).toBe("DELETE");
        expect(lastCall().url).toBe(`${BASE}/v1/treasury/multisig-safes/s1`);

        globalThis.fetch = mockFetch(200, {});
        await kc().prepareMultisigSafeSend("s1", { to: "0xabc", value_wei: "1" });
        expect(lastCall().url).toBe(`${BASE}/v1/treasury/multisig-safes/s1/prepare`);

        globalThis.fetch = mockFetch(200, {});
        await kc().executeMultisigSafeSend("s1", {} as never, "pk");
        expect(lastCall().url).toBe(`${BASE}/v1/treasury/multisig-safes/s1/execute`);
        expect(lastCall().headers["X-Passkey-Token"]).toBe("pk");
    });
});
