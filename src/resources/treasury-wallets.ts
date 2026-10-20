import type { HttpClient } from "../core/http";
import type { OneclawResponse, ImportKeyRequest } from "../types";

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
    native: NativeBalance;
    tokens: TokenBalance[];
}

export interface NativeBalance {
    symbol: string;
    /** Smallest unit (wei, lamports, sats, ...). */
    balance_wei: string;
    /** Major units, formatted for display. */
    balance_display: string;
}

export interface TokenBalance {
    contract_address: string;
    balance_raw: string;
}

export interface SendFromWalletRequest {
    to: string;
    /**
     * EVM: value in wei. Non-EVM: value in major units (e.g. "0.5" BTC).
     * The server also accepts `value` as an alias.
     */
    value_wei: string;
    /** Approved consensus approval id, sent when resubmitting a send that needed one. */
    approval_id?: string;
    /** EVM only: calldata hex. */
    data?: string;
    /** EVM only: gas limit override (decimal string). */
    gas_limit?: string;
    /** EVM only: sponsor gas through the ERC-4337 paymaster. */
    gasless?: boolean;
    /** ERC-20 contract, SPL mint, TRC-20 contract, or Cardano `policy_id.asset_name`. */
    token_mint?: string;
    token_decimals?: number;
    memo?: string;
    destination_tag?: number;
    fee_rate_sat_per_vbyte?: number;
    xrpl_tx_json?: Record<string, unknown>;
    fee_limit_sun?: number;
    ttl?: number;
}

export interface SendFromWalletResponse {
    tx_hash: string;
    from: string;
    to: string;
    value_wei: string;
    chain: string;
    status: string;
    user_op_hash?: string;
    /** Raw signed transaction (non-EVM only). */
    raw_tx?: string;
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

/** A wallet spend policy row, as the vault returns it. */
export interface WalletSpendPolicy {
    id: string;
    org_id: string;
    platform_app_id: string | null;
    user_id: string | null;
    to_allowlist: string[];
    to_denylist: string[];
    /** Decimal string. */
    max_value_per_tx_eth: string | null;
    /** Decimal string. */
    daily_limit_eth: string | null;
    allowed_chains: string[];
    allowed_tokens: string[];
    max_transactions_per_day: number | null;
    human_factor_auth: Record<string, unknown> | null;
    inference_allowance_usd: string | null;
    inference_reserved_pct: number | null;
    inference_hard_stop: boolean | null;
    inference_allowance_mode: string | null;
    max_request_cost_usd: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/** `GET /v1/treasury/wallets/spend-policy`: `policy` is null when none applies. */
export interface SpendPolicyResponse {
    policy: WalletSpendPolicy | null;
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
     * @param body - Send parameters (to, value_wei, optional token_mint)
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

    /** Get effective human factor auth policy for embedded wallet clients. */
    async getAuthPolicy(): Promise<
        OneclawResponse<{
            policy: Record<string, unknown>;
            source: string;
            registered_passkeys: number;
        }>
    > {
        return this.http.request("GET", "/v1/treasury/wallets/auth-policy");
    }

    /** Get remaining LLM inference allowance for platform-connected users. */
    async getInferenceBudget(): Promise<
        OneclawResponse<Record<string, unknown>>
    > {
        return this.http.request(
            "GET",
            "/v1/treasury/wallets/inference-budget",
        );
    }

    /** Import an existing private key as a treasury wallet. Requires re-authentication via password. */
    async importWallet(
        chain: string,
        body: ImportKeyRequest,
        password: string,
    ): Promise<OneclawResponse<TreasuryWalletResponse>> {
        return this.http.request<TreasuryWalletResponse>(
            "POST",
            `/v1/treasury/wallets/${chain}/import`,
            { body, headers: { "X-Auth-Confirm": password } },
        );
    }
}
