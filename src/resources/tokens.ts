import type { HttpClient } from "../core/http";
import type {
    KnownToken,
    KnownTokenListResponse,
    CreateKnownTokenRequest,
    OneclawResponse,
} from "../types";

/**
 * Token registry — list known tokens and manage admin entries
 * for guardrail enforcement.
 */
export class TokensResource {
    constructor(private readonly http: HttpClient) {}

    async list(chain?: string): Promise<OneclawResponse<KnownTokenListResponse>> {
        const params = chain ? `?chain=${encodeURIComponent(chain)}` : "";
        return this.http.request<KnownTokenListResponse>("GET", `/v1/tokens${params}`);
    }

    async listByChain(chain: string): Promise<OneclawResponse<KnownTokenListResponse>> {
        return this.http.request<KnownTokenListResponse>(
            "GET",
            `/v1/chains/${encodeURIComponent(chain)}/tokens`,
        );
    }

    async create(data: CreateKnownTokenRequest): Promise<OneclawResponse<KnownToken>> {
        return this.http.request<KnownToken>("POST", "/v1/admin/tokens", { body: data });
    }

    async delete(tokenId: string): Promise<OneclawResponse<void>> {
        return this.http.request<void>("DELETE", `/v1/admin/tokens/${tokenId}`);
    }
}
