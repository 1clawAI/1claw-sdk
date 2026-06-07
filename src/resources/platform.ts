import type { HttpClient } from "../core/http";
import type {
    CreatePlatformAppRequest,
    UpdatePlatformAppRequest,
    PlatformAppResponse,
    PlatformAppCreatedResponse,
    PlatformAppListResponse,
    CreateTemplateRequest,
    TemplateResponse,
    TemplateListResponse,
    UpsertPlatformUserRequest,
    PlatformUserResponse,
    PlatformConnectedUserListResponse,
    BootstrapRequest,
    BootstrapResponse,
    ReissueClaimRequest,
    ReissueClaimResponse,
    ConnectedAppListResponse,
    ClaimPreviewResponse,
    ClaimRedeemResponse,
    RotatePlatformKeyRequest,
    RotatePlatformKeyResponse,
    OneclawResponse,
} from "../types";

export interface CreateSpendPolicyRequest {
    user_id?: string;
    to_allowlist?: string[];
    to_denylist?: string[];
    max_value_per_tx_eth?: string;
    daily_limit_eth?: string;
    allowed_chains?: string[];
    allowed_tokens?: string[];
    max_transactions_per_day?: number;
}

export interface SpendPolicyResponse {
    id: string;
    platform_app_id: string;
    user_id?: string;
    to_allowlist?: string[];
    to_denylist?: string[];
    max_value_per_tx_eth?: string;
    daily_limit_eth?: string;
    allowed_chains?: string[];
    allowed_tokens?: string[];
    max_transactions_per_day?: number;
    created_at: string;
    updated_at: string;
}

export interface SpendPolicyListResponse {
    policies: SpendPolicyResponse[];
}

/**
 * Platform API — build multi-tenant apps on top of 1Claw.
 * Manage platform apps, templates, user provisioning, and bootstrapping.
 */
export class PlatformResource {
    constructor(private readonly http: HttpClient) {}

    /** Create a new platform app. Returns the app record and a one-time API key. */
    async createApp(
        data: CreatePlatformAppRequest,
    ): Promise<OneclawResponse<PlatformAppCreatedResponse>> {
        return this.http.request<PlatformAppCreatedResponse>(
            "POST",
            "/v1/platform/apps",
            { body: data },
        );
    }

    /** List all platform apps in the current organization. */
    async listApps(): Promise<OneclawResponse<PlatformAppListResponse>> {
        return this.http.request<PlatformAppListResponse>(
            "GET",
            "/v1/platform/apps",
        );
    }

    /** Fetch a single platform app by ID. */
    async getApp(
        appId: string,
    ): Promise<OneclawResponse<PlatformAppResponse>> {
        return this.http.request<PlatformAppResponse>(
            "GET",
            `/v1/platform/apps/${appId}`,
        );
    }

    /** Update a platform app's settings. */
    async updateApp(
        appId: string,
        data: UpdatePlatformAppRequest,
    ): Promise<OneclawResponse<PlatformAppResponse>> {
        return this.http.request<PlatformAppResponse>(
            "PATCH",
            `/v1/platform/apps/${appId}`,
            { body: data },
        );
    }

    /** Delete a platform app permanently. */
    async deleteApp(appId: string): Promise<OneclawResponse<void>> {
        return this.http.request<void>(
            "DELETE",
            `/v1/platform/apps/${appId}`,
        );
    }

    /** Rotate a platform app's API key. Returns the new one-time key. */
    async rotateKey(
        appId: string,
        data?: RotatePlatformKeyRequest,
    ): Promise<OneclawResponse<RotatePlatformKeyResponse>> {
        return this.http.request<RotatePlatformKeyResponse>(
            "POST",
            `/v1/platform/apps/${appId}/rotate-key`,
            { body: data ?? {} },
        );
    }

    /** Create a template for a platform app. */
    async createTemplate(
        appId: string,
        data: CreateTemplateRequest,
    ): Promise<OneclawResponse<TemplateResponse>> {
        return this.http.request<TemplateResponse>(
            "POST",
            `/v1/platform/apps/${appId}/templates`,
            { body: data },
        );
    }

