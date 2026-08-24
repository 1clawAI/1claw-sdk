import type { HttpClient } from "../core/http";
import type {
    ApprovalListResponse,
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
    MarketplaceResponse,
    GrantResourcesRequest,
    GrantResourcesResponse,
    GrantListResponse,
    UpdateConnectionDelegationRequest,
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
    inference_allowance_usd?: string;
    inference_reserved_pct?: number;
    inference_hard_stop?: boolean;
    inference_allowance_mode?: string;
    max_request_cost_usd?: string;
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
    inference_allowance_usd?: string;
    inference_reserved_pct?: number;
    inference_hard_stop?: boolean;
    inference_allowance_mode?: string;
    max_request_cost_usd?: string;
    created_at: string;
    updated_at: string;
}

export interface SiweChallengeRequest {
    domain?: string;
}

export interface SiweChallengeResponse {
    nonce: string;
    expires_in: number;
    domain: string;
}

export interface ClaimStatusResponse {
    status: string;
    redeemed_at?: string;
}

export interface ConnectionDetailResponse {
    connection_id: string;
    user_id: string;
    status: string;
    entitlement_status: string;
    wallet_address?: string;
    vault_ids: string[];
    agent_ids: string[];
    claimed_at?: string;
    claim: ClaimStatusResponse;
}

export interface ConnectionUsageResponse {
    connection_id: string;
    period: string;
    inference_spent_usd: string;
}

export interface EntitlementEvaluationResponse {
    id: string;
    status: string;
    watch_kind: string;
    chain: string;
    holder_address: string;
    last_value_raw?: string;
    last_checked_at?: string;
}

export interface EntitlementsListResponse {
    evaluations: EntitlementEvaluationResponse[];
}

export interface TemplatePreviewRequest {
    parameters?: Record<string, unknown>;
    subject?: {
        user_id?: string;
        external_subject?: string;
        wallet_address?: string;
        email?: string;
    };
}

export interface TemplatePreviewResponse {
    resolved_spec: Record<string, unknown>;
}

export interface InferenceBudgetResponse {
    allowance_usd: string;
    spent_usd: string;
    remaining_usd: string;
    reserved_pct: number;
    max_request_cost_usd: string;
    period_end: string;
    connection_id?: string;
}

export interface SpendPolicyListResponse {
    policies: SpendPolicyResponse[];
}

export interface UpdateTemplateRequest {
    name?: string;
    description?: string;
    spec?: Record<string, unknown>;
    is_active?: boolean;
}

export interface PlatformAuditEvent {
    id: string;
    action: string;
    actor_id: string;
    resource_type?: string;
    resource_id?: string;
    metadata?: Record<string, unknown>;
    created_at: string;
}

export interface PlatformAuditResponse {
    events: PlatformAuditEvent[];
    total: number;
}

export interface PlatformRuntimesResponse {
    runtimes: Array<Record<string, unknown>>;
}

export interface PlatformAutomationsResponse {
    automations: Array<Record<string, unknown>>;
}

export interface PlatformAppStatsResponse {
    total_connections: number;
    active_connections: number;
    claimed_connections: number;
    total_bootstraps: number;
    total_grants: number;
}

export interface RotateWebhookSecretResponse {
    webhook_secret: string;
}

export interface PlatformAppDeleteResponse {
    deleted: boolean;
    soft_delete: boolean;
    slug_released: boolean;
    former_slug: string;
}

export interface TransferPlatformAppOwnershipRequest {
    target_org_id?: string;
    target_user_email?: string;
}

export interface TransferPlatformAppOwnershipResponse {
    app_id: string;
    former_org_id: string;
    new_org_id: string;
    message: string;
}

export interface ConnectionSpendPolicyResponse {
    policy: SpendPolicyResponse | null;
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

    /** Soft-delete a platform app and release its slug. */
    async deleteApp(
        appId: string,
    ): Promise<OneclawResponse<PlatformAppDeleteResponse>> {
        return this.http.request<PlatformAppDeleteResponse>(
            "DELETE",
            `/v1/platform/apps/${appId}`,
        );
    }

