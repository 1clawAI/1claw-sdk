import type { HttpClient } from "../core/http";
import type {
    CreateSubOrgRequest,
    SubOrgResponse,
    SubOrgListResponse,
    SubOrgPermissionRequest,
    SubOrgAddUserRequest,
    SubOrgGenerateWalletsRequest,
    OneclawResponse,
} from "../types";

export class SubOrgsResource {
    constructor(private readonly http: HttpClient) {}

    async create(body: CreateSubOrgRequest): Promise<OneclawResponse<SubOrgResponse>> {
        return this.http.request<SubOrgResponse>("POST", "/v1/org/sub-orgs", { body });
    }

    async list(): Promise<OneclawResponse<SubOrgListResponse>> {
        return this.http.request<SubOrgListResponse>("GET", "/v1/org/sub-orgs");
    }

    async get(subOrgId: string): Promise<OneclawResponse<SubOrgResponse>> {
        return this.http.request<SubOrgResponse>("GET", `/v1/org/sub-orgs/${subOrgId}`);
    }

    async archive(subOrgId: string): Promise<OneclawResponse<void>> {
        return this.http.request<void>("DELETE", `/v1/org/sub-orgs/${subOrgId}`);
    }

    async grantPermission(subOrgId: string, body: SubOrgPermissionRequest): Promise<OneclawResponse<void>> {
        return this.http.request<void>("POST", `/v1/org/sub-orgs/${subOrgId}/permissions`, { body });
    }

    async revokePermission(subOrgId: string, permissionId: string): Promise<OneclawResponse<void>> {
        return this.http.request<void>("DELETE", `/v1/org/sub-orgs/${subOrgId}/permissions/${permissionId}`);
    }

    async addUser(subOrgId: string, body: SubOrgAddUserRequest): Promise<OneclawResponse<void>> {
        return this.http.request<void>("POST", `/v1/org/sub-orgs/${subOrgId}/users`, { body });
    }

    async generateWallets(subOrgId: string, body?: SubOrgGenerateWalletsRequest): Promise<OneclawResponse<unknown>> {
        return this.http.request("POST", `/v1/org/sub-orgs/${subOrgId}/wallets/generate`, { body });
    }
}
