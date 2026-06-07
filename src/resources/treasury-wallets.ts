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

export interface TreasuryWalletBalanceResponse {
    chain: string;
    address: string;
    native_balance: string;
    native_symbol: string;
    tokens?: TokenBalance[];
}

export interface TokenBalance {
    contract: string;
    symbol: string;
    balance: string;
    decimals: number;
}

export interface SendFromWalletRequest {
    to: string;
    amount: string;
    token_contract?: string;
    gasless?: boolean;
}

export interface SendFromWalletResponse {
    tx_hash: string;
    from: string;
    to: string;
    amount: string;
    chain: string;
    status: string;
    user_op_hash?: string;
}

export interface SwapFromWalletRequest {
    sell_token: string;
    buy_token: string;
    sell_amount: string;
    slippage_percentage?: string;
}

export interface SwapFromWalletResponse {
    tx_hash: string;
    sell_token: string;
    buy_token: string;
    sell_amount: string;
    buy_amount: string;
    chain: string;
}

export interface SpendPolicyResponse {
    to_allowlist?: string[];
    to_denylist?: string[];
    max_value_per_tx_eth?: string;
    daily_limit_eth?: string;
    allowed_chains?: string[];
    allowed_tokens?: string[];
    max_transactions_per_day?: number;
    source: string;
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

    /**
     * Export wallet private key. Requires re-authentication via password.
     * @param chain - Chain name (e.g. "ethereum", "solana")
     * @param password - Account password for re-authentication
     */
    async exportWallet(
        chain: string,
        password: string,
    ): Promise<OneclawResponse<TreasuryWalletExportResponse>> {
        return this.http.request<TreasuryWalletExportResponse>(
            "POST",
            `/v1/treasury/wallets/${chain}/export`,
            { headers: { "X-Auth-Confirm": password } },
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

    async getWalletBalance(
        chain: string,
        tokens?: string[],
    ): Promise<OneclawResponse<TreasuryWalletBalanceResponse>> {
        const params = tokens?.length
            ? `?${tokens.map((t) => `tokens=${encodeURIComponent(t)}`).join("&")}`
            : "";
        return this.http.request<TreasuryWalletBalanceResponse>(
            "GET",
            `/v1/treasury/wallets/${chain}/balance${params}`,
        );
    }

    /**
     * Send native currency or ERC-20 tokens. Requires re-authentication.
     * @param chain - Chain name (e.g. "ethereum")
     * @param body - Send parameters (to, amount, optional token_contract)
     * @param password - Account password for re-authentication
     */
    async sendFromWallet(
        chain: string,
        body: SendFromWalletRequest,
        password: string,
    ): Promise<OneclawResponse<SendFromWalletResponse>> {
        return this.http.request<SendFromWalletResponse>(
            "POST",
            `/v1/treasury/wallets/${chain}/send`,
            { body, headers: { "X-Auth-Confirm": password } },
        );
    }

    /**
     * Swap tokens via DEX aggregator. Requires re-authentication.
     * @param chain - Chain name (e.g. "ethereum")
     * @param body - Swap parameters (sell_token, buy_token, sell_amount)
     * @param password - Account password for re-authentication
     */
    async swapFromWallet(
        chain: string,
        body: SwapFromWalletRequest,
        password: string,
    ): Promise<OneclawResponse<SwapFromWalletResponse>> {
        return this.http.request<SwapFromWalletResponse>(
            "POST",
            `/v1/treasury/wallets/${chain}/swap`,
            { body, headers: { "X-Auth-Confirm": password } },
        );
    }

    /** Get the effective spend policy for the current user's wallets. */
    async getEffectiveSpendPolicy(): Promise<OneclawResponse<SpendPolicyResponse>> {
        return this.http.request<SpendPolicyResponse>(
            "GET",
            "/v1/treasury/wallets/spend-policy",
        );
    }
}
