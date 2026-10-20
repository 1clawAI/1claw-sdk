import type { HttpClient } from "../core/http";
import type { OneclawResponse } from "../types";
import type { components, operations } from "../generated/api-types";

type Schemas = components["schemas"];

/** JSON request body of a spec operation. */
type JsonBody<K extends keyof operations> = operations[K] extends {
    requestBody?: { content: { "application/json": infer B } };
}
    ? B
    : never;

/** JSON body of one response code of a spec operation. */
type JsonResponse<
    K extends keyof operations,
    C extends keyof operations[K]["responses"],
> = operations[K]["responses"][C] extends {
    content: { "application/json": infer R };
}
    ? R
    : never;

/** Returned (HTTP 202) when the org's `treasury_send` consensus policy holds a send. */
export type TssPendingApproval = Schemas["SubmitPendingApprovalResponse"];

export type TssChainsResponse = JsonResponse<"getTssChains", 200>;
export type TssPrfSaltResponse = JsonResponse<"getTssPrfSalt", 200>;

export type PutClientShareRequest = Schemas["PutClientShareRequest"];
export type ClientShareResponse = Schemas["ClientShareResponse"];
export type ClientShareListResponse = Schemas["ClientShareListResponse"];
export type ConfirmTssKitRequest = JsonBody<"confirmTssKit">;
export type RestoreTssShareRequest = JsonBody<"restoreTssShareFromKit">;

export type TssKeygenBeginRequest = JsonBody<"tssKeygenBegin">;
export type TssKeygenBeginResponse = JsonResponse<"tssKeygenBegin", 201>;
export type TssKeygenRound2Request = JsonBody<"tssKeygenRound2">;
export type TssKeygenRound2Response = JsonResponse<"tssKeygenRound2", 200>;
export type TssKeygenCompleteRequest = JsonBody<"tssKeygenComplete">;
export type TssKeygenCompleteResponse = JsonResponse<"tssKeygenComplete", 201>;

export type TssSignBeginResponse = Schemas["TssSignBeginResponse"];
export type TssSignCompleteRequest = Schemas["TssSignCompleteRequest"];
export type TssSignCompleteResponse = Schemas["TssSignCompleteResponse"];

export type TssRefreshBeginResponse = JsonResponse<"tssRefreshBegin", 201>;
export type TssRefreshRound2Request = JsonBody<"tssRefreshRound2">;
export type TssRefreshRound2Response = JsonResponse<"tssRefreshRound2", 200>;
export type TssRefreshCompleteRequest = JsonBody<"tssRefreshComplete">;
export type TssRefreshCompleteResponse = JsonResponse<"tssRefreshComplete", 200>;
export type TssRefreshCommitRequest = JsonBody<"tssRefreshCommit">;

export type TssTreasuryPrepareRequest = JsonBody<"tssTreasuryPrepare">;
export type TssTreasuryPrepareResponse = JsonResponse<"tssTreasuryPrepare", 200>;
export type TssTreasuryBroadcastRequest = JsonBody<"tssTreasuryBroadcast">;
export type TreasuryWalletSendResponse = Schemas["TreasuryWalletSendResponse"];

export type CreateMultisigWalletRequest = Schemas["CreateMultisigWalletRequest"];
export type MultisigWalletResponse = Schemas["MultisigWalletResponse"];
export type MultisigPreparedRaw = Schemas["MultisigPreparedRaw"];
export type MultisigSignedRawRequest = Schemas["MultisigSignedRawRequest"];
export type MultisigPrepareRequest = JsonBody<"prepareMultisigSend">;

export type CreateMultisigSafeRequest = Schemas["CreateMultisigSafeRequest"];
export type MultisigSafeResponse = Schemas["MultisigSafeResponse"];
export type MultisigSafeListResponse = JsonResponse<"listMultisigSafes", 200>;
export type MultisigSafePrepareRequest = JsonBody<"prepareMultisigSafeSend">;
export type MultisigSafePrepared = Schemas["MultisigSafePrepared"];
export type MultisigSafeExecuteRequest = JsonBody<"executeMultisigSafeSend">;
export type MultisigSafeExecuteResponse = Schemas["MultisigSafeExecuteResponse"];

