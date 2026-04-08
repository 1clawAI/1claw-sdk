import type { HttpClient } from "../core/http";
import type {
    CreateVaultRequest,
    EnableCmekRequest,
    EnableMpcRequest,
    CmekRotationJobResponse,
    VaultResponse,
    VaultListResponse,
    OneclawResponse,
} from "../types";

/**
 * Vault resource — create, list, get, and delete encrypted vaults.
 */
export class VaultResource {
    constructor(private readonly http: HttpClient) {}

    /** Create a new vault. Optionally pass `mpc_custody` to enable MPC at creation time. */
    async create(
        options: CreateVaultRequest,
    ): Promise<OneclawResponse<VaultResponse>> {
        const body: Record<string, unknown> = {
            name: options.name,
            description: options.description ?? "",
        };
        if ((options as Record<string, unknown>).mpc_custody) {
            body.mpc_custody = (options as Record<string, unknown>).mpc_custody;
        }
        return this.http.request<VaultResponse>("POST", "/v1/vaults", { body });
    }

    /** Fetch a single vault by ID. */
    async get(vaultId: string): Promise<OneclawResponse<VaultResponse>> {
        return this.http.request<VaultResponse>("GET", `/v1/vaults/${vaultId}`);
    }

    /** List all vaults visible to the authenticated identity. */
    async list(): Promise<OneclawResponse<VaultListResponse>> {
        return this.http.request<VaultListResponse>("GET", "/v1/vaults");
    }

    /** Permanently delete a vault and all its secrets. */
    async delete(vaultId: string): Promise<OneclawResponse<void>> {
        return this.http.request<void>("DELETE", `/v1/vaults/${vaultId}`);
    }

    /** Enable CMEK on a vault (Business/Enterprise only). */
    async enableCmek(
        vaultId: string,
        request: EnableCmekRequest,
    ): Promise<OneclawResponse<VaultResponse>> {
        return this.http.request<VaultResponse>(
            "POST",
            `/v1/vaults/${vaultId}/cmek`,
            { body: request },
        );
    }

    /** Disable CMEK on a vault. Secrets remain encrypted but no new CMEK layer is applied. */
    async disableCmek(
        vaultId: string,
    ): Promise<OneclawResponse<VaultResponse>> {
        return this.http.request<VaultResponse>(
            "DELETE",
            `/v1/vaults/${vaultId}/cmek`,
        );
    }

    /** Enable MPC on a vault (Business/Enterprise only). */
    async enableMpc(
        vaultId: string,
        request: EnableMpcRequest,
    ): Promise<OneclawResponse<VaultResponse>> {
        return this.http.request<VaultResponse>(
            "POST",
            `/v1/vaults/${vaultId}/mpc`,
            { body: request },
        );
    }

    /**
     * Start a server-assisted CMEK key rotation job.
     * Both keys are sent in headers (transit over TLS only) and are not logged.
     */
    async rotateCmek(
        vaultId: string,
        oldKeyBase64: string,
        newKeyBase64: string,
        newFingerprint: string,
    ): Promise<OneclawResponse<CmekRotationJobResponse>> {
        return this.http.request<CmekRotationJobResponse>(
            "POST",
            `/v1/vaults/${vaultId}/cmek-rotate`,
            {
                body: { new_fingerprint: newFingerprint },
                headers: {
                    "x-cmek-old-key": oldKeyBase64,
                    "x-cmek-new-key": newKeyBase64,
                },
            },
        );
    }

    /** Poll the status of a CMEK rotation job. */
    async getRotationJobStatus(
        vaultId: string,
        jobId: string,
    ): Promise<OneclawResponse<CmekRotationJobResponse>> {
        return this.http.request<CmekRotationJobResponse>(
            "GET",
            `/v1/vaults/${vaultId}/cmek-rotate/${jobId}`,
        );
    }
}
