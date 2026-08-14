import type { HttpClient } from "../core/http";
import type {
    CreateContractAbiRequest,
    ContractAbiResponse,
    ContractAbiListResponse,
    OneclawResponse,
} from "../types";

export class ContractAbisResource {
    constructor(private readonly http: HttpClient) {}

    async create(body: CreateContractAbiRequest): Promise<OneclawResponse<ContractAbiResponse>> {
        return this.http.request<ContractAbiResponse>("POST", "/v1/org/contract-abis", { body });
    }

    async list(chain?: string): Promise<OneclawResponse<ContractAbiListResponse>> {
        const query = chain ? `?chain=${encodeURIComponent(chain)}` : "";
        return this.http.request<ContractAbiListResponse>("GET", `/v1/org/contract-abis${query}`);
    }

    async get(id: string): Promise<OneclawResponse<ContractAbiResponse>> {
        return this.http.request<ContractAbiResponse>("GET", `/v1/org/contract-abis/${id}`);
    }

    async delete(id: string): Promise<OneclawResponse<void>> {
        return this.http.request<void>("DELETE", `/v1/org/contract-abis/${id}`);
    }
}
