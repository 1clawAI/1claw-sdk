import type { HttpClient } from "../core/http";
import type {
    CreateRuntimeRequest,
    UpdateRuntimeRequest,
    RuntimeResponse,
    RuntimeListResponse,
    SlugCheckResponse,
    ShellSessionRequest,
    ShellSessionResponse,
    OneclawResponse,
} from "../types";

/**
 * Runtimes resource — provision and manage compute environments
 * for agent code execution.
 */
export class RuntimesResource {
    constructor(private readonly http: HttpClient) {}

    /** Create a new runtime for an agent. */
    async create(
        data: CreateRuntimeRequest,
    ): Promise<OneclawResponse<RuntimeResponse>> {
        return this.http.request<RuntimeResponse>("POST", "/v1/runtimes", {
            body: data,
        });
    }

    /** List all runtimes in the current organization. */
    async list(): Promise<OneclawResponse<RuntimeListResponse>> {
        return this.http.request<RuntimeListResponse>("GET", "/v1/runtimes");
    }

    /** Fetch a single runtime by ID. */
    async get(runtimeId: string): Promise<OneclawResponse<RuntimeResponse>> {
        return this.http.request<RuntimeResponse>(
            "GET",
            `/v1/runtimes/${runtimeId}`,
        );
    }

    /** Update an existing runtime. */
    async update(
        runtimeId: string,
        data: UpdateRuntimeRequest,
    ): Promise<OneclawResponse<RuntimeResponse>> {
        return this.http.request<RuntimeResponse>(
            "PATCH",
            `/v1/runtimes/${runtimeId}`,
            { body: data },
        );
    }

    /** Delete a runtime permanently. */
    async delete(runtimeId: string): Promise<OneclawResponse<void>> {
        return this.http.request<void>(
            "DELETE",
            `/v1/runtimes/${runtimeId}`,
        );
    }

    /** Start a stopped runtime. */
    async start(runtimeId: string): Promise<OneclawResponse<RuntimeResponse>> {
        return this.http.request<RuntimeResponse>(
            "POST",
            `/v1/runtimes/${runtimeId}/start`,
        );
    }

    /** Stop a running runtime. */
    async stop(runtimeId: string): Promise<OneclawResponse<RuntimeResponse>> {
        return this.http.request<RuntimeResponse>(
            "POST",
            `/v1/runtimes/${runtimeId}/stop`,
        );
    }

    /** Check if a slug is available for hosting. */
    async checkSlug(
        slug: string,
    ): Promise<OneclawResponse<SlugCheckResponse>> {
        return this.http.request<SlugCheckResponse>(
            "GET",
            `/v1/runtimes/slug-check/${encodeURIComponent(slug)}`,
        );
    }

    /** Fetch recent container logs (`entries` from Cloud Logging / Docker). */
    async logs(
        runtimeId: string,
        opts?: { tail?: number },
    ): Promise<OneclawResponse<{ entries: Array<{ timestamp?: string; message: string }> }>> {
        const tail = opts?.tail ?? 100;
        return this.http.request(
            "GET",
            `/v1/runtimes/${runtimeId}/logs?tail=${tail}`,
        );
    }

    /**
     * Create an interactive shell WebSocket session (human-only, step-up auth).
     * Runtime must have `shell_access_enabled` and typically be running.
     */
    async createShellSession(
        runtimeId: string,
        data: ShellSessionRequest = {},
    ): Promise<OneclawResponse<ShellSessionResponse>> {
        return this.http.request<ShellSessionResponse>(
            "POST",
            `/v1/runtimes/${runtimeId}/shell/session`,
            { body: data },
        );
    }

    /** Begin WebAuthn passkey assertion for shell step-up auth. */
    async beginShellPasskey(
        runtimeId: string,
    ): Promise<OneclawResponse<Record<string, unknown>>> {
        return this.http.request<Record<string, unknown>>(
            "POST",
            `/v1/runtimes/${runtimeId}/shell/passkey/begin`,
        );
    }
}
