import type { HttpClient } from "../core/http";
import type {
    OrgMemberResponse,
    OrgMemberListResponse,
    UpdateMemberRoleRequest,
    OneclawResponse,
    PolicyBackendSettings,
    UpdatePolicyBackendSettingsRequest,
    ShadowReportResponse,
} from "../types";
import type { ApiSchemas } from "../types";

/**
 * Org resource — manage organization membership and roles.
 */
export class OrgResource {
    constructor(private readonly http: HttpClient) {}

    /** List all members of the current organization. */
    async listMembers(): Promise<OneclawResponse<OrgMemberListResponse>> {
        return this.http.request<OrgMemberListResponse>(
            "GET",
            "/v1/org/members",
        );
    }

    /**
     * Get the org's __agent-keys vault id (for revealing agent identity keys).
     * Users only. Returns 404 if the vault does not exist (e.g. no agents created yet).
     */
    async getAgentKeysVault(): Promise<
        OneclawResponse<ApiSchemas["AgentKeysVaultResponse"]>
    > {
        return this.http.request<ApiSchemas["AgentKeysVaultResponse"]>(
            "GET",
            "/v1/org/agent-keys-vault",
        );
    }

    /** Update a member's role (owner, admin, or member). */
    async updateMemberRole(
        userId: string,
        role: UpdateMemberRoleRequest["role"],
    ): Promise<OneclawResponse<OrgMemberResponse>> {
        return this.http.request<OrgMemberResponse>(
            "PATCH",
            `/v1/org/members/${userId}`,
            { body: { role } },
        );
    }

    /** Remove a member from the organization. */
    async removeMember(userId: string): Promise<OneclawResponse<void>> {
        return this.http.request<void>("DELETE", `/v1/org/members/${userId}`);
    }

    /** Get onboarding progress for the current org (welcome bundle + MCP readiness). */
    async getOnboardingStatus(): Promise<
        OneclawResponse<ApiSchemas["OnboardingStatus"]>
    > {
        return this.http.request<ApiSchemas["OnboardingStatus"]>(
            "GET",
            "/v1/org/onboarding/status",
        );
    }

    /**
     * Provision MCP onboarding: welcome vault, sample secret, agent, default ** policy.
     * Returns one-time agent API key and stdio MCP config. Human-only.
     */
    async provisionOnboarding(
        body?: ApiSchemas["OnboardingProvisionRequest"],
    ): Promise<OneclawResponse<ApiSchemas["OnboardingProvisionResponse"]>> {
        return this.http.request<ApiSchemas["OnboardingProvisionResponse"]>(
            "POST",
            "/v1/onboarding/provision",
            { body: body ?? {} },
        );
    }

    /** Get org Bankr partner configuration (prefix + wallet; never returns the partner key). */
    async getBankrConfig(): Promise<OneclawResponse<OrgBankrConfigResponse>> {
        return this.http.request<OrgBankrConfigResponse>("GET", "/v1/org/bankr-config");
    }

    /** Store or replace the org's Bankr partner key and optional default wallet. Owner/admin only. */
    async setBankrConfig(
        body: UpsertOrgBankrConfigRequest,
    ): Promise<OneclawResponse<OrgBankrConfigResponse>> {
        return this.http.request<OrgBankrConfigResponse>("PUT", "/v1/org/bankr-config", {
            body,
        });
    }

    /** Remove org Bankr BYOK configuration. Owner/admin only. */
    async deleteBankrConfig(): Promise<OneclawResponse<void>> {
        return this.http.request<void>("DELETE", "/v1/org/bankr-config");
    }

    /** Get the org's policy backend settings (Cedar/OPA enforcement configuration). */
    async getPolicyBackendSettings(): Promise<OneclawResponse<PolicyBackendSettings>> {
        return this.http.request<PolicyBackendSettings>("GET", "/v1/org/settings/policy-backend");
    }

    /** Update the org's policy backend settings. */
    async updatePolicyBackendSettings(
        body: UpdatePolicyBackendSettingsRequest,
    ): Promise<OneclawResponse<PolicyBackendSettings>> {
        return this.http.request<PolicyBackendSettings>("PATCH", "/v1/org/settings/policy-backend", { body });
    }

    /** Get the Cedar/OPA policy shadow mode divergence report. */
    async getPolicyShadowReport(): Promise<OneclawResponse<ShadowReportResponse>> {
        return this.http.request<ShadowReportResponse>("GET", "/v1/org/policy-shadow-report");
    }

    /** @deprecated Use {@link getPolicyShadowReport} */
    async getShadowReport(): Promise<OneclawResponse<ShadowReportResponse>> {
        return this.getPolicyShadowReport();
    }

    /** Get Convention 6 guardrail shadow violations (execution guardrails in log mode). */
    async getGuardrailShadowReport(params?: { since?: string; until?: string }): Promise<
        OneclawResponse<GuardrailShadowReportResponse>
    > {
        const query = new URLSearchParams();
        if (params?.since) query.set("since", params.since);
        if (params?.until) query.set("until", params.until);
        const qs = query.toString();
        return this.http.request<GuardrailShadowReportResponse>(
            "GET",
            `/v1/org/guardrail-shadow-report${qs ? `?${qs}` : ""}`,
        );
    }

    /** List guardrail revision history for agent/binding changes. */
    async listGuardrailRevisions(): Promise<OneclawResponse<GuardrailRevisionListResponse>> {
        return this.http.request<GuardrailRevisionListResponse>("GET", "/v1/org/guardrail-revisions");
    }
}

export interface OrgBankrConfigResponse {
    configured: boolean;
    partner_key_prefix?: string;
    default_wallet_id?: string;
    updated_at?: string;
    using_platform_fallback: boolean;
}

export interface UpsertOrgBankrConfigRequest {
    partner_key: string;
    default_wallet_id?: string;
}

export interface GuardrailShadowReportResponse {
    org_id: string;
    since: string;
    until: string;
    total_would_deny: number;
    by_reason: Array<{ reason_code: string; would_deny_count: number; enforced_count: number }>;
}

export interface GuardrailRevisionListResponse {
    revisions: Array<{
        id: string;
        org_id: string;
        resource_type: string;
        resource_id: string;
        actor_id: string;
        before_json: Record<string, unknown>;
        after_json: Record<string, unknown>;
        change_kind: string;
        approval_id?: string | null;
        created_at: string;
    }>;
}
