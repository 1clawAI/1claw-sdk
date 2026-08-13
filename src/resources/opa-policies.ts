import type { HttpClient } from "../core/http";
import type {
    CreateOpaPolicyRequest,
    OpaPolicyResponse,
    OpaPolicyListResponse,
    OpaPolicyTestRequest,
    OpaPolicyTestResponse,
    OneclawResponse,
} from "../types";

export class OpaPoliciesResource {
    constructor(private readonly http: HttpClient) {}

    async create(body: CreateOpaPolicyRequest): Promise<OneclawResponse<OpaPolicyResponse>> {
        return this.http.request<OpaPolicyResponse>("POST", "/v1/org/opa-policies", { body });
    }

    async list(): Promise<OneclawResponse<OpaPolicyListResponse>> {
        return this.http.request<OpaPolicyListResponse>("GET", "/v1/org/opa-policies");
    }

    async get(policyId: string): Promise<OneclawResponse<OpaPolicyResponse>> {
        return this.http.request<OpaPolicyResponse>("GET", `/v1/org/opa-policies/${policyId}`);
    }

    async delete(policyId: string): Promise<OneclawResponse<void>> {
        return this.http.request<void>("DELETE", `/v1/org/opa-policies/${policyId}`);
    }

    async test(body: OpaPolicyTestRequest): Promise<OneclawResponse<OpaPolicyTestResponse>> {
        return this.http.request<OpaPolicyTestResponse>("POST", "/v1/org/opa-policies/test", { body });
    }
}
