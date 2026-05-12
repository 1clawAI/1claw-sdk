import type { HttpClient } from "../core/http";
import type {
    CreateSigningKeyRequest,
    SigningKeyResponse,
    SigningKeyListResponse,
    OneclawResponse,
} from "../types";

/**
 * Multi-chain signing keys — provision, list, rotate, and deactivate
 * per-agent signing keys. Keys are generated server-side; the private
 * key never leaves the HSM.
 */
export class SigningKeysResource {
    constructor(private readonly http: HttpClient) {}

    async create(
        agentId: string,
        body: CreateSigningKeyRequest,
    ): Promise<OneclawResponse<SigningKeyResponse>> {
        return this.http.request<SigningKeyResponse>(
            "POST",
            `/v1/agents/${agentId}/signing-keys`,
            { body },
        );
    }

    async list(
        agentId: string,
    ): Promise<OneclawResponse<SigningKeyListResponse>> {
        return this.http.request<SigningKeyListResponse>(
            "GET",
            `/v1/agents/${agentId}/signing-keys`,
        );
    }

    async rotate(
        agentId: string,
        chain: string,
    ): Promise<OneclawResponse<SigningKeyResponse>> {
        return this.http.request<SigningKeyResponse>(
            "POST",
            `/v1/agents/${agentId}/signing-keys/${chain}/rotate`,
        );
    }

    async deactivate(
        agentId: string,
        chain: string,
    ): Promise<OneclawResponse<void>> {
        return this.http.request<void>(
            "DELETE",
            `/v1/agents/${agentId}/signing-keys/${chain}`,
        );
    }
}