    /** Transfer app ownership to another organization (step-up auth required). */
    async transferAppOwnership(
        appId: string,
        body: TransferPlatformAppOwnershipRequest,
        options?: { confirmToken?: string },
    ): Promise<OneclawResponse<TransferPlatformAppOwnershipResponse>> {
        return this.http.request<TransferPlatformAppOwnershipResponse>(
            "POST",
            `/v1/platform/apps/${appId}/transfer-ownership`,
            {
                body,
                headers: options?.confirmToken
                    ? { "X-Auth-Confirm": options.confirmToken }
                    : undefined,
            },
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

    /** Rotate a platform app's webhook signing secret. Returns the new secret (one-time). */
    async rotateWebhookSecret(
        appId: string,
    ): Promise<OneclawResponse<RotateWebhookSecretResponse>> {
        return this.http.request<RotateWebhookSecretResponse>(
            "POST",
            `/v1/platform/apps/${appId}/rotate-webhook-secret`,
        );
    }

    /** Get aggregate statistics for a platform app (connections, bootstraps, grants). */
    async getAppStats(
        appId: string,
    ): Promise<OneclawResponse<PlatformAppStatsResponse>> {
        return this.http.request<PlatformAppStatsResponse>(
            "GET",
            `/v1/platform/apps/${appId}/stats`,
        );
    }

    /** Browse the public platform marketplace (no auth required). */
    async marketplace(
        params?: { page?: number; per_page?: number; q?: string; category?: string },
    ): Promise<OneclawResponse<MarketplaceResponse>> {
        return this.http.request<MarketplaceResponse>(
            "GET",
            "/v1/platform/marketplace",
            { query: params as Record<string, string | number | undefined>, skipAuth: true },
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

    /**
     * Upsert (create or match) a platform user via token exchange or email.
     *
     * When the user exists in a different org, the API returns 409 with a
     * `link_required` payload containing an OAuth authorize URL. This method
     * treats 409 as a successful typed response so callers can branch on
     * `result.data?.link_required`.
     */
    async upsertUser(
        data: UpsertPlatformUserRequest,
    ): Promise<OneclawResponse<PlatformUserResponse>> {
        return this.http.request<PlatformUserResponse>(
            "POST",
            "/v1/platform/users/upsert",
            { body: data, acceptStatuses: [409] },
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

    /** Get a single spend policy by ID (platform org human JWT). */
    async getSpendPolicy(
        appId: string,
        policyId: string,
    ): Promise<OneclawResponse<SpendPolicyResponse>> {
        return this.http.request<SpendPolicyResponse>(
            "GET",
            `/v1/platform/apps/${appId}/spend-policies/${policyId}`,
        );
    }

    /** Effective spend policy for a connection (`plt_` auth). */
    async getConnectionSpendPolicy(
        connectionId: string,
    ): Promise<OneclawResponse<ConnectionSpendPolicyResponse>> {
        return this.http.request<ConnectionSpendPolicyResponse>(
            "GET",
            `/v1/platform/connections/${connectionId}/spend-policy`,
        );
    }

    /** Approvals for a connected user (`plt_` auth). */
    async listConnectionApprovals(
        connectionId: string,
        params?: {
            status?: "pending" | "approved" | "denied";
            risk_tier?: number;
            limit?: number;
            offset?: number;
        },
    ): Promise<OneclawResponse<ApprovalListResponse>> {
        return this.http.request<ApprovalListResponse>(
            "GET",
            `/v1/platform/connections/${connectionId}/approvals`,
            { query: params as Record<string, string | number | undefined> },
        );
    }

    /** Single approval for a connection (`plt_` auth). */
    async getConnectionApproval(
        connectionId: string,
        approvalId: string,
    ): Promise<OneclawResponse<ApprovalListResponse["approvals"][number]>> {
        return this.http.request(
            "GET",
            `/v1/platform/connections/${connectionId}/approvals/${approvalId}`,
        );
    }

    /** Pending consensus approvals for a connection (`plt_` auth). */
    async listConnectionPendingApprovals(
        connectionId: string,
        params?: { status?: string; limit?: number; offset?: number },
    ): Promise<
        OneclawResponse<{
            pending_approvals: Array<{
                id: string;
                action_payload: Record<string, unknown>;
                payload_hash: string;
                status: string;
            }>;
            total: number;
        }>
    > {
        return this.http.request(
            "GET",
            `/v1/platform/connections/${connectionId}/pending-approvals`,
            { query: params as Record<string, string | number | undefined> },
        );
    }

    /** Set a spend policy on a user connection. */
    async setUserSpendPolicy(
        connectionId: string,
        body: CreateSpendPolicyRequest,
        options?: { idempotencyKey?: string },
    ): Promise<OneclawResponse<SpendPolicyResponse>> {
        return this.http.request<SpendPolicyResponse>(
            "PUT",
            `/v1/platform/connections/${connectionId}/spend-policy`,
            {
                body,
                headers: options?.idempotencyKey
                    ? { "Idempotency-Key": options.idempotencyKey }
                    : undefined,
            },
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

    /**
     * Grant a platform app access to specific vaults and agents.
     * User-authenticated — the calling user must own the connection and resources.
     */
    async grantAccess(
        connectionId: string,
        data: GrantResourcesRequest,
    ): Promise<OneclawResponse<GrantResourcesResponse>> {
        return this.http.request<GrantResourcesResponse>(
            "POST",
            `/v1/platform/connections/${connectionId}/grant`,
            { body: data },
        );
    }

    /** List active resource grants for a connection. */
    async listGrants(
        connectionId: string,
    ): Promise<OneclawResponse<GrantListResponse>> {
        return this.http.request<GrantListResponse>(
            "GET",
            `/v1/platform/connections/${connectionId}/grants`,
        );
    }

    /** Revoke a specific resource grant. */
    async revokeGrant(
        connectionId: string,
        grantId: string,
    ): Promise<OneclawResponse<void>> {
        return this.http.request<void>(
            "DELETE",
            `/v1/platform/connections/${connectionId}/grants/${grantId}`,
        );
    }

    /** Update delegation settings (enabled, scopes) on a connected app. User-only. */
    async updateConnectionDelegation(
        connectionId: string,
        data: UpdateConnectionDelegationRequest,
    ): Promise<OneclawResponse<Record<string, unknown>>> {
        return this.http.request<Record<string, unknown>>(
            "PATCH",
            `/v1/platform/connected-apps/${connectionId}`,
            { body: data },
        );
    }

    /** List all resources managed by this platform app for a connection. */
    async listConnectionResources(
        connectionId: string,
    ): Promise<OneclawResponse<Record<string, unknown>>> {
        return this.http.request<Record<string, unknown>>(
            "GET",
            `/v1/platform/connections/${connectionId}/resources`,
            { headers: { "X-Platform-Connection": connectionId } },
        );
    }

    /** Get the delegation audit log for a connection. */
    async getDelegationLog(
        connectionId: string,
        params?: { limit?: number; offset?: number },
    ): Promise<OneclawResponse<{ entries: unknown[]; total: number }>> {
        return this.http.request<{ entries: unknown[]; total: number }>(
            "GET",
            `/v1/platform/connections/${connectionId}/delegation-log`,
            { query: params as Record<string, string | number | undefined> },
        );
    }

    /** Update a template for a platform app. */
    async updateTemplate(
        appId: string,
        templateId: string,
        data: UpdateTemplateRequest,
    ): Promise<OneclawResponse<TemplateResponse>> {
        return this.http.request<TemplateResponse>(
            "PATCH",
            `/v1/platform/apps/${appId}/templates/${templateId}`,
            { body: data },
        );
    }

    /** Delete a template from a platform app. */
    async deleteTemplate(
        appId: string,
        templateId: string,
    ): Promise<OneclawResponse<void>> {
        return this.http.request<void>(
            "DELETE",
            `/v1/platform/apps/${appId}/templates/${templateId}`,
        );
    }

    /** Fetch platform audit events for an app. */
    async platformAudit(
        appId: string,
        params?: { limit?: number; offset?: number },
    ): Promise<OneclawResponse<PlatformAuditResponse>> {
        return this.http.request<PlatformAuditResponse>(
            "GET",
            `/v1/platform/apps/${appId}/audit`,
            { query: params as Record<string, string | number | undefined> },
        );
    }

    /** List runtimes managed by a platform app. */
    async listPlatformRuntimes(
        appId: string,
    ): Promise<OneclawResponse<PlatformRuntimesResponse>> {
        return this.http.request<PlatformRuntimesResponse>(
            "GET",
            `/v1/platform/apps/${appId}/runtimes`,
        );
    }

    /** List automations managed by a platform app. */
    async listPlatformAutomations(
        appId: string,
    ): Promise<OneclawResponse<PlatformAutomationsResponse>> {
        return this.http.request<PlatformAutomationsResponse>(
            "GET",
            `/v1/platform/apps/${appId}/automations`,
        );
    }

    /** SIWE challenge for wallet-native user provisioning. */
    async siweChallenge(
        data?: SiweChallengeRequest,
    ): Promise<OneclawResponse<SiweChallengeResponse>> {
        return this.http.request(
            "POST",
            "/v1/platform/siwe/challenge",
            { body: data ?? {} },
        );
    }

    /** Get connection details including claim and entitlement status. */
    async getConnection(
        connectionId: string,
    ): Promise<OneclawResponse<ConnectionDetailResponse>> {
        return this.http.request(
            "GET",
            `/v1/platform/connections/${connectionId}`,
        );
    }

    /** Per-connection inference usage for the current billing period. */
    async getConnectionUsage(
        connectionId: string,
    ): Promise<OneclawResponse<ConnectionUsageResponse>> {
        return this.http.request(
            "GET",
            `/v1/platform/connections/${connectionId}/usage`,
        );
    }

    /** List on-chain entitlement evaluations for a connection. */
    async listEntitlements(
        connectionId: string,
    ): Promise<OneclawResponse<EntitlementsListResponse>> {
        return this.http.request(
            "GET",
            `/v1/platform/connections/${connectionId}/entitlements`,
        );
    }

    /** Trigger an immediate entitlement monitor refresh for the connection's org. */
    async refreshEntitlements(
        connectionId: string,
    ): Promise<OneclawResponse<void>> {
        return this.http.request(
            "POST",
            `/v1/platform/connections/${connectionId}/entitlements/refresh`,
            { acceptStatuses: [202] },
        );
    }

    /** Dry-run template parameter substitution. */
    async previewTemplate(
        appId: string,
        templateId: string,
        data: TemplatePreviewRequest,
    ): Promise<OneclawResponse<TemplatePreviewResponse>> {
        return this.http.request(
            "POST",
            `/v1/platform/apps/${appId}/templates/${templateId}/preview`,
            { body: data },
        );
    }

    /**
     * Returns a scoped client that auto-sets `X-Platform-Connection` on all
     * requests. Allows platform developers to perform CRUD in a connected
     * user's org using standard resource methods.
     */
    withConnection(connectionId: string): ScopedPlatformClient {
        return new ScopedPlatformClient(this.http, connectionId);
    }
}

/**
 * A scoped client that automatically attaches the `X-Platform-Connection`
 * header to every request, enabling platform developers to manage resources
 * in a connected user's org.
 */
export class ScopedPlatformClient {
    constructor(
        private readonly http: HttpClient,
        private readonly connectionId: string,
    ) {}

    /**
     * Generic scoped request — attaches the connection header automatically.
     * Use the specific resource helpers below for typed responses.
     */
    async request<T>(
        method: string,
        path: string,
        options?: { body?: unknown; query?: Record<string, string | number | undefined> },
    ): Promise<OneclawResponse<T>> {
        return this.http.request<T>(method, path, {
            ...options,
            headers: { "X-Platform-Connection": this.connectionId },
        });
    }

    // Convenience methods for common delegated operations

    get vaults() {
        const req = this.request.bind(this);
        return {
            create: (data: { name: string; description?: string }) =>
                req("POST", "/v1/vaults", { body: data }),
            list: () => req("GET", "/v1/vaults"),
        };
    }

    get agents() {
        const req = this.request.bind(this);
        return {
            create: (data: Record<string, unknown>) =>
                req("POST", "/v1/agents", { body: data }),
            list: () => req("GET", "/v1/agents"),
            update: (agentId: string, data: Record<string, unknown>) =>
                req("PATCH", `/v1/agents/${agentId}`, { body: data }),
        };
    }

    get automations() {
        const req = this.request.bind(this);
        return {
            create: (data: Record<string, unknown>) =>
                req("POST", "/v1/automations", { body: data }),
            list: () => req("GET", "/v1/automations"),
            delete: (id: string) => req("DELETE", `/v1/automations/${id}`),
        };
    }

    get runtimes() {
        const req = this.request.bind(this);
        return {
            create: (data: Record<string, unknown>) =>
                req("POST", "/v1/runtimes", { body: data }),
            list: () => req("GET", "/v1/runtimes"),
            start: (id: string) => req("POST", `/v1/runtimes/${id}/start`),
            stop: (id: string) => req("POST", `/v1/runtimes/${id}/stop`),
            delete: (id: string) => req("DELETE", `/v1/runtimes/${id}`),
        };
    }
}
