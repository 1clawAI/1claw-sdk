import type { HttpClient } from "../core/http";
import type {
    CreateAutomationRequest,
    UpdateAutomationRequest,
    AutomationResponse,
    AutomationListResponse,
    AutomationRunResponse,
    AutomationRunListResponse,
    AutomationPresetsResponse,
    AutomationVersionListResponse,
    DryRunResponse,
    TriggerAutomationRequest,
    WorkflowSpec,
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

    /**
     * Manually trigger an automation. `input` reaches steps as `{{trigger.*}}`.
     * With `options.idempotencyKey`, the same key twice returns the run already
     * started for it (HTTP 200) rather than a second one (201).
     */
    async trigger(
        automationId: string,
        input?: Record<string, unknown>,
        options?: { idempotencyKey?: string },
    ): Promise<OneclawResponse<AutomationRunResponse>> {
        const body: TriggerAutomationRequest = {};
        if (input) body.input = input;
        if (options?.idempotencyKey) body.idempotency_key = options.idempotencyKey;
        return this.http.request<AutomationRunResponse>(
            "POST",
            `/v1/automations/${automationId}/trigger`,
            { body },
        );
    }

    /**
     * Preview what a run would do with nothing done (vault ≥ 0.61.46): each
     * step after template substitution, its effect, error policy, unresolved
     * templates and the budget it would hit. Pass `workflowSpec` to preview an
     * unsaved spec, otherwise the automation's current one.
     */
    async dryRun(
        automationId: string | null,
        options?: { workflowSpec?: WorkflowSpec; input?: Record<string, unknown> },
    ): Promise<OneclawResponse<DryRunResponse>> {
        const body = { workflow_spec: options?.workflowSpec, input: options?.input };
        return this.http.request<DryRunResponse>(
            "POST",
            automationId ? `/v1/automations/${automationId}/dry-run` : "/v1/automations/dry-run",
            { body },
        );
    }

    /**
     * Start a new run seeded with `runId`'s results up to `fromStep` and
     * continue from there, on the spec version that run executed.
     */
    async rerunFromStep(
        automationId: string,
        runId: string,
        fromStep = 0,
    ): Promise<OneclawResponse<AutomationRunResponse>> {
        return this.http.request<AutomationRunResponse>(
            "POST",
            `/v1/automations/${automationId}/runs/${runId}/rerun`,
            { body: { from_step: fromStep } },
        );
    }

    /** Every spec version the automation has had, newest first (vault ≥ 0.61.45). */
    async listVersions(
        automationId: string,
    ): Promise<OneclawResponse<AutomationVersionListResponse>> {
        return this.http.request<AutomationVersionListResponse>(
            "GET",
            `/v1/automations/${automationId}/versions`,
        );
    }

    /**
     * Publish an earlier version's spec as the new current version. A rollback
     * that widens the automation goes through the `automation.widen` consensus
     * gate; pass `approvalId` when one is required.
     */
    async rollback(
        automationId: string,
        version: number,
        options?: { note?: string; approvalId?: string },
    ): Promise<OneclawResponse<AutomationResponse>> {
        return this.http.request<AutomationResponse>(
            "POST",
            `/v1/automations/${automationId}/versions/${version}/rollback`,
            { body: { note: options?.note, approval_id: options?.approvalId } },
        );
    }

    /**
     * Continue a run parked on an `awaiting_callback` step. Public: no API key,
     * just the per-run token from `{{run.callback_token}}`. `payload` reaches
     * later steps as `{{resume.*}}`.
     */
    async callback(
        automationId: string,
        runId: string,
        token: string,
        payload?: Record<string, unknown>,
    ): Promise<OneclawResponse<AutomationRunResponse>> {
        return this.http.request<AutomationRunResponse>(
            "POST",
            `/v1/automations/${automationId}/runs/${runId}/callback/${encodeURIComponent(token)}`,
            { body: payload ?? {} },
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

    /** Cancel a running or awaiting_approval run. */
    async cancelRun(
        automationId: string,
        runId: string,
    ): Promise<OneclawResponse<AutomationRunResponse>> {
        return this.http.request<AutomationRunResponse>(
            "POST",
            `/v1/automations/${automationId}/runs/${runId}/cancel`,
        );
    }

    /**
     * Resume a run parked on an approval, as if approved (vault ≥ 0.61.30).
     * Deciding the approval resumes the run automatically; use this for a
     * decision made elsewhere. `payload` reaches later steps as `{{resume.*}}`.
     */
    async resumeRun(
        automationId: string,
        runId: string,
        payload?: Record<string, unknown>,
    ): Promise<OneclawResponse<AutomationRunResponse>> {
        return this.http.request<AutomationRunResponse>(
            "POST",
            `/v1/automations/${automationId}/runs/${runId}/resume`,
            { body: payload ? { payload } : {} },
        );
    }

    /** List public automation presets (no auth required). */
    async getPresets(): Promise<OneclawResponse<AutomationPresetsResponse>> {
        return this.http.request<AutomationPresetsResponse>(
            "GET",
            "/v1/automations/presets",
        );
    }
}
