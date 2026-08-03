import type { HttpClient } from "../core/http";
import type {
    CreateAutomationRequest,
    UpdateAutomationRequest,
    AutomationResponse,
    AutomationListResponse,
    AutomationRunResponse,
    AutomationRunListResponse,
    OneclawResponse,
} from "../types";

/**
 * Automations resource — create and manage scheduled, event-driven,
 * or webhook-triggered agent workflows.
 */
export class AutomationsResource {
    constructor(private readonly http: HttpClient) {}

    /** Create a new automation. */
    async create(
        data: CreateAutomationRequest,
    ): Promise<OneclawResponse<AutomationResponse>> {
        return this.http.request<AutomationResponse>(
            "POST",
            "/v1/automations",
            { body: data },
        );
    }

    /** List all automations in the current organization. */
    async list(): Promise<OneclawResponse<AutomationListResponse>> {
        return this.http.request<AutomationListResponse>(
            "GET",
            "/v1/automations",
        );
    }

    /** Fetch a single automation by ID. */
    async get(
        automationId: string,
    ): Promise<OneclawResponse<AutomationResponse>> {
        return this.http.request<AutomationResponse>(
            "GET",
            `/v1/automations/${automationId}`,
        );
    }

    /** Update an existing automation. */
    async update(
        automationId: string,
        data: UpdateAutomationRequest,
    ): Promise<OneclawResponse<AutomationResponse>> {
        return this.http.request<AutomationResponse>(
            "PATCH",
            `/v1/automations/${automationId}`,
            { body: data },
        );
    }

    /** Delete an automation permanently. */
    async delete(automationId: string): Promise<OneclawResponse<void>> {
        return this.http.request<void>(
            "DELETE",
            `/v1/automations/${automationId}`,
        );
    }

    /** Manually trigger an automation, optionally with input data. */
    async trigger(
        automationId: string,
        input?: Record<string, unknown>,
    ): Promise<OneclawResponse<AutomationRunResponse>> {
        return this.http.request<AutomationRunResponse>(
            "POST",
            `/v1/automations/${automationId}/trigger`,
            { body: input ?? {} },
        );
    }

    /** Rotate webhook token for a webhook-triggered automation (one-time URL + token in response). */
    async rotateWebhookToken(
        automationId: string,
    ): Promise<OneclawResponse<{ webhook_url: string; webhook_token: string }>> {
        return this.http.request(
            "POST",
            `/v1/automations/${automationId}/rotate-webhook-token`,
        );
    }

    /** List runs for an automation. */
    async listRuns(
        automationId: string,
        params?: { status?: string; limit?: number; offset?: number },
    ): Promise<OneclawResponse<AutomationRunListResponse>> {
        const qs = new URLSearchParams();
        if (params?.status) qs.set("status", params.status);
        if (params?.limit != null) qs.set("limit", String(params.limit));
        if (params?.offset != null) qs.set("offset", String(params.offset));
        const query = qs.toString();
        return this.http.request<AutomationRunListResponse>(
            "GET",
            `/v1/automations/${automationId}/runs${query ? `?${query}` : ""}`,
        );
    }

    /** Fetch a single run by ID. */
    async getRun(
        automationId: string,
        runId: string,
    ): Promise<OneclawResponse<AutomationRunResponse>> {
        return this.http.request<AutomationRunResponse>(
            "GET",
            `/v1/automations/${automationId}/runs/${runId}`,
        );
    }
}