/**
 * Self-custody keys: 2-of-3 FROST wallets (`client_tss`), Tron native
 * multisig and EVM 2-of-3 Safes (`client_multisig`).
 *
 * These are the HTTP calls only. The device side of each protocol (FROST
 * rounds, share wrapping under the passkey PRF, the recovery kit) runs in
 * the browser with `@1claw/tss-wasm`; calls that take a `passkeyToken` need
 * an `X-Passkey-Token` from a passkey assertion bound to the payload, and
 * calls that take `authConfirm` need an `X-Auth-Confirm` re-auth token
 * (`rat_...`) or the account password. Human users only.
 */
export class KeyCustodyResource {
    constructor(private readonly http: HttpClient) {}

    // ── Discovery ─────────────────────────────────────────────────────

    /** Chains this org can create self-custody keys on (rollout-flag aware). */
    async getTssChains(): Promise<OneclawResponse<TssChainsResponse>> {
        return this.http.request<TssChainsResponse>("GET", "/v1/keys/tss/chains");
    }

    /** The account's master-wrap PRF salt, created on first use. */
    async getPrfSalt(): Promise<OneclawResponse<TssPrfSaltResponse>> {
        return this.http.request<TssPrfSaltResponse>("GET", "/v1/keys/tss/prf-salt");
    }

    // ── Wrapped client shares ─────────────────────────────────────────

    async listClientShares(
        keyId: string,
    ): Promise<OneclawResponse<ClientShareListResponse>> {
        return this.http.request<ClientShareListResponse>(
            "GET",
            `/v1/keys/${keyId}/client-share`,
        );
    }

    /**
     * Store a wrapped share. The first wrap of a share generation needs no
     * step-up; any later wrap for that generation needs `authConfirm`
     * (re-auth purpose `tss.key.wrap_add`).
     */
    async putClientShare(
        keyId: string,
        body: PutClientShareRequest,
        authConfirm?: string,
    ): Promise<OneclawResponse<ClientShareResponse>> {
        return this.http.request<ClientShareResponse>(
            "PUT",
            `/v1/keys/${keyId}/client-share`,
            {
                body,
                headers: authConfirm ? { "X-Auth-Confirm": authConfirm } : undefined,
            },
        );
    }

    /** Add a wrap to a key that already has one. Re-auth purpose `tss.key.wrap_add`. */
    async rewrapClientShare(
        keyId: string,
        body: PutClientShareRequest,
        authConfirm: string,
    ): Promise<OneclawResponse<ClientShareResponse>> {
        return this.http.request<ClientShareResponse>(
            "POST",
            `/v1/keys/${keyId}/client-share/rewrap`,
            { body, headers: { "X-Auth-Confirm": authConfirm } },
        );
    }

    /** Remove one wrap. Re-auth purpose `tss.key.wrap_delete`. */
    async deleteClientShare(
        keyId: string,
        shareId: string,
        authConfirm: string,
    ): Promise<OneclawResponse<void>> {
        return this.http.request<void>(
            "DELETE",
            `/v1/keys/${keyId}/client-share/${shareId}`,
            { headers: { "X-Auth-Confirm": authConfirm } },
        );
    }

    /** Restore the device share from the offline recovery kit. Re-auth purpose `tss.key.restore`. */
    async restoreFromKit(
        keyId: string,
        body: RestoreTssShareRequest,
        authConfirm: string,
    ): Promise<OneclawResponse<ClientShareResponse>> {
        return this.http.request<ClientShareResponse>(
            "POST",
            `/v1/keys/${keyId}/client-share/restore`,
            { body, headers: { "X-Auth-Confirm": authConfirm } },
        );
    }

    /**
     * Confirm the recovery kit for the key's current share generation with a
     * kit proof. The only way kit coverage is recorded.
     */
    async confirmKit(
        keyId: string,
        body: ConfirmTssKitRequest,
    ): Promise<OneclawResponse<Record<string, unknown>>> {
        return this.http.request<Record<string, unknown>>(
            "POST",
            `/v1/keys/${keyId}/kit`,
            { body },
        );
    }

