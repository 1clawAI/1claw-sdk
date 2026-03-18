import type { HttpClient } from "../core/http";
import type {
    OrgMemberResponse,
    OrgMemberListResponse,
    UpdateMemberRoleRequest,
    OneclawResponse,
} from "../types";
import type { ApiSchemas } from "../types";

/**
 * Org resource — manage organization membership and roles.
 */
export class OrgResource {
    constructor(private readonly http: HttpClient) {}

    /** List all members of the current organization. */
    async listMembers(): Promise<OneclawResponse<OrgMemberListResponse>> {
        return this.http.request<OrgMemberListResponse>(
            "GET",
            "/v1/org/members",
        );
    }

    /**
     * Get the org's __agent-keys vault id (for revealing agent identity keys).
     * Users only. Returns 404 if the vault does not exist (e.g. no agents created yet).
     */
    async getAgentKeysVault(): Promise<
        OneclawResponse<ApiSchemas["AgentKeysVaultResponse"]>
    > {
        return this.http.request<ApiSchemas["AgentKeysVaultResponse"]>(
            "GET",
            "/v1/org/agent-keys-vault",
        );
    }

    /** Update a member's role (owner, admin, or member). */
    async updateMemberRole(
        userId: string,
        role: UpdateMemberRoleRequest["role"],
    ): Promise<OneclawResponse<OrgMemberResponse>> {
        return this.http.request<OrgMemberResponse>(
            "PATCH",
            `/v1/org/members/${userId}`,
            { body: { role } },
        );
    }

    /** Remove a member from the organization. */
    async removeMember(userId: string): Promise<OneclawResponse<void>> {
        return this.http.request<void>("DELETE", `/v1/org/members/${userId}`);
    }
}
