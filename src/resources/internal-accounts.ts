import type { HttpClient } from "../core/http";
import type { OneclawResponse } from "../types";

export interface CreateInternalAccountRequest {
    name: string;
    description?: string;
    treasury_wallet_id?: string;
}

export interface InternalAccountResponse {
    id: string;
    org_id: string;
    user_id: string;
    treasury_wallet_id?: string;
    name: string;
    description?: string;
    status: string;
    balances: { asset: string; balance: string }[];
    created_at: string;
}

export interface CreateTransferRequest {
    from_account_id: string;
    to_account_id: string;
    asset: string;
    amount: string;
    memo?: string;
}

export interface InternalTransferResponse {
    id: string;
    org_id: string;
    from_account_id: string;
    to_account_id: string;
    asset: string;
    amount: string;
    memo?: string;
    initiated_by: string;
    status: string;
    created_at: string;
}

export interface LedgerEntryResponse {
    id: string;
    account_id: string;
    counterpart_account_id: string;
    asset: string;
    amount: string;
    direction: "credit" | "debit";
    reference_type: string;
    reference_id: string;
    memo?: string;
    created_at: string;
}

export class InternalAccountsResource {
    constructor(private readonly http: HttpClient) {}

    async create(
        body: CreateInternalAccountRequest,
    ): Promise<OneclawResponse<InternalAccountResponse>> {
        return this.http.request<InternalAccountResponse>(
            "POST",
            "/v1/internal-accounts",
            { body },
        );
    }

    async list(): Promise<OneclawResponse<{ accounts: InternalAccountResponse[] }>> {
        return this.http.request<{ accounts: InternalAccountResponse[] }>(
            "GET",
            "/v1/internal-accounts",
        );
    }

    async get(id: string): Promise<OneclawResponse<InternalAccountResponse>> {
        return this.http.request<InternalAccountResponse>(
            "GET",
            `/v1/internal-accounts/${id}`,
        );
    }

    async transfer(
        body: CreateTransferRequest,
    ): Promise<OneclawResponse<InternalTransferResponse>> {
        return this.http.request<InternalTransferResponse>(
            "POST",
            "/v1/internal-transfers",
            { body },
        );
    }

    async getLedger(
        id: string,
        limit = 50,
        offset = 0,
    ): Promise<OneclawResponse<{ entries: LedgerEntryResponse[]; total: number }>> {
        return this.http.request<{ entries: LedgerEntryResponse[]; total: number }>(
            "GET",
            `/v1/internal-accounts/${id}/ledger?limit=${limit}&offset=${offset}`,
        );
    }
}
