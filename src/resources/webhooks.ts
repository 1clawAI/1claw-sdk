import type { HttpClient } from "../core/http";
import type {
    CreateWebhookRequest,
    UpdateWebhookRequest,
    WebhookResponse,
    WebhookListResponse,
    OneclawResponse,
} from "../types";

/**
 * Webhooks resource — register and manage event notification webhooks.
 */
export class WebhooksResource {
    constructor(private readonly http: HttpClient) {}

    /** Register a new webhook. */
    async create(
        data: CreateWebhookRequest,
    ): Promise<OneclawResponse<WebhookResponse>> {
        return this.http.request<WebhookResponse>("POST", "/v1/webhooks", {
            body: data,
        });
    }

    /** List all webhooks for the org. */
    async list(): Promise<OneclawResponse<WebhookListResponse>> {
        return this.http.request<WebhookListResponse>("GET", "/v1/webhooks");
    }

    /** Get a single webhook. */
    async get(webhookId: string): Promise<OneclawResponse<WebhookResponse>> {
        return this.http.request<WebhookResponse>(
            "GET",
            `/v1/webhooks/${webhookId}`,
        );
    }

    /** Update a webhook. */
    async update(
        webhookId: string,
        data: UpdateWebhookRequest,
    ): Promise<OneclawResponse<WebhookResponse>> {
        return this.http.request<WebhookResponse>(
            "PATCH",
            `/v1/webhooks/${webhookId}`,
            { body: data },
        );
    }

    /** Delete a webhook. */
    async delete(webhookId: string): Promise<OneclawResponse<void>> {
        return this.http.request<void>(
            "DELETE",
            `/v1/webhooks/${webhookId}`,
        );
    }
}
