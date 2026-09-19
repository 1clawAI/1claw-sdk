import type { HttpClient } from "../core/http";
import type {
    ConnectorPresetListResponse,
    CreateEventSubscriptionRequest,
    EventSubscription,
    EventSubscriptionListResponse,
    InstalledConnectorListResponse,
    InstallConnectorRequest,
    InstallConnectorResponse,
    OneclawResponse,
    PollEventSubscriptionResponse,
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

    // ── Polled event sources → automation events (vault ≥ 0.61.32) ──

    /**
     * Subscribe an installed connector binding to one of its preset's event
     * sources (`event_sources` on `listPresets()`). 1Claw polls the source
     * through the binding and dispatches each new item as an automation event
     * of `event_type`. Human-only; the first poll primes and emits nothing.
     */
    async subscribe(
        agentId: string,
        body: CreateEventSubscriptionRequest,
    ): Promise<OneclawResponse<EventSubscription>> {
        return this.http.request<EventSubscription>(
            "POST",
            `/v1/agents/${agentId}/event-subscriptions`,
            { body },
        );
    }

    /** An agent's event subscriptions. */
    async listSubscriptions(
        agentId: string,
    ): Promise<OneclawResponse<EventSubscriptionListResponse>> {
        return this.http.request<EventSubscriptionListResponse>(
            "GET",
            `/v1/agents/${agentId}/event-subscriptions`,
        );
    }

    /** Delete an event subscription. Human-only. */
    async unsubscribe(
        agentId: string,
        subscriptionId: string,
    ): Promise<OneclawResponse<void>> {
        return this.http.request<void>(
            "DELETE",
            `/v1/agents/${agentId}/event-subscriptions/${subscriptionId}`,
        );
    }

    /** Poll a subscription now instead of waiting for its interval. Human-only. */
    async pollNow(
        agentId: string,
        subscriptionId: string,
    ): Promise<OneclawResponse<PollEventSubscriptionResponse>> {
        return this.http.request<PollEventSubscriptionResponse>(
            "POST",
            `/v1/agents/${agentId}/event-subscriptions/${subscriptionId}/poll`,
        );
    }
}
