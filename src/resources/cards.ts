import type { HttpClient } from "../core/http";
import type {
    OrderCardRequest,
    CardResponse,
    CardListResponse,
    CardRevealResponse,
    UpdateCardRequest,
    ImportCardRequest,
    SearchGiftCardsRequest,
    OneclawResponse,
} from "../types";

/**
 * Payment Card Vault — order prepaid/gift cards via x402, then list, get,
 * refresh, void, and (human-gated) reveal them.
 *
 * PANs/CVVs are never returned except by {@link reveal}, which requires human
 * password re-authentication (or an explicit per-card agent reveal policy).
 * Ordering guardrails bound the purchase, not how a revealed card is later spent.
 */
export class CardsResource {
    constructor(private readonly http: HttpClient) {}

    /**
     * Order a prepaid or gift card for an agent. Drives the x402 payment flow
     * server-side using the agent's Ethereum signing key (funded with USDC on
     * Base). Automatically generates an Idempotency-Key; pass one to override.
     */
    async order(
        agentId: string,
        body: OrderCardRequest,
        options?: { idempotencyKey?: string },
    ): Promise<OneclawResponse<CardResponse>> {
        const key = options?.idempotencyKey ?? crypto.randomUUID();
        return this.http.request<CardResponse>(
            "POST",
            `/v1/agents/${agentId}/cards/order`,
            { body, headers: { "Idempotency-Key": key } },
        );
    }

    /** List cards for the caller (agents see only their own). Always masked. */
    async list(): Promise<OneclawResponse<CardListResponse>> {
        return this.http.request<CardListResponse>("GET", "/v1/cards");
    }

    /** Get a single card (masked — last4 only). */
    async get(cardId: string): Promise<OneclawResponse<CardResponse>> {
        return this.http.request<CardResponse>("GET", `/v1/cards/${cardId}`);
    }

    /**
     * Reveal full card details. Humans must pass their account password via
     * `password` (sent as `X-Auth-Confirm`). Agents may reveal only when a human
     * has enabled a per-card reveal policy.
     */
    async reveal(
        cardId: string,
        options?: { password?: string },
    ): Promise<OneclawResponse<CardRevealResponse>> {
        const headers = options?.password
            ? { "X-Auth-Confirm": options.password }
            : undefined;
        return this.http.request<CardRevealResponse>(
            "POST",
            `/v1/cards/${cardId}/reveal`,
            headers ? { headers } : undefined,
        );
    }

    /** Update a card's reveal policy and/or void_after (human-only). */
    async update(
        cardId: string,
        body: UpdateCardRequest,
    ): Promise<OneclawResponse<CardResponse>> {
        return this.http.request<CardResponse>("PATCH", `/v1/cards/${cardId}`, {
            body,
        });
    }

    /** Void a card — a 1Claw-level lock. Forward-looking only. */
    async void(cardId: string): Promise<OneclawResponse<CardResponse>> {
        return this.http.request<CardResponse>(
            "POST",
            `/v1/cards/${cardId}/void`,
        );
    }

    /** Refresh a Laso reference-mode card's balance/status. Rate-limited. */
    async refresh(cardId: string): Promise<OneclawResponse<CardResponse>> {
        return this.http.request<CardResponse>(
            "POST",
            `/v1/cards/${cardId}/refresh`,
        );
    }

    /** Manually import an existing card (human-only, full storage mode). */
    async import(
        body: ImportCardRequest,
    ): Promise<OneclawResponse<CardResponse>> {
        return this.http.request<CardResponse>("POST", "/v1/cards/import", {
            body,
        });
    }

    /** Search available Laso gift-card brands/servers. */
    async searchGiftCards(
        body: SearchGiftCardsRequest = {},
    ): Promise<OneclawResponse<unknown>> {
        return this.http.request<unknown>(
            "POST",
            "/v1/cards/gift-cards/search",
            { body },
        );
    }
}