    // ── FROST keygen ──────────────────────────────────────────────────

    /** Begin a 2-of-3 keygen. Answers 202 when control-plane consensus holds it. */
    async keygenBegin(
        body: TssKeygenBeginRequest,
    ): Promise<OneclawResponse<TssKeygenBeginResponse | TssPendingApproval>> {
        return this.http.request("POST", "/v1/keys/tss/keygen/begin", { body });
    }

    async keygenRound2(
        body: TssKeygenRound2Request,
    ): Promise<OneclawResponse<TssKeygenRound2Response>> {
        return this.http.request("POST", "/v1/keys/tss/keygen/round2", { body });
    }

    async keygenComplete(
        body: TssKeygenCompleteRequest,
        passkeyToken: string,
    ): Promise<OneclawResponse<TssKeygenCompleteResponse>> {
        return this.http.request("POST", "/v1/keys/tss/keygen/complete", {
            body,
            headers: { "X-Passkey-Token": passkeyToken },
        });
    }

    // ── FROST signing ─────────────────────────────────────────────────

    /** Round 1. `message` is Base64; the passkey token is bound to `tss_sign` and its SHA-256. */
    async signBegin(
        keyId: string,
        message: string,
        passkeyToken: string,
    ): Promise<OneclawResponse<TssSignBeginResponse>> {
        return this.http.request<TssSignBeginResponse>(
            "POST",
            `/v1/keys/${keyId}/tss/sign/begin`,
            { body: { message }, headers: { "X-Passkey-Token": passkeyToken } },
        );
    }

    /** Round 2: the vault aggregates and verifies before returning the signature(s). */
    async signComplete(
        keyId: string,
        body: TssSignCompleteRequest,
    ): Promise<OneclawResponse<TssSignCompleteResponse>> {
        return this.http.request<TssSignCompleteResponse>(
            "POST",
            `/v1/keys/${keyId}/tss/sign/complete`,
            { body },
        );
    }

    // ── Share refresh ─────────────────────────────────────────────────

    async refreshBegin(
        keyId: string,
        passkeyToken: string,
    ): Promise<OneclawResponse<TssRefreshBeginResponse>> {
        return this.http.request("POST", `/v1/keys/${keyId}/tss/refresh/begin`, {
            headers: { "X-Passkey-Token": passkeyToken },
        });
    }

    async refreshRound2(
        keyId: string,
        body: TssRefreshRound2Request,
    ): Promise<OneclawResponse<TssRefreshRound2Response>> {
        return this.http.request("POST", `/v1/keys/${keyId}/tss/refresh/round2`, { body });
    }

    async refreshComplete(
        keyId: string,
        body: TssRefreshCompleteRequest,
    ): Promise<OneclawResponse<TssRefreshCompleteResponse>> {
        return this.http.request("POST", `/v1/keys/${keyId}/tss/refresh/complete`, { body });
    }

    async refreshCommit(
        keyId: string,
        body: TssRefreshCommitRequest,
    ): Promise<OneclawResponse<Record<string, unknown>>> {
        return this.http.request("POST", `/v1/keys/${keyId}/tss/refresh/commit`, { body });
    }

    async refreshAbort(keyId: string): Promise<OneclawResponse<void>> {
        return this.http.request<void>("POST", `/v1/keys/${keyId}/tss/refresh/abort`);
    }

    // ── Treasury sends from a client_tss wallet ───────────────────────

    /**
     * Build the unsigned message for a send. Runs wallet access, sanctions,
     * spend policy, transaction policy and `treasury_send` consensus. A 202
     * (`meta.status === 202`) carries `pending_approval_id`: once approved,
     * call again with the same transfer and `approval_id` set to it.
     */
    async treasuryPrepare(
        chain: string,
        body: TssTreasuryPrepareRequest,
    ): Promise<OneclawResponse<TssTreasuryPrepareResponse | TssPendingApproval>> {
        return this.http.request("POST", `/v1/treasury/wallets/${chain}/tss/prepare`, { body });
    }

