import type { HttpClient } from "../core/http";
import type { AiSpend, AiSpendQuery, LlmModelPrice, OneclawResponse } from "../types";

function qs(q?: AiSpendQuery): string {
    if (!q) return "";
    const p = new URLSearchParams();
    if (q.from) p.set("from", q.from);
    if (q.to) p.set("to", q.to);
    if (q.interval) p.set("interval", q.interval);
    if (q.agentId) p.set("agent_id", q.agentId);
    if (q.provider) p.set("provider", q.provider);
    const s = p.toString();
    return s ? `?${s}` : "";
}

/**
 * Spend — what the org's agents spent on inference (vault ≥ 0.61.40),
 * by provider, model, agent and day, against budgets and caps.
 */
export class SpendResource {
    constructor(private readonly http: HttpClient) {}

    /** AI spend for a window (default: the last 30 days) with the previous window for comparison. */
    async ai(query?: AiSpendQuery): Promise<OneclawResponse<AiSpend>> {
        return this.http.request<AiSpend>("GET", `/v1/spend/ai${qs(query)}`);
    }

    /** The URL of the CSV export for the same window (one row per agent × provider × model). */
    aiCsvPath(query?: AiSpendQuery): string {
        return `/v1/spend/ai/export.csv${qs(query)}`;
    }

    /** The price card: global list prices plus this org's overrides. */
    async listPrices(): Promise<OneclawResponse<{ prices: LlmModelPrice[] }>> {
        return this.http.request("GET", "/v1/spend/ai/prices");
    }

    /** Set (or update) an org price override. Owner/admin. */
    async setPrice(price: {
        provider: string;
        modelPattern: string;
        inputUsdPerMtok: number;
        outputUsdPerMtok: number;
    }): Promise<OneclawResponse<LlmModelPrice>> {
        return this.http.request<LlmModelPrice>("PUT", "/v1/spend/ai/prices", {
            body: {
                provider: price.provider,
                model_pattern: price.modelPattern,
                input_usd_per_mtok: price.inputUsdPerMtok,
                output_usd_per_mtok: price.outputUsdPerMtok,
            },
        });
    }

    /** Remove an org price override. Owner/admin. */
    async deletePrice(id: string): Promise<OneclawResponse<void>> {
        return this.http.request<void>("DELETE", `/v1/spend/ai/prices/${id}`);
    }

    /** Price the org's requests that arrived without a card. Owner/admin. */
    async reprice(): Promise<OneclawResponse<{ repriced: number }>> {
        return this.http.request("POST", "/v1/spend/ai/reprice");
    }
}
