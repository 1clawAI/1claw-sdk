import type { HttpClient } from "../core/http";
import type {
    CreateSigningKeyRequest,
    SigningKeyResponse,
    SigningKeyListResponse,
    OneclawResponse,
} from "../types";

/**
 * Signing keys resource — create, list, rotate, and deactivate
 * per-agent multi-chain signing keys.
 */
export class SigningKeysResource {
    constructor(private readonly http: HttpClient) {}

    /**
     * Create a new signing key for the given chain.
     * The key's curve and derivation are determined by the chain
     * (e.g. secp256k1 for EVM, ed25519 for Solana).
     */
    async create(
        agentId: string,
        params: CreateSigningKeyRequest,
    ): Promise<OneclawResponse<SigningKeyResponse>> {
        return this.http.request<SigningKeyResponse>(
            "POST",
            `/v1/agents/${agentId}/signing-keys`,
            { body: params },
        );
    }

    /** List all signing keys for an agent. */
    async list(
        agentId: string,
    ): Promise<OneclawResponse<SigningKeyListResponse>> {
        return this.http.request<SigningKeyListResponse>(
            "GET",
            `/v1/agents/${agentId}/signing-keys`,
        );
    }

    /**
     * Rotate the signing key for a specific chain.
     * Creates a new key version and deactivates the previous one.
     */
    async rotate(
        agentId: string,
        chain: string,
    ): Promise<OneclawResponse<SigningKeyResponse>> {
        return this.http.request<SigningKeyResponse>(
            "POST",
            `/v1/agents/${agentId}/signing-keys/${encodeURIComponent(chain)}/rotate`,
        );
    }

    /** Deactivate the signing key for a specific chain. */
    async deactivate(
        agentId: string,
        chain: string,
    ): Promise<OneclawResponse<void>> {
        return this.http.request<void>(
            "DELETE",
            `/v1/agents/${agentId}/signing-keys/${encodeURIComponent(chain)}`,
        );
    }
}
