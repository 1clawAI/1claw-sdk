import type { HttpClient } from "../core/http";
import type {
    PutMemoryRequest,
    MemoryEntryResponse,
    MemoryEntryListResponse,
    NamespaceListResponse,
    OneclawResponse,
} from "../types";

/**
 * Memory resource — per-agent key-value storage organized by namespace
 * with optional TTL for automatic expiry.
 */
export class MemoryResource {
    constructor(private readonly http: HttpClient) {}

    /** Store or update a memory entry under a namespace and key. */
    async put(
        agentId: string,
        namespace: string,
        key: string,
        data: PutMemoryRequest,
    ): Promise<OneclawResponse<MemoryEntryResponse>> {
        return this.http.request<MemoryEntryResponse>(
            "PUT",
            `/v1/agents/${agentId}/memory/${encodeURIComponent(namespace)}/${encodeURIComponent(key)}`,
            { body: data },
        );
    }

    /** Retrieve a single memory entry by namespace and key. */
    async get(
        agentId: string,
        namespace: string,
        key: string,
    ): Promise<OneclawResponse<MemoryEntryResponse>> {
        return this.http.request<MemoryEntryResponse>(
            "GET",
            `/v1/agents/${agentId}/memory/${encodeURIComponent(namespace)}/${encodeURIComponent(key)}`,
        );
    }

    /** List memory entries within a namespace. */
    async list(
        agentId: string,
        namespace: string,
        params?: { prefix?: string; limit?: number; offset?: number },
    ): Promise<OneclawResponse<MemoryEntryListResponse>> {
        const qs = new URLSearchParams();
        if (params?.prefix) qs.set("prefix", params.prefix);
        if (params?.limit != null) qs.set("limit", String(params.limit));
        if (params?.offset != null) qs.set("offset", String(params.offset));
        const query = qs.toString();
        return this.http.request<MemoryEntryListResponse>(
            "GET",
            `/v1/agents/${agentId}/memory/${encodeURIComponent(namespace)}${query ? `?${query}` : ""}`,
        );
    }

    /** List all namespaces that have memory entries for an agent. */
    async listNamespaces(
        agentId: string,
    ): Promise<OneclawResponse<NamespaceListResponse>> {
        return this.http.request<NamespaceListResponse>(
            "GET",
            `/v1/agents/${agentId}/memory`,
        );
    }

    /** Delete a single memory entry by namespace and key. */
    async delete(
        agentId: string,
        namespace: string,
        key: string,
    ): Promise<OneclawResponse<{ deleted: boolean }>> {
        return this.http.request<{ deleted: boolean }>(
            "DELETE",
            `/v1/agents/${agentId}/memory/${encodeURIComponent(namespace)}/${encodeURIComponent(key)}`,
        );
    }

    /** Delete all memory entries within a namespace. */
    async deleteNamespace(
        agentId: string,
        namespace: string,
    ): Promise<OneclawResponse<{ deleted_count: number }>> {
        return this.http.request<{ deleted_count: number }>(
            "DELETE",
            `/v1/agents/${agentId}/memory/${encodeURIComponent(namespace)}`,
        );
    }
}
