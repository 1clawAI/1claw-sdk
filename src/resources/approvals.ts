import type { HttpClient } from "../core/http";
import type {
    ApprovalRequest,
    CreateApprovalRequest,
    ApprovalListResponse,
    OneclawResponse,
} from "../types";

/**
 * Approvals resource — human-in-the-loop approval workflows.
 *
 * Agents can request human approval before accessing sensitive secrets.
 * Humans review, approve, or deny requests through the dashboard or API.
 *
 * **Status**: These endpoints are planned for an upcoming API release.
 * The SDK methods are provided for forward compatibility and will work
 * once the backend endpoints are deployed.
 */
export class ApprovalsResource {
    constructor(private readonly http: HttpClient) {}

    /**
     * Request human approval for a policy change or sensitive action.
     * Called by agents — routed to the agent's creator for review.
     */
    async request(
        options: CreateApprovalRequest,
    ): Promise<OneclawResponse<ApprovalRequest>> {
        return this.http.request<ApprovalRequest>("POST", "/v1/approvals/request", {
            body: options,
        });
    }

    /**
     * List approval requests, optionally filtered by status.
     * @param status - "pending", "approved", or "denied"
     */
    async list(
        status?: "pending" | "approved" | "denied",
    ): Promise<OneclawResponse<ApprovalListResponse>> {
        return this.http.request<ApprovalListResponse>("GET", "/v1/approvals", {
            query: status ? { status } : undefined,
        });
    }

    /** Approve a pending request. */
    async approve(
        requestId: string,
    ): Promise<OneclawResponse<ApprovalRequest>> {
        return this.http.request<ApprovalRequest>(
            "POST",
            `/v1/approvals/${requestId}/approve`,
        );
    }

    /** Deny a pending request with an optional reason. */
    async deny(
        requestId: string,
        reason?: string,
    ): Promise<OneclawResponse<ApprovalRequest>> {
        return this.http.request<ApprovalRequest>(
            "POST",
            `/v1/approvals/${requestId}/deny`,
            { body: reason ? { reason } : undefined },
        );
    }

    /**
     * Decide on a pending approval (approve or reject).
     * Used by the mobile app's step-up authentication flow.
     *
     * @param requestId - The approval ID
     * @param decision - "approved" or "rejected"
     * @param options - Optional reason and auth headers (X-Auth-Confirm, X-MFA-Token)
     */
    async decide(
        requestId: string,
        decision: "approved" | "rejected",
        options?: {
            reason?: string;
            stepUpToken?: string;
            mfaToken?: string;
        },
    ): Promise<OneclawResponse<ApprovalRequest>> {
        const headers: Record<string, string> = {};
        if (options?.stepUpToken)
            headers["X-Auth-Confirm"] = options.stepUpToken;
        if (options?.mfaToken) headers["X-MFA-Token"] = options.mfaToken;

        return this.http.request<ApprovalRequest>(
            "POST",
            `/v1/approvals/${requestId}/decide`,
            {
                body: { decision, reason: options?.reason },
                headers: Object.keys(headers).length > 0 ? headers : undefined,
            },
        );
    }

    /**
     * Poll for the status of a specific approval request.
     * Returns the current state — useful for agents waiting on approval.
     */
    async check(requestId: string): Promise<OneclawResponse<ApprovalRequest>> {
        return this.http.request<ApprovalRequest>(
            "GET",
            `/v1/approvals/${requestId}`,
        );
    }

    /**
     * Subscribe to approval events via polling.
     * Calls the callback every `intervalMs` with new/changed approvals.
     * Returns an unsubscribe function.
     */
    subscribe(
        callback: (approvals: ApprovalRequest[]) => void,
        options: {
            status?: "pending" | "approved" | "denied";
            intervalMs?: number;
        } = {},
    ): () => void {
        const interval = options.intervalMs ?? 3000;
        let active = true;

        const poll = async () => {
            while (active) {
                try {
                    const res = await this.list(options.status);
                    if (res.data?.approvals) {
                        callback(res.data.approvals);
                    }
                } catch {
                    /* silently retry */
                }
                await new Promise((r) => setTimeout(r, interval));
            }
        };

        poll();
        return () => {
            active = false;
        };
    }
}
