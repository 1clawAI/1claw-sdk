import type { HttpClient } from "../core/http";
import type { ApiSchemas, OneclawResponse } from "../types";

type TreasuryResponse = ApiSchemas["TreasuryResponse"];
type CreateTreasuryRequest = ApiSchemas["CreateTreasuryRequest"];
type UpdateTreasuryRequest = ApiSchemas["UpdateTreasuryRequest"];
type AddSignerRequest = ApiSchemas["AddSignerRequest"];
type AccessRequestResponse = ApiSchemas["AccessRequestResponse"];
type TreasurySignerResponse = ApiSchemas["TreasurySignerResponse"];

export interface TreasuryListResponse {
    treasuries: TreasuryResponse[];
}

export interface AccessRequestListResponse {
    requests: AccessRequestResponse[];
}

/**
 * Treasury (Safe multisig) management — create, update, delete treasuries;
 * signers; agent access requests (approve/deny).
 */
export class TreasuryResource {
    constructor(private readonly http: HttpClient) {}

    async create(
        body: CreateTreasuryRequest,
    ): Promise<OneclawResponse<TreasuryResponse>> {
        return this.http.request<TreasuryResponse>("POST", "/v1/treasury", {
            body,
        });
    }

    async list(): Promise<OneclawResponse<TreasuryListResponse>> {
        return this.http.request<TreasuryListResponse>("GET", "/v1/treasury");
    }

    async get(
        treasuryId: string,
    ): Promise<OneclawResponse<TreasuryResponse>> {
        return this.http.request<TreasuryResponse>(
            "GET",
            `/v1/treasury/${treasuryId}`,
        );
    }

    async update(
        treasuryId: string,
        body: UpdateTreasuryRequest,
    ): Promise<OneclawResponse<TreasuryResponse>> {
        return this.http.request<TreasuryResponse>(
            "PATCH",
            `/v1/treasury/${treasuryId}`,
            { body },
        );
    }

    async delete(treasuryId: string): Promise<OneclawResponse<void>> {
        return this.http.request<void>(
            "DELETE",
            `/v1/treasury/${treasuryId}`,
        );
    }

    async addSigner(
        treasuryId: string,
        body: AddSignerRequest,
    ): Promise<OneclawResponse<TreasurySignerResponse>> {
        return this.http.request<TreasurySignerResponse>(
            "POST",
            `/v1/treasury/${treasuryId}/signers`,
            { body },
        );
    }

    async removeSigner(
        treasuryId: string,
        signerId: string,
    ): Promise<OneclawResponse<void>> {
        return this.http.request<void>(
            "DELETE",
            `/v1/treasury/${treasuryId}/signers/${signerId}`,
        );
    }

    async requestAccess(
        treasuryId: string,
        body: { reason?: string } = {},
    ): Promise<OneclawResponse<AccessRequestResponse>> {
        return this.http.request<AccessRequestResponse>(
            "POST",
            `/v1/treasury/${treasuryId}/access-requests`,
            { body },
        );
    }

    async listAccessRequests(
        treasuryId: string,
    ): Promise<OneclawResponse<AccessRequestListResponse>> {
        return this.http.request<AccessRequestListResponse>(
            "GET",
            `/v1/treasury/${treasuryId}/access-requests`,
        );
    }

    async approveAccess(
        treasuryId: string,
        requestId: string,
    ): Promise<OneclawResponse<AccessRequestResponse>> {
        return this.http.request<AccessRequestResponse>(
            "POST",
            `/v1/treasury/${treasuryId}/access-requests/${requestId}/approve`,
        );
    }

    async denyAccess(
        treasuryId: string,
        requestId: string,
    ): Promise<OneclawResponse<AccessRequestResponse>> {
        return this.http.request<AccessRequestResponse>(
            "POST",
            `/v1/treasury/${treasuryId}/access-requests/${requestId}/deny`,
        );
    }
}
