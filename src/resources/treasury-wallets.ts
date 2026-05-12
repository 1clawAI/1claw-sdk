import type { HttpClient } from "../core/http";
import type { OneclawResponse } from "../types";

export interface GenerateTreasuryWalletsRequest {
    chains?: string[];
}

export interface TreasuryWalletResponse {
    id: string;
    chain: string;
    curve: string;
    public_key_hex: string;
    address: string;
    is_active: boolean;
    created_at: string;
}

export interface TreasuryWalletListResponse {
    wallets: TreasuryWalletResponse[];
}

export interface TreasuryWalletExportResponse {
    chain: string;
    address: string;
    private_key_hex: string;
}

/**
 * Treasury wallets — multi-chain wallet generation for human users.
 * Replaces CDP embedded wallets. Private keys are stored in a per-org
 * `__treasury-keys` vault with tier-appropriate MPC custody.
 *
 * Human users only — agents receive 403.
 */
export class TreasuryWalletsResource {
    constructor(private readonly http: HttpClient) {}

    async generateWallets(
        body: GenerateTreasuryWalletsRequest = {},
    ): Promise<OneclawResponse<TreasuryWalletListResponse>> {
        return this.http.request<TreasuryWalletListResponse>(
            "POST",
            "/v1/treasury/wallets/generate",
            { body },
        );
    }

    async listWallets(): Promise<OneclawResponse<TreasuryWalletListResponse>> {
        return this.http.request<TreasuryWalletListResponse>(
            "GET",
            "/v1/treasury/wallets",
        );
    }

    async getWallet(
        chain: string,
    ): Promise<OneclawResponse<TreasuryWalletResponse>> {
        return this.http.request<TreasuryWalletResponse>(
            "GET",
            `/v1/treasury/wallets/${chain}`,
        );
    }

    async exportWallet(
        chain: string,
    ): Promise<OneclawResponse<TreasuryWalletExportResponse>> {
        return this.http.request<TreasuryWalletExportResponse>(
            "POST",
            `/v1/treasury/wallets/${chain}/export`,
        );
    }

    async rotateWallet(
        chain: string,
    ): Promise<OneclawResponse<TreasuryWalletResponse>> {
        return this.http.request<TreasuryWalletResponse>(
            "POST",
            `/v1/treasury/wallets/${chain}/rotate`,
        );
    }

    async deactivateWallet(chain: string): Promise<OneclawResponse<void>> {
        return this.http.request<void>(
            "DELETE",
            `/v1/treasury/wallets/${chain}`,
        );
    }
}
