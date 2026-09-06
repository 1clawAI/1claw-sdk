import type { HttpClient } from "../core/http";
import type {
    NotificationTarget,
    NotificationTargetListResponse,
    CreateNotificationTargetRequest,
    OneclawResponse,
} from "../types";

/**
 * Where approvals and automation output reach a human — a phone number, an
 * https webhook, an email address, or a push token.
 *
 * An SMS target is created **unverified** and stays that way until someone
 * proves they hold the number. Adding a number is not itself an authorisation.
 * An unverified target still receives notifications; it just cannot reply to
 * decide an approval.
 */
export class NotificationTargetsResource {
    constructor(private readonly http: HttpClient) {}

    async list(): Promise<OneclawResponse<NotificationTargetListResponse>> {
        return this.http.request<NotificationTargetListResponse>(
            "GET",
            "/v1/notification-targets",
        );
    }

    async create(
        body: CreateNotificationTargetRequest,
    ): Promise<OneclawResponse<NotificationTarget>> {
        return this.http.request<NotificationTarget>(
            "POST",
            "/v1/notification-targets",
            { body },
        );
    }

    async delete(id: string): Promise<OneclawResponse<void>> {
        return this.http.request<void>(
            "DELETE",
            `/v1/notification-targets/${id}`,
        );
    }

    /**
     * Text a six-digit code to an SMS target. Expires in 10 minutes; five wrong
     * answers void it.
     */
    async startVerification(
        id: string,
    ): Promise<OneclawResponse<{ message: string; expires_in_seconds: number }>> {
        return this.http.request<{ message: string; expires_in_seconds: number }>(
            "POST",
            `/v1/notification-targets/${id}/verify/start`,
            { body: {} },
        );
    }

    async verify(
        id: string,
        code: string,
    ): Promise<OneclawResponse<{ verified: boolean }>> {
        return this.http.request<{ verified: boolean }>(
            "POST",
            `/v1/notification-targets/${id}/verify`,
            { body: { code } },
        );
    }
}
