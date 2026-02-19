import type { HttpClient } from "./http";
import type {
  CreateAgentRequest,
  UpdateAgentRequest,
  AgentResponse,
  AgentCreatedResponse,
  AgentListResponse,
  AgentKeyRotatedResponse,
  OneclawResponse,
} from "./types";

/**
 * Agents resource — register, manage, and rotate keys for AI agents
 * that interact with the vault programmatically.
 */
export class AgentsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Register a new agent. Returns the agent record and a one-time API key.
   * Store the API key securely — it cannot be retrieved again.
   */
  async create(
    options: CreateAgentRequest,
  ): Promise<OneclawResponse<AgentCreatedResponse>> {
    return this.http.request<AgentCreatedResponse>("POST", "/v1/agents", {
      body: options,
    });
  }

  /** Fetch a single agent by ID. */
  async get(agentId: string): Promise<OneclawResponse<AgentResponse>> {
    return this.http.request<AgentResponse>("GET", `/v1/agents/${agentId}`);
  }

  /** List all agents in the current organization. */
  async list(): Promise<OneclawResponse<AgentListResponse>> {
    return this.http.request<AgentListResponse>("GET", "/v1/agents");
  }

  /** Update agent name, scopes, active status, or expiry. */
  async update(
    agentId: string,
    update: UpdateAgentRequest,
  ): Promise<OneclawResponse<AgentResponse>> {
    return this.http.request<AgentResponse>(
      "PATCH",
      `/v1/agents/${agentId}`,
      { body: update },
    );
  }

  /** Delete an agent permanently. */
  async delete(agentId: string): Promise<OneclawResponse<void>> {
    return this.http.request<void>("DELETE", `/v1/agents/${agentId}`);
  }

  /**
   * Rotate an agent's API key. Returns the new key — store it securely.
   * The old key is immediately invalidated.
   */
  async rotateKey(
    agentId: string,
  ): Promise<OneclawResponse<AgentKeyRotatedResponse>> {
    return this.http.request<AgentKeyRotatedResponse>(
      "POST",
      `/v1/agents/${agentId}/rotate-key`,
    );
  }
}
