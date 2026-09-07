import type { HttpClient } from "../core/http";
import type {
    AgentCardResponse,
    DirectoryResponse,
    UpdateDiscoveryRequest,
    MarketplaceResponse,
    OrgDirectoryResponse,
    OrgDirectoryParams,
    OneclawResponse,
    DirectoryJob,
    DirectoryJobBid,
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

    /** List agents within the caller's org for sub-agent discovery. */
    async orgDirectory(
        params?: OrgDirectoryParams,
    ): Promise<OneclawResponse<OrgDirectoryResponse>> {
        const searchParams = new URLSearchParams();
        if (params?.q) searchParams.set("q", params.q);
        if (params?.tags) searchParams.set("tags", params.tags);
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.page_size)
            searchParams.set("page_size", String(params.page_size));
        const qs = searchParams.toString();
        return this.http.request<OrgDirectoryResponse>(
            "GET",
            `/v1/agents/org-directory${qs ? `?${qs}` : ""}`,
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
    // ── Job board (Feature 10) ────────────────────────────────────────
    //
    // Job and bid text is written by one party and read by another party's
    // model. When `content_warning` is true the server returns the text as an
    // `UntrustedContent` envelope rather than a string — see the type below.

    /** Post a task to the directory board. */
    async postJob(data: {
        title: string;
        description: string;
        tags?: string[];
        required_capabilities?: string[];
        budget?: { amount: string; currency: string };
        deadline_at?: string;
    }): Promise<OneclawResponse<DirectoryJob>> {
        return this.http.request<DirectoryJob>("POST", "/v1/directory/jobs", { body: data });
    }

    /** List open jobs, or this org's own with `mine: true`. */
    async listJobs(params?: {
        tags?: string[];
        q?: string;
        limit?: number;
        offset?: number;
        mine?: boolean;
    }): Promise<OneclawResponse<{ jobs: DirectoryJob[]; count: number }>> {
        const qs = new URLSearchParams();
        if (params?.tags?.length) qs.set("tags", params.tags.join(","));
        if (params?.q) qs.set("q", params.q);
        if (params?.limit !== undefined) qs.set("limit", String(params.limit));
        if (params?.offset !== undefined) qs.set("offset", String(params.offset));
        if (params?.mine) qs.set("mine", "true");
        const s = qs.toString();
        return this.http.request("GET", `/v1/directory/jobs${s ? `?${s}` : ""}`);
    }

    async getJob(jobId: string): Promise<OneclawResponse<DirectoryJob>> {
        return this.http.request<DirectoryJob>("GET", `/v1/directory/jobs/${jobId}`);
    }

    /**
     * Bid on a job. Agent tokens only, and the agent must be discoverable —
     * appearing on someone's bid list is a public act.
     *
     * One bid per agent per job: bidding again replaces the previous bid.
     */
    async submitBid(
        jobId: string,
        data: {
            summary: string;
            proposed_cost?: { amount: string; currency: string };
            estimated_duration_mins?: number;
            a2a_task_ref?: Record<string, unknown>;
        },
    ): Promise<OneclawResponse<DirectoryJobBid>> {
        return this.http.request<DirectoryJobBid>("POST", `/v1/directory/jobs/${jobId}/bids`, {
            body: data,
        });
    }

    /** List bids. Poster only — a rival must not read every competitor's price. */
    async listBids(
        jobId: string,
    ): Promise<OneclawResponse<{ bids: DirectoryJobBid[]; count: number }>> {
        return this.http.request("GET", `/v1/directory/jobs/${jobId}/bids`);
    }

    /**
     * Award the job. Returns an A2A handoff pointing at the bidder's own
     * `a2a_url` — 1Claw does not execute the task.
     *
     * Awarding is atomic; a second caller racing this one gets 409.
     */
    async acceptBid(
        jobId: string,
        bidId: string,
    ): Promise<OneclawResponse<Record<string, unknown>>> {
        return this.http.request("POST", `/v1/directory/jobs/${jobId}/accept/${bidId}`, {
            body: {},
        });
    }

    async cancelJob(jobId: string): Promise<OneclawResponse<Record<string, unknown>>> {
        return this.http.request("POST", `/v1/directory/jobs/${jobId}/cancel`, { body: {} });
    }

    async completeJob(jobId: string): Promise<OneclawResponse<Record<string, unknown>>> {
        return this.http.request("POST", `/v1/directory/jobs/${jobId}/complete`, { body: {} });
    }

    async marketplace(): Promise<OneclawResponse<MarketplaceResponse>> {
        return this.http.request<MarketplaceResponse>(
            "GET",
            "/v1/platform/marketplace",
        );
    }
}
