import type { HttpClient } from "../core/http";
import type {
    ConnectorPresetListResponse,
    InstalledConnectorListResponse,
    InstallConnectorRequest,
    InstallConnectorResponse,
    OneclawResponse,
} from "../types";

/**
 * Pre-built connectors — Gmail, Slack, GitHub and the rest.
 *
 * Installing one creates a binding with the preset's base URL and host/path
 * guardrails and starts the OAuth flow for it, instead of the four hand-rolled
 * steps it replaces.
 */
export class ConnectorsResource {
    constructor(private readonly http: HttpClient) {}

    /**
     * The connector catalogue. Public — no authentication required.
     */
    async listPresets(): Promise<OneclawResponse<ConnectorPresetListResponse>> {
        return this.http.request<ConnectorPresetListResponse>(
            "GET",
            "/v1/connectors/presets",
        );
    }

    /**
     * Connectors installed on an agent, and whether each is actually connected —
     * an install creates the binding, but it holds no credential until the user
     * completes the OAuth round trip.
     */
    async list(
        agentId: string,
    ): Promise<OneclawResponse<InstalledConnectorListResponse>> {
        return this.http.request<InstalledConnectorListResponse>(
            "GET",
            `/v1/agents/${agentId}/connectors`,
        );
    }

    /**
     * Install a connector onto an agent.
     *
     * Human users only. Send the user to the returned `authorization_url` to
     * finish; the binding is not usable until they do.
     *
     * `scopes` may narrow the preset's list but never extend it.
     */
    async install(
        agentId: string,
        slug: string,
        body: InstallConnectorRequest = {},
    ): Promise<OneclawResponse<InstallConnectorResponse>> {
        return this.http.request<InstallConnectorResponse>(
            "POST",
            `/v1/agents/${agentId}/connectors/${slug}/install`,
            { body },
        );
    }
}
