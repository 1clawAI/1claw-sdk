import type { HttpClient } from "../core/http";
import type { OneclawResponse } from "../types";

export interface CreateDepositDestinationRequest {
    chain: string;
    label?: string;
    metadata?: Record<string, unknown>;
    treasury_wallet_id?: string;
    auto_credit_account_id?: string;
}

export interface DepositDestinationResponse {
    id: string;
    org_id: string;
    user_id: string;
    treasury_wallet_id?: string;
    chain: string;
    address: string;
    label?: string;
    metadata?: Record<string, unknown>;
    status: string;
    auto_credit_account_id?: string;
    created_at: string;
}

export interface DepositEventResponse {
    id: string;
    destination_id: string;
    tx_hash: string;
    from_address: string;
    amount: string;
    token_address?: string;
    token_symbol?: string;
    chain: string;
    block_number?: number;
    confirmations: number;
    status: string;
    confirmed_at?: string;
    credited_at?: string;
    created_at: string;
}

export interface DepositDestinationDetailResponse {
    destination: DepositDestinationResponse;
    events: DepositEventResponse[];
}

export class DepositDestinationsResource {
    constructor(private readonly http: HttpClient) {}

    async create(
        body: CreateDepositDestinationRequest,
    ): Promise<OneclawResponse<DepositDestinationResponse>> {
        return this.http.request<DepositDestinationResponse>(
            "POST",
            "/v1/deposit-destinations",
            { body },
        );
    }

    async list(
        chain?: string,
        status?: string,
    ): Promise<OneclawResponse<{ destinations: DepositDestinationResponse[] }>> {
        const params = new URLSearchParams();
        if (chain) params.set("chain", chain);
        if (status) params.set("status", status);
        const qs = params.toString();
        return this.http.request<{ destinations: DepositDestinationResponse[] }>(
            "GET",
            `/v1/deposit-destinations${qs ? `?${qs}` : ""}`,
        );
    }

    async get(id: string): Promise<OneclawResponse<DepositDestinationDetailResponse>> {
        return this.http.request<DepositDestinationDetailResponse>(
            "GET",
            `/v1/deposit-destinations/${id}`,
        );
    }

    async update(
        id: string,
        status: string,
    ): Promise<OneclawResponse<DepositDestinationResponse>> {
        return this.http.request<DepositDestinationResponse>(
            "PATCH",
            `/v1/deposit-destinations/${id}`,
            { body: { status } },
        );
    }
}
