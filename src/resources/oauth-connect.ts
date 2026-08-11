import type { HttpClient } from "../core/http";
import type {
    OAuthProviderListResponse,
    OAuthConnectionListResponse,
    ConnectOAuthRequest,
    ConnectOAuthResponse,
    OAuthAppCredentialListResponse,
    OAuthAppCredentialResponse,
    SaveOAuthAppCredentialsRequest,
    OneclawResponse,
} from "../types";

/**
 * OAuth Connected Accounts — manage OAuth connections for AI agents.
 * Lets agents access external services (Google, GitHub, Slack, etc.)
 * via human-approved OAuth flows.
 */
export class OAuthConnectResource {
    constructor(private readonly http: HttpClient) {}

    /**
     * List all available OAuth providers from the registry.
     * Public endpoint — no authentication required.
     */
    async listProviders(): Promise<OneclawResponse<OAuthProviderListResponse>> {
        return this.http.request<OAuthProviderListResponse>(
            "GET",
            "/v1/oauth/providers",
        );
    }

    /**
     * List connected OAuth accounts for a specific agent.
     */
    async listConnections(
        agentId: string,
    ): Promise<OneclawResponse<OAuthConnectionListResponse>> {
        return this.http.request<OAuthConnectionListResponse>(
            "GET",
            `/v1/agents/${agentId}/oauth/connections`,
        );
    }

    /**
     * Initiate an OAuth connection flow for an agent.
     * Returns an authorization URL to redirect the user to.
     * Human-only — agents cannot initiate their own OAuth flows.
     */
    async connect(
        agentId: string,
        options: ConnectOAuthRequest,
    ): Promise<OneclawResponse<ConnectOAuthResponse>> {
        return this.http.request<ConnectOAuthResponse>(
            "POST",
            `/v1/agents/${agentId}/oauth/connect`,
            { body: options },
        );
    }

    /**
     * Disconnect an OAuth account from an agent.
     * Revokes tokens and removes the binding.
     * Human-only.
     */
    async disconnect(
        agentId: string,
        bindingId: string,
    ): Promise<OneclawResponse<void>> {
        return this.http.request<void>(
            "POST",
            `/v1/agents/${agentId}/oauth/disconnect/${bindingId}`,
        );
    }

    /**
     * Save OAuth app credentials (client ID/secret) for a provider.
     * Per-org — each organization registers their own OAuth app.
     * Human-only. Client secrets are encrypted at rest.
     */
    async saveAppCredentials(
        agentId: string,
        options: SaveOAuthAppCredentialsRequest,
    ): Promise<OneclawResponse<OAuthAppCredentialResponse>> {
        return this.http.request<OAuthAppCredentialResponse>(
            "POST",
            `/v1/agents/${agentId}/oauth/app-credentials`,
            { body: options },
        );
    }

    /**
     * List app credentials for the calling org (secrets redacted).
     */
    async listAppCredentials(
        agentId: string,
    ): Promise<OneclawResponse<OAuthAppCredentialListResponse>> {
        return this.http.request<OAuthAppCredentialListResponse>(
            "GET",
            `/v1/agents/${agentId}/oauth/app-credentials`,
        );
    }

    /**
     * Delete app credentials for a provider.
     */
    async deleteAppCredentials(
        agentId: string,
        providerSlug: string,
    ): Promise<OneclawResponse<void>> {
        return this.http.request<void>(
            "DELETE",
            `/v1/agents/${agentId}/oauth/app-credentials/${providerSlug}`,
        );
    }
}
