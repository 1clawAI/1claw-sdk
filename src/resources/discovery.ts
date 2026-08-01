import type { HttpClient } from "../core/http";
import type {
    AgentCardResponse,
    DirectoryResponse,
    UpdateDiscoveryRequest,
    MarketplaceResponse,
    OneclawResponse,
} from "../types";

/**
 * Discovery resource — agent cards, public directory, and marketplace.
 */
export class DiscoveryResource {
    constructor(private readonly http: HttpClient) {}

    /** Get an agent's public card (no auth required for discoverable agents). */
    async getAgentCard(
        agentId: string,
    ): Promise<OneclawResponse<AgentCardResponse>> {
        return this.http.request<AgentCardResponse>(
            "GET",
            `/v1/agents/${agentId}/card`,
        );
    }

    /** Browse the public agent directory. */
    async directory(params?: {
        tags?: string;
        q?: string;
        page?: number;
        page_size?: number;
    }): Promise<OneclawResponse<DirectoryResponse>> {
        const searchParams = new URLSearchParams();
        if (params?.tags) searchParams.set("tags", params.tags);
        if (params?.q) searchParams.set("q", params.q);
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.page_size)
            searchParams.set("page_size", String(params.page_size));
        const qs = searchParams.toString();
        return this.http.request<DirectoryResponse>(
            "GET",
            `/v1/agents/directory${qs ? `?${qs}` : ""}`,
        );
    }

    /** Update an agent's discovery settings (human-only). */
    async updateDiscovery(
        agentId: string,
        data: UpdateDiscoveryRequest,
    ): Promise<OneclawResponse<void>> {
        return this.http.request<void>(
            "PATCH",
            `/v1/agents/${agentId}/discovery`,
            { body: data },
        );
    }

    /** Browse the platform app marketplace. */
    async marketplace(): Promise<OneclawResponse<MarketplaceResponse>> {
        return this.http.request<MarketplaceResponse>(
            "GET",
            "/v1/platform/marketplace",
        );
    }
}
