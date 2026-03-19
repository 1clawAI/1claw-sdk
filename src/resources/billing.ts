import type { HttpClient } from "../core/http";
import type {
    UsageSummaryResponse,
    UsageHistoryResponse,
    LlmTokenBillingStatus,
    LlmCheckoutResponse,
    LlmDisableResponse,
    OneclawResponse,
} from "../types";

/**
 * Billing resource — usage summaries, history, and LLM token billing.
 */
export class BillingResource {
    constructor(private readonly http: HttpClient) {}

    /** Get the current month's usage summary (free tier remaining, costs). */
    async usage(): Promise<OneclawResponse<UsageSummaryResponse>> {
        return this.http.request<UsageSummaryResponse>(
            "GET",
            "/v1/billing/usage",
        );
    }

    /**
     * Get per-request usage history.
     * @param limit Maximum number of events to return (1–200, default 50).
     */
    async history(
        limit?: number,
    ): Promise<OneclawResponse<UsageHistoryResponse>> {
        return this.http.request<UsageHistoryResponse>(
            "GET",
            "/v1/billing/history",
            {
                query: limit !== undefined ? { limit } : undefined,
            },
        );
    }

    // ── LLM Token Billing ──────────────────────────────────────────

    /** Get LLM token billing status for the current org. */
    async llmTokenBilling(): Promise<OneclawResponse<LlmTokenBillingStatus>> {
        return this.http.request<LlmTokenBillingStatus>(
            "GET",
            "/v1/billing/llm-token-billing",
        );
    }

    /**
     * Subscribe to LLM token billing. Returns a Stripe Checkout URL.
     * Redirect the user to complete the subscription.
     */
    async subscribeLlmTokenBilling(): Promise<OneclawResponse<LlmCheckoutResponse>> {
        return this.http.request<LlmCheckoutResponse>(
            "POST",
            "/v1/billing/llm-token-billing/subscribe",
        );
    }

    /** Disable LLM token billing for the current org. */
    async disableLlmTokenBilling(): Promise<OneclawResponse<LlmDisableResponse>> {
        return this.http.request<LlmDisableResponse>(
            "POST",
            "/v1/billing/llm-token-billing/disable",
        );
    }
}
