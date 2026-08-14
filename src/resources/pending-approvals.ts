import type { HttpClient } from "../core/http";
import type {
    SubmitPendingApprovalRequest,
    PendingApprovalResponse,
    PendingApprovalListResponse,
    ApprovePendingApprovalRequest,
    OneclawResponse,
} from "../types";

export class PendingApprovalsResource {
    constructor(private readonly http: HttpClient) {}

    async submit(body: SubmitPendingApprovalRequest): Promise<OneclawResponse<PendingApprovalResponse>> {
        return this.http.request<PendingApprovalResponse>("POST", "/v1/pending-approvals", { body });
    }

    async list(params?: { status?: string; agent_id?: string }): Promise<OneclawResponse<PendingApprovalListResponse>> {
        const query = new URLSearchParams();
        if (params?.status) query.set("status", params.status);
        if (params?.agent_id) query.set("agent_id", params.agent_id);
        const qs = query.toString();
        return this.http.request<PendingApprovalListResponse>("GET", `/v1/pending-approvals${qs ? `?${qs}` : ""}`);
    }

    async get(id: string): Promise<OneclawResponse<PendingApprovalResponse>> {
        return this.http.request<PendingApprovalResponse>("GET", `/v1/pending-approvals/${id}`);
    }

    async approve(id: string, body: ApprovePendingApprovalRequest): Promise<OneclawResponse<PendingApprovalResponse>> {
        return this.http.request<PendingApprovalResponse>("POST", `/v1/pending-approvals/${id}/approve`, { body });
    }

    async execute(id: string): Promise<OneclawResponse<PendingApprovalResponse>> {
        return this.http.request<PendingApprovalResponse>("POST", `/v1/pending-approvals/${id}/execute`);
    }

    async cancel(id: string): Promise<OneclawResponse<PendingApprovalResponse>> {
        return this.http.request<PendingApprovalResponse>("POST", `/v1/pending-approvals/${id}/cancel`);
    }
}