    async treasuryBroadcast(
        chain: string,
        body: TssTreasuryBroadcastRequest,
    ): Promise<OneclawResponse<TreasuryWalletSendResponse>> {
        return this.http.request<TreasuryWalletSendResponse>(
            "POST",
            `/v1/treasury/wallets/${chain}/tss/broadcast`,
            { body },
        );
    }

    // ── Tron 2-of-3 native multisig (beta) ────────────────────────────

    async createMultisigWallet(
        body: CreateMultisigWalletRequest,
    ): Promise<OneclawResponse<MultisigWalletResponse>> {
        return this.http.request<MultisigWalletResponse>(
            "POST",
            "/v1/treasury/multisig/wallets",
            { body },
        );
    }

    async prepareMultisigActivation(
        chain: string,
    ): Promise<OneclawResponse<MultisigPreparedRaw>> {
        return this.http.request<MultisigPreparedRaw>(
            "POST",
            `/v1/treasury/wallets/${chain}/multisig/activation`,
        );
    }

    async completeMultisigActivation(
        chain: string,
        body: MultisigSignedRawRequest,
        passkeyToken: string,
    ): Promise<OneclawResponse<MultisigWalletResponse>> {
        return this.http.request<MultisigWalletResponse>(
            "POST",
            `/v1/treasury/wallets/${chain}/multisig/activation/complete`,
            { body, headers: { "X-Passkey-Token": passkeyToken } },
        );
    }

    async getMultisigActivationStatus(
        chain: string,
    ): Promise<OneclawResponse<MultisigWalletResponse>> {
        return this.http.request<MultisigWalletResponse>(
            "POST",
            `/v1/treasury/wallets/${chain}/multisig/activation/status`,
        );
    }

    /** Build a TRX transfer. Same gates and 202 behaviour as `treasuryPrepare`. */
    async prepareMultisigSend(
        chain: string,
        body: MultisigPrepareRequest,
    ): Promise<OneclawResponse<MultisigPreparedRaw | TssPendingApproval>> {
        return this.http.request("POST", `/v1/treasury/wallets/${chain}/multisig/prepare`, {
            body,
        });
    }

    async broadcastMultisigSend(
        chain: string,
        body: MultisigSignedRawRequest,
        passkeyToken: string,
    ): Promise<OneclawResponse<TreasuryWalletSendResponse>> {
        return this.http.request<TreasuryWalletSendResponse>(
            "POST",
            `/v1/treasury/wallets/${chain}/multisig/broadcast`,
            { body, headers: { "X-Passkey-Token": passkeyToken } },
        );
    }

    // ── EVM 2-of-3 Safes (beta) ───────────────────────────────────────

    async createMultisigSafe(
        body: CreateMultisigSafeRequest,
    ): Promise<OneclawResponse<MultisigSafeResponse>> {
        return this.http.request<MultisigSafeResponse>(
            "POST",
            "/v1/treasury/multisig-safes",
            { body },
        );
    }

    async listMultisigSafes(): Promise<OneclawResponse<MultisigSafeListResponse>> {
        return this.http.request<MultisigSafeListResponse>(
            "GET",
            "/v1/treasury/multisig-safes",
        );
    }

    /** Retire a Safe that was never deployed and holds nothing. */
    async retireMultisigSafe(safeId: string): Promise<OneclawResponse<void>> {
        return this.http.request<void>("DELETE", `/v1/treasury/multisig-safes/${safeId}`);
    }

    /** Prepare a native transfer. Same gates and 202 behaviour as `treasuryPrepare`. */
    async prepareMultisigSafeSend(
        safeId: string,
        body: MultisigSafePrepareRequest,
    ): Promise<OneclawResponse<MultisigSafePrepared | TssPendingApproval>> {
        return this.http.request("POST", `/v1/treasury/multisig-safes/${safeId}/prepare`, {
            body,
        });
    }

    async executeMultisigSafeSend(
        safeId: string,
        body: MultisigSafeExecuteRequest,
        passkeyToken: string,
    ): Promise<OneclawResponse<MultisigSafeExecuteResponse>> {
        return this.http.request<MultisigSafeExecuteResponse>(
            "POST",
            `/v1/treasury/multisig-safes/${safeId}/execute`,
            { body, headers: { "X-Passkey-Token": passkeyToken } },
        );
    }
}
