import type { HttpClient } from "./http";
import type {
  CreateShareRequest,
  ShareResponse,
  SecretResponse,
  OneclawResponse,
} from "./types";

/**
 * Sharing resource — create time-limited, access-controlled share links
 * for individual secrets.
 *
 * Note: the sharing endpoints are defined in the API but not yet fully
 * implemented server-side. These methods are provided for forward
 * compatibility and will work once the backend is complete.
 */
export class SharingResource {
  constructor(private readonly http: HttpClient) {}

  /** Create a shareable link for a secret. */
  async create(
    secretId: string,
    options: CreateShareRequest,
  ): Promise<OneclawResponse<ShareResponse>> {
    return this.http.request<ShareResponse>(
      "POST",
      `/v1/secrets/${secretId}/share`,
      { body: options },
    );
  }

  /** Access a shared secret using its share ID. */
  async access(shareId: string): Promise<OneclawResponse<SecretResponse>> {
    return this.http.request<SecretResponse>("GET", `/v1/share/${shareId}`);
  }

  /** Revoke an active share link. */
  async revoke(shareId: string): Promise<OneclawResponse<void>> {
    return this.http.request<void>("DELETE", `/v1/share/${shareId}`);
  }
}
