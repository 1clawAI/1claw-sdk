import type { HttpClient } from "../core/http";
import type {
    CreateWebhookRequest,
    UpdateWebhookRequest,
    WebhookCreatedResponse,
    WebhookResponse,
    WebhookListResponse,
    OneclawResponse,
} from "../types";

/**
 * Webhooks resource — register HTTPS endpoints to receive vault event
 * notifications (secret access, approvals, card lifecycle, etc.).
 *
 * The signing `secret` is returned only once on {@link create}; store it
 * securely to verify HMAC signatures on inbound deliveries.
 */
export class WebhooksResource {
    constructor(private readonly http: HttpClient) {}

    /**
     * Register a webhook. Returns the HMAC signing secret once — it cannot
     * be retrieved again.
     */
    async create(
        body: CreateWebhookRequest,
    ): Promise<OneclawResponse<WebhookCreatedResponse>> {
        return this.http.request<WebhookCreatedResponse>(
            "POST",
            "/v1/webhooks",
            { body },
        );
    }

    /** List all webhooks for the current org. */
    async list(): Promise<OneclawResponse<WebhookListResponse>> {
        return this.http.request<WebhookListResponse>("GET", "/v1/webhooks");
    }

    /** Get a single webhook by ID. */
    async get(id: string): Promise<OneclawResponse<WebhookResponse>> {
        return this.http.request<WebhookResponse>("GET", `/v1/webhooks/${id}`);
    }

    /** Update a webhook's URL, events, description, or active flag. */
    async update(
        id: string,
        body: UpdateWebhookRequest,
    ): Promise<OneclawResponse<WebhookResponse>> {
        return this.http.request<WebhookResponse>(
            "PATCH",
            `/v1/webhooks/${id}`,
            { body },
        );
    }

    /** Delete a webhook. */
    async delete(id: string): Promise<OneclawResponse<void>> {
        return this.http.request<void>("DELETE", `/v1/webhooks/${id}`);
    }
}
