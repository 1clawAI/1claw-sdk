import type { HttpClient } from "../core/http";
import type {
    CreateBindingRequest,
    UpdateBindingRequest,
    RotateCredentialRequest,
    BindingResponse,
    BindingListResponse,
    ExecuteRequest,
    ExecuteResponse,
    ExecutionEventListResponse,
    TestBindingRequest,
    TestBindingResponse,
    OneclawResponse,
} from "../types";

export class BindingsResource {
    constructor(private readonly http: HttpClient) {}

    async create(
        agentId: string,
        options: CreateBindingRequest,
    ): Promise<OneclawResponse<BindingResponse>> {
        return this.http.request<BindingResponse>(
            "POST",
            `/v1/agents/${agentId}/bindings`,
            { body: options },
        );
    }

    async list(
        agentId: string,
    ): Promise<OneclawResponse<BindingListResponse>> {
        return this.http.request<BindingListResponse>(
            "GET",
            `/v1/agents/${agentId}/bindings`,
        );
    }

    async get(
        agentId: string,
        bindingId: string,
    ): Promise<OneclawResponse<BindingResponse>> {
        return this.http.request<BindingResponse>(
            "GET",
            `/v1/agents/${agentId}/bindings/${bindingId}`,
        );
    }

    async update(
        agentId: string,
        bindingId: string,
        options: UpdateBindingRequest,
    ): Promise<OneclawResponse<BindingResponse>> {
        return this.http.request<BindingResponse>(
            "PATCH",
            `/v1/agents/${agentId}/bindings/${bindingId}`,
            { body: options },
        );
    }

    async delete(
        agentId: string,
        bindingId: string,
    ): Promise<OneclawResponse<void>> {
        return this.http.request<void>(
            "DELETE",
            `/v1/agents/${agentId}/bindings/${bindingId}`,
        );
    }

    /** Rotate (overwrite) a binding's stored credential. */
    async rotateCredential(
        agentId: string,
        bindingId: string,
        options: RotateCredentialRequest,
    ): Promise<OneclawResponse<BindingResponse>> {
        return this.http.request<BindingResponse>(
            "POST",
            `/v1/agents/${agentId}/bindings/${bindingId}/rotate-credential`,
            { body: options },
        );
    }

    async test(
        agentId: string,
        bindingId: string,
        options?: TestBindingRequest,
    ): Promise<OneclawResponse<TestBindingResponse>> {
        return this.http.request<TestBindingResponse>(
            "POST",
            `/v1/agents/${agentId}/bindings/${bindingId}/test`,
            { body: options ?? {} },
        );
    }

    async execute(
        agentId: string,
        options: ExecuteRequest,
    ): Promise<OneclawResponse<ExecuteResponse>> {
        return this.http.request<ExecuteResponse>(
            "POST",
            `/v1/agents/${agentId}/execute`,
            { body: options },
        );
    }

    async listExecutions(
        agentId: string,
        params?: { limit?: number; offset?: number },
    ): Promise<OneclawResponse<ExecutionEventListResponse>> {
        const qs = new URLSearchParams();
        if (params?.limit) qs.set("limit", String(params.limit));
        if (params?.offset) qs.set("offset", String(params.offset));
        const query = qs.toString();
        const path = `/v1/agents/${agentId}/executions${query ? `?${query}` : ""}`;
        return this.http.request<ExecutionEventListResponse>("GET", path);
    }
}
