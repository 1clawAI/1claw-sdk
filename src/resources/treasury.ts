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
 *
 * For multi-chain wallet operations, see TreasuryWalletsResource.
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

    // ── Proposals (Multisig) ──────────────────────────────────────────

    async propose(
        treasuryId: string,
        body: {
            to: string;
            value_wei?: string;
            data?: string;
            operation?: number;
            safe_tx_hash: string;
            nonce: number;
        },
    ): Promise<OneclawResponse<ProposalResponse>> {
        return this.http.request<ProposalResponse>(
            "POST",
            `/v1/treasury/${treasuryId}/proposals`,
            { body },
        );
    }

    async listProposals(
        treasuryId: string,
        options?: { status?: string },
    ): Promise<OneclawResponse<ProposalListResponse>> {
        const qs = options?.status ? `?status=${options.status}` : "";
        return this.http.request<ProposalListResponse>(
            "GET",
            `/v1/treasury/${treasuryId}/proposals${qs}`,
        );
    }

    async getProposal(
        treasuryId: string,
        proposalId: string,
    ): Promise<OneclawResponse<ProposalResponse>> {
        return this.http.request<ProposalResponse>(
            "GET",
            `/v1/treasury/${treasuryId}/proposals/${proposalId}`,
        );
    }

    async signProposal(
        treasuryId: string,
        proposalId: string,
        body: { signature: string; signer_address: string; decision?: "approve" | "reject" },
    ): Promise<OneclawResponse<ProposalResponse>> {
        return this.http.request<ProposalResponse>(
            "POST",
            `/v1/treasury/${treasuryId}/proposals/${proposalId}/sign`,
            { body },
        );
    }

    async executeProposal(
        treasuryId: string,
        proposalId: string,
    ): Promise<OneclawResponse<ProposalResponse>> {
        return this.http.request<ProposalResponse>(
            "POST",
            `/v1/treasury/${treasuryId}/proposals/${proposalId}/execute`,
        );
    }
}

export interface ProposalResponse {
    id: string;
    treasury_id: string;
    proposed_by: string;
    proposed_by_type: string;
    chain: string;
    chain_id: number;
    safe_address: string;
    to_address: string;
    value_wei: string;
    data_hex: string;
    operation: number;
    safe_tx_hash: string;
    nonce: number;
    status: string;
    threshold: number;
    expires_at?: string;
    executed_tx_hash?: string;
    executed_at?: string;
    signatures: {
        id: string;
        signer_id: string;
        signer_type: string;
        signer_address: string;
        decision: string;
        created_at: string;
    }[];
    created_at: string;
}

export interface ProposalListResponse {
    proposals: ProposalResponse[];
}
