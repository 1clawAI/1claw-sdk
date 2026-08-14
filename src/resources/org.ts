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

    /** Get the policy shadow mode divergence report. */
    async getShadowReport(): Promise<OneclawResponse<ShadowReportResponse>> {
        return this.http.request<ShadowReportResponse>("GET", "/v1/org/policy-shadow-report");
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