    /** List all templates for a platform app. */
    async listTemplates(
        appId: string,
    ): Promise<OneclawResponse<TemplateListResponse>> {
        return this.http.request<TemplateListResponse>(
            "GET",
            `/v1/platform/apps/${appId}/templates`,
        );
    }

    /** Upsert (create or match) a platform user via token exchange or email. */
    async upsertUser(
        data: UpsertPlatformUserRequest,
    ): Promise<OneclawResponse<PlatformUserResponse>> {
        return this.http.request<PlatformUserResponse>(
            "POST",
            "/v1/platform/users/upsert",
            { body: data },
        );
    }

    /** List connected users for a platform app. */
    async listUsers(
        appId: string,
    ): Promise<OneclawResponse<PlatformConnectedUserListResponse>> {
        return this.http.request<PlatformConnectedUserListResponse>(
            "GET",
            `/v1/platform/apps/${appId}/users`,
        );
    }

    /** Bootstrap a connected user with vaults, agents, and policies from a template. */
    async bootstrapUser(
        connectionId: string,
        data: BootstrapRequest,
    ): Promise<OneclawResponse<BootstrapResponse>> {
        return this.http.request<BootstrapResponse>(
            "POST",
            `/v1/platform/connections/${connectionId}/bootstrap`,
            { body: data },
        );
    }

    /** List apps connected to the calling user (user-side view). */
    async listConnectedApps(): Promise<OneclawResponse<ConnectedAppListResponse>> {
        return this.http.request<ConnectedAppListResponse>(
            "GET",
            "/v1/platform/connected-apps",
        );
    }

    /** Reissue a claim URL for an existing bootstrapped connection (no re-provisioning). */
    async reissueClaim(
        connectionId: string,
        data?: ReissueClaimRequest,
    ): Promise<OneclawResponse<ReissueClaimResponse>> {
        return this.http.request<ReissueClaimResponse>(
            "POST",
            `/v1/platform/connections/${connectionId}/reissue-claim`,
            { body: data ?? {} },
        );
    }

    /** Disconnect from a platform app. */
    async disconnectApp(connectionId: string): Promise<OneclawResponse<void>> {
        return this.http.request<void>(
            "DELETE",
            `/v1/platform/connected-apps/${connectionId}`,
        );
    }

    /** Preview a claim token (public, no auth required). */
    async claimPreview(token: string): Promise<OneclawResponse<ClaimPreviewResponse>> {
        return this.http.request<ClaimPreviewResponse>(
            "GET",
            `/v1/platform/claim/${encodeURIComponent(token)}`,
            { skipAuth: true },
        );
    }

    /** Redeem a claim token to claim bootstrapped resources (public, no auth required). */
    async claimRedeem(token: string): Promise<OneclawResponse<ClaimRedeemResponse>> {
        return this.http.request<ClaimRedeemResponse>(
            "POST",
            `/v1/platform/claim/${encodeURIComponent(token)}`,
            { skipAuth: true },
        );
    }

    /** Create a spend policy for a platform app. */
    async createSpendPolicy(
        appId: string,
        body: CreateSpendPolicyRequest,
    ): Promise<OneclawResponse<SpendPolicyResponse>> {
        return this.http.request<SpendPolicyResponse>(
            "POST",
            `/v1/platform/apps/${appId}/spend-policies`,
            { body },
        );
    }

    /** List spend policies for a platform app. */
    async listSpendPolicies(
        appId: string,
    ): Promise<OneclawResponse<SpendPolicyListResponse>> {
        return this.http.request<SpendPolicyListResponse>(
            "GET",
            `/v1/platform/apps/${appId}/spend-policies`,
        );
    }

    /** Set a spend policy on a user connection. */
    async setUserSpendPolicy(
        connectionId: string,
        body: CreateSpendPolicyRequest,
    ): Promise<OneclawResponse<SpendPolicyResponse>> {
        return this.http.request<SpendPolicyResponse>(
            "PUT",
            `/v1/platform/connections/${connectionId}/spend-policy`,
            { body },
        );
    }

    /** Delete a spend policy from a platform app. */
    async deleteSpendPolicy(
        appId: string,
        policyId: string,
    ): Promise<OneclawResponse<void>> {
        return this.http.request<void>(
            "DELETE",
            `/v1/platform/apps/${appId}/spend-policies/${policyId}`,
        );
    }
}
