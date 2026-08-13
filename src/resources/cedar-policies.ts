import type { HttpClient } from "../core/http";
import type {
    CreateCedarPolicyRequest,
    CedarPolicyResponse,
    CedarPolicyListResponse,
    CedarPolicyTestRequest,
    CedarPolicyTestResponse,
    OneclawResponse,
} from "../types";

export class CedarPoliciesResource {
    constructor(private readonly http: HttpClient) {}

    async create(body: CreateCedarPolicyRequest): Promise<OneclawResponse<CedarPolicyResponse>> {
        return this.http.request<CedarPolicyResponse>("POST", "/v1/org/cedar-policies", { body });
    }

    async list(): Promise<OneclawResponse<CedarPolicyListResponse>> {
        return this.http.request<CedarPolicyListResponse>("GET", "/v1/org/cedar-policies");
    }

    async get(policyId: string): Promise<OneclawResponse<CedarPolicyResponse>> {
        return this.http.request<CedarPolicyResponse>("GET", `/v1/org/cedar-policies/${policyId}`);
    }

    async delete(policyId: string): Promise<OneclawResponse<void>> {
        return this.http.request<void>("DELETE", `/v1/org/cedar-policies/${policyId}`);
    }

    async test(body: CedarPolicyTestRequest): Promise<OneclawResponse<CedarPolicyTestResponse>> {
        return this.http.request<CedarPolicyTestResponse>("POST", "/v1/org/cedar-policies/test", { body });
    }
}
