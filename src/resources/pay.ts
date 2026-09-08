import type { HttpClient } from "../core/http";
import type {
    PayPrepareRequest,
    PayPrepareResponse,
    PaySignRequest,
    PaySignResponse,
    PayResultRequest,
    CreatePayGrantRequest,
    PayGrantResponse,
    PaySessionResponse,
    PaymentStatusResponse,
    UpdatePayGuardrailsRequest,
    PaySettingsResponse,
    OneclawResponse,
} from "../types";

/**
 * `1claw pay` — x402 micropayments under a human's authorization.
 *
 * The division of labour matters: the caller holds the network connection and
 * nothing else. It sends the vault the exact bytes a paywall served; the vault
 * decides what may be signed, what a person is shown, and what the daily ledger
 * says. Do not parse the 402 and send fields — the digest a person authorizes is
 * computed from the raw preimage, so anything reinterpreted first falls outside
 * the binding.
 */
export class PayResource {
    constructor(private readonly http: HttpClient) {}

    /**
     * Turn a 402 challenge into something signable.
     *
     * `challengeB64` is the response body (or `Payment-Required` header) exactly
     * as received. The response's `authorization` field says what happens next:
     * `allow`, `require_passkey`, `require_grant`, or `deny: <reason>`.
     */
    async prepare(
        agentId: string,
        body: PayPrepareRequest,
    ): Promise<OneclawResponse<PayPrepareResponse>> {
        return this.http.request<PayPrepareResponse>(
            "POST",
            `/v1/agents/${agentId}/pay/prepare`,
            { body },
        );
    }

    /**
     * Sign a prepared payment, returning the `X-PAYMENT` header value.
     *
     * Pass `passkeyToken` when `prepare` said `require_passkey`. The daily limit
     * is charged here, at signing time — a payment that is signed and then lost
     * still consumed authority, and only a vault-verified reconciliation returns
     * it, so reporting a failure afterwards will not.
     *
     * A `409` means the paywall's challenge window closed. Re-fetch the resource
     * for a fresh 402 and prepare again; re-preparing from the same bytes would
     * reproduce the same expired window, and many challenges carry a single-use
     * nonce.
     */
    async sign(
        agentId: string,
        body: PaySignRequest,
        options?: { passkeyToken?: string },
    ): Promise<OneclawResponse<PaySignResponse>> {
        return this.http.request<PaySignResponse>(
            "POST",
            `/v1/agents/${agentId}/pay/sign`,
            {
                body,
                headers: options?.passkeyToken
                    ? { "X-Passkey-Token": options.passkeyToken }
                    : undefined,
            },
        );
    }

    /**
     * Report what happened after presenting the payment.
     *
     * Best-effort and advisory: it moves the audit trail forward and releases
     * nothing. Omit `settled` when the outcome is genuinely unknown (a timeout
     * after the header was sent) rather than guessing `false`.
     */
    async reportResult(
        agentId: string,
        paymentId: string,
        body: PayResultRequest,
    ): Promise<OneclawResponse<{ recorded: string; limit_released: boolean }>> {
        return this.http.request(
            "POST",
            `/v1/agents/${agentId}/pay/${paymentId}/result`,
            { body },
        );
    }

    /** Status of a single payment. */
    async get(
        agentId: string,
        paymentId: string,
    ): Promise<OneclawResponse<PaymentStatusResponse>> {
        return this.http.request<PaymentStatusResponse>(
            "GET",
            `/v1/agents/${agentId}/pay/${paymentId}`,
        );
    }

    /**
     * Read a pay session — what the authorize page renders and what a CLI polls.
     *
     * Requires the token of the human the session was raised for. Not an agent
     * token, and not merely someone else in the same org.
     */
    async getSession(
        sessionId: string,
    ): Promise<OneclawResponse<PaySessionResponse>> {
        return this.http.request<PaySessionResponse>(
            "GET",
            `/v1/pay-sessions/${sessionId}`,
        );
    }

    /**
     * Create a spending grant: one passkey touch covering payments up to a cap,
     * for a window.
     *
     * Human callers only, and `grantDigest` must be the digest the person
     * actually asserted over — it is compared against the terms being stored, so
     * a token obtained for a small, tightly scoped grant cannot create a large
     * open one.
     */
    async createGrant(
        agentId: string,
        body: CreatePayGrantRequest,
        options: { passkeyToken: string },
    ): Promise<OneclawResponse<PayGrantResponse>> {
        return this.http.request<PayGrantResponse>(
            "POST",
            `/v1/agents/${agentId}/pay/grants`,
            { body, headers: { "X-Passkey-Token": options.passkeyToken } },
        );
    }

    /**
     * Set the agent's payment guardrails.
     *
     * Human callers only. These are the numbers every other pay decision is
     * measured against, so an agent cannot set them. Omitted fields are left
     * alone; values can be set but not currently cleared.
     */
    async updateSettings(
        agentId: string,
        body: UpdatePayGuardrailsRequest,
    ): Promise<OneclawResponse<PaySettingsResponse>> {
        return this.http.request<PaySettingsResponse>(
            "PATCH",
            `/v1/agents/${agentId}/pay/settings`,
            { body },
        );
    }

    /** Revoke a grant before its window closes. */
    async revokeGrant(
        grantId: string,
    ): Promise<OneclawResponse<{ revoked: boolean }>> {
        return this.http.request("DELETE", `/v1/pay-grants/${grantId}`);
    }
}
