import type { HttpClient } from "../core/http";
import type {
    CreateAgentRequest,
    UpdateAgentRequest,
    AgentResponse,
    AgentCreatedResponse,
    AgentListResponse,
    AgentKeyRotatedResponse,
    AgentSelfResponse,
    EnrollAgentRequest,
    EnrollAgentResponse,
    BatchDeleteAgentsRequest,
    BatchDeleteAgentsResponse,
    SubmitTransactionRequest,
    SignTransactionRequest,
    SignTransactionResponse,
    SimulateTransactionRequest,
    SimulateBundleRequest,
    SimulationResponse,
    BundleSimulationResponse,
    TransactionResponse,
    TransactionListResponse,
    SignIntentRequest,
    SignIntentResponse,
    AddSmartAccountRequest,
    AgentSmartAccount,
    GenerateEoaResponse,
    RotateSignerKeyResponse,
    LeaseBankrKeyRequest,
    LeaseBankrKeyResponse,
    BankrKeyLeaseListResponse,
    CreateDelegationRequest,
    UpdateDelegationRequest,
    DelegationResponse,
    DelegationListResponse,
    ImportSmartAccountRequest,
    OneclawResponse,
} from "../types";

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

    /**
     * Self-enroll an agent (public, no auth required).
     *
     * With `human_email`, credentials are emailed after approval; the response may include
     * `approval_url` as a fallback. With name only (omit `human_email`), the response includes
     * `approval_url` for the human to open while signed in.
     */
    async enroll(
        options: EnrollAgentRequest,
    ): Promise<OneclawResponse<EnrollAgentResponse>> {
        return this.http.request<EnrollAgentResponse>(
            "POST",
            "/v1/agents/enroll",
            { body: options },
        );
    }

    /**
     * Static helper to self-enroll without an existing client instance.
     * Useful when the agent has no credentials yet.
     */
    static async enroll(
        baseUrl: string,
        options: EnrollAgentRequest,
    ): Promise<EnrollAgentResponse> {
        const res = await fetch(`${baseUrl}/v1/agents/enroll`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(options),
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(
                body.detail || body.message || `Enroll failed (${res.status})`,
            );
        }
        return res.json();
    }

    /** Fetch the calling agent's own profile (includes `created_by`). */
    async getSelf(): Promise<OneclawResponse<AgentSelfResponse>> {
        return this.http.request<AgentSelfResponse>("GET", "/v1/agents/me");
    }

    /** Fetch a single agent by ID. */
    async get(agentId: string): Promise<OneclawResponse<AgentResponse>> {
        return this.http.request<AgentResponse>("GET", `/v1/agents/${agentId}`);
    }

    /** List all agents in the current organization. */
    async list(): Promise<OneclawResponse<AgentListResponse>> {
        return this.http.request<AgentListResponse>("GET", "/v1/agents");
    }

    /** Update agent name, scopes, active status, expiry, or Intents API setting. */
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
     * Delete multiple agents in a single request. Returns a summary of
     * how many were deleted and any per-agent errors (e.g. platform-locked).
     * Accepts up to 500 agent IDs per call.
     */
    async batchDelete(
        agentIds: string[],
    ): Promise<OneclawResponse<BatchDeleteAgentsResponse>> {
        return this.http.request<BatchDeleteAgentsResponse>(
            "POST",
            "/v1/agents/batch-delete",
            { body: { agent_ids: agentIds } },
        );
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

    // ── Intents API ──────────────────────────────────────────────────

    /**
     * Submit a transaction intent to be signed by the Intents API.
     * The agent must have `intents_api_enabled: true` and a valid
     * signing key stored in an accessible vault.
     *
     * Automatically generates an Idempotency-Key header for replay
     * protection. Pass `idempotencyKey` to override with your own.
     */
    async submitTransaction(
        agentId: string,
        tx: SubmitTransactionRequest,
        options?: { idempotencyKey?: string },
    ): Promise<OneclawResponse<TransactionResponse>> {
        const key = options?.idempotencyKey ?? crypto.randomUUID();
        return this.http.request<TransactionResponse>(
            "POST",
            `/v1/agents/${agentId}/transactions`,
            { body: tx, headers: { "Idempotency-Key": key } },
        );
    }

    /**
     * Fetch a single transaction by ID.
     * By default the API omits `signed_tx`; pass `includeSignedTx: true` to include it.
     */
    async getTransaction(
        agentId: string,
        txId: string,
        options?: { includeSignedTx?: boolean },
    ): Promise<OneclawResponse<TransactionResponse>> {
        const qs =
            options?.includeSignedTx === true
                ? "?include_signed_tx=true"
                : "";
        return this.http.request<TransactionResponse>(
            "GET",
            `/v1/agents/${agentId}/transactions/${txId}${qs}`,
        );
    }

    /**
     * List recent transactions for an agent.
     * By default the API omits `signed_tx`; pass `includeSignedTx: true` to include it.
     */
    async listTransactions(
        agentId: string,
        options?: { includeSignedTx?: boolean },
    ): Promise<OneclawResponse<TransactionListResponse>> {
        const qs =
            options?.includeSignedTx === true
                ? "?include_signed_tx=true"
                : "";
        return this.http.request<TransactionListResponse>(
            "GET",
            `/v1/agents/${agentId}/transactions${qs}`,
        );
    }

    /**
     * Sign a transaction without broadcasting. The signed_tx hex is returned
     * so the caller can submit to their own RPC endpoint.
     * All agent guardrails (allowlists, value caps, daily limits) are enforced.
     */
    async signTransaction(
        agentId: string,
        tx: SignTransactionRequest,
    ): Promise<OneclawResponse<SignTransactionResponse>> {
        return this.http.request<SignTransactionResponse>(
            "POST",
            `/v1/agents/${agentId}/transactions/sign`,
            { body: tx },
        );
    }

    // ── Transaction Simulation ─────────────────────────────────────────

    /**
     * Simulate a transaction via Tenderly without signing or broadcasting.
     * Returns balance changes, gas estimates, and success/revert status.
     */
    async simulateTransaction(
        agentId: string,
        tx: SimulateTransactionRequest,
    ): Promise<OneclawResponse<SimulationResponse>> {
        return this.http.request<SimulationResponse>(
            "POST",
            `/v1/agents/${agentId}/transactions/simulate`,
            { body: tx },
        );
    }

    /**
     * Simulate a bundle of transactions sequentially (e.g. approve + swap).
     */
    async simulateBundle(
        agentId: string,
        bundle: SimulateBundleRequest,
    ): Promise<OneclawResponse<BundleSimulationResponse>> {
        return this.http.request<BundleSimulationResponse>(
            "POST",
            `/v1/agents/${agentId}/transactions/simulate-bundle`,
            { body: bundle },
        );
    }

    // ── Unified Sign ────────────────────────────────────────────────

    /**
     * Sign a message, typed data, or transaction using the agent's
     * multi-chain signing key. Supports personal_sign (EIP-191),
     * typed_data (EIP-712), and raw transaction signing across chains.
     */
    async sign(
        agentId: string,
        params: SignIntentRequest,
    ): Promise<OneclawResponse<SignIntentResponse>> {
        return this.http.request<SignIntentResponse>(
            "POST",
            `/v1/agents/${agentId}/sign`,
            { body: params },
        );
    }

    // ── Smart Accounts ──────────────────────────────────────────────

    /**
     * Generate a secp256k1 EOA for the agent. The private key is stored
     * in the __agent-keys vault and the derived address set on the agent record.
     */
    async generateEoa(
        agentId: string,
    ): Promise<OneclawResponse<GenerateEoaResponse>> {
        return this.http.request<GenerateEoaResponse>(
            "POST",
            `/v1/agents/${agentId}/eoa`,
        );
    }

    /**
     * Register a Smart Account (Safe) for the agent on a specific chain.
     * The Safe must already be deployed on-chain.
     */
    async createSmartAccount(
        agentId: string,
        account: AddSmartAccountRequest,
    ): Promise<OneclawResponse<AgentSmartAccount>> {
        return this.http.request<AgentSmartAccount>(
            "POST",
            `/v1/agents/${agentId}/smart-accounts`,
            { body: account },
        );
    }

    /**
     * Remove a Smart Account record from the agent (does not affect on-chain state).
     */
    async deleteSmartAccount(
        agentId: string,
        chainId: number,
    ): Promise<OneclawResponse<void>> {
        return this.http.request<void>(
            "DELETE",
            `/v1/agents/${agentId}/smart-accounts/${chainId}`,
        );
    }

    /**
     * Rotate the agent's EOA signer key. Submits a swapOwner UserOp on the
     * agent's Safe and stores the new private key in the vault.
     */
    async rotateSigner(
        agentId: string,
    ): Promise<OneclawResponse<RotateSignerKeyResponse>> {
        return this.http.request<RotateSignerKeyResponse>(
            "POST",
            `/v1/agents/${agentId}/rotate-signer-key`,
        );
    }

    /**
     * Lease a short-lived Bankr wallet API key for an agent.
     * The partner key (`bk_ptr_`) stays in the vault secure zone. **Agent JWT
     * callers** receive lease metadata only (`lease_id`, `wallet_id`, `expires_at`)
     * — no `api_key` (use Shroud with `X-Shroud-Provider: bankr`). **Human
     * callers** may receive `api_key` once when vending is configured.
     * Requires a policy on `__agent-keys` granting `write` on
     * `agents/{agent_id}/bankr/*` for agent callers.
     */
    async leaseBankrKey(
        agentId: string,
        options?: LeaseBankrKeyRequest,
    ): Promise<OneclawResponse<LeaseBankrKeyResponse>> {
        return this.http.request<LeaseBankrKeyResponse>(
            "POST",
            `/v1/agents/${agentId}/bankr-keys/lease`,
            { body: options ?? {} },
        );
    }

    /**
     * List active Bankr key leases for an agent.
     */
    async listBankrKeys(
        agentId: string,
    ): Promise<OneclawResponse<BankrKeyLeaseListResponse>> {
        return this.http.request<BankrKeyLeaseListResponse>(
            "GET",
            `/v1/agents/${agentId}/bankr-keys`,
        );
    }

    /**
     * Revoke an active Bankr key lease (early termination).
     */
    async revokeBankrKey(
        agentId: string,
        leaseId: string,
    ): Promise<OneclawResponse<void>> {
        return this.http.request<void>(
            "DELETE",
            `/v1/agents/${agentId}/bankr-keys/${leaseId}`,
        );
    }

    // ── Delegations ──────────────────────────────────────────────────

    /**
     * Create a delegation granting this agent permission to delegate
     * tasks to another agent. Human-only (agents cannot self-create).
     */
    async createDelegation(
        agentId: string,
        data: CreateDelegationRequest,
    ): Promise<OneclawResponse<DelegationResponse>> {
        return this.http.request<DelegationResponse>(
            "POST",
            `/v1/agents/${agentId}/delegations`,
            { body: data },
        );
    }

    /**
     * List all delegations configured for an agent (as delegator).
     */
    async listDelegations(
        agentId: string,
    ): Promise<OneclawResponse<DelegationListResponse>> {
        return this.http.request<DelegationListResponse>(
            "GET",
            `/v1/agents/${agentId}/delegations`,
        );
    }

    /**
     * Get a specific delegation by ID.
     */
    async getDelegation(
        agentId: string,
        delegationId: string,
    ): Promise<OneclawResponse<DelegationResponse>> {
        return this.http.request<DelegationResponse>(
            "GET",
            `/v1/agents/${agentId}/delegations/${delegationId}`,
        );
    }

    /**
     * Update an existing delegation (tools, limits, active status).
     */
    async updateDelegation(
        agentId: string,
        delegationId: string,
        data: UpdateDelegationRequest,
    ): Promise<OneclawResponse<DelegationResponse>> {
        return this.http.request<DelegationResponse>(
            "PATCH",
            `/v1/agents/${agentId}/delegations/${delegationId}`,
            { body: data },
        );
    }

    /**
     * Revoke (delete) a delegation.
     */
    async revokeDelegation(
        agentId: string,
        delegationId: string,
    ): Promise<OneclawResponse<void>> {
        return this.http.request<void>(
            "DELETE",
            `/v1/agents/${agentId}/delegations/${delegationId}`,
        );
    }

    /**
     * Get effective delegations for an agent — includes delegations
     * where this agent is the delegator, with daily usage stats.
     * Agents can call this on their own ID.
     */
    async getEffectiveDelegations(
        agentId: string,
    ): Promise<OneclawResponse<DelegationListResponse>> {
        return this.http.request<DelegationListResponse>(
            "GET",
            `/v1/agents/${agentId}/delegations/effective`,
        );
    }

    /**
     * Import an existing Safe smart account for an agent.
     */
    async importSmartAccount(
        agentId: string,
        body: ImportSmartAccountRequest,
    ): Promise<OneclawResponse<unknown>> {
        return this.http.request(
            "POST",
            `/v1/agents/${agentId}/smart-accounts/import`,
            { body },
        );
    }

    /** List on-chain account records for an agent (EOA/Safe stubs). */
    async listAccounts(agentId: string): Promise<OneclawResponse<{ accounts: AgentAccount[] }>> {
        return this.http.request("GET", `/v1/agents/${agentId}/accounts`);
    }

    /** Provision an agent account record (human-only). */
    async provisionAccount(
        agentId: string,
        body: { chain: string; account_type?: string; address?: string },
    ): Promise<OneclawResponse<AgentAccount>> {
        return this.http.request("POST", `/v1/agents/${agentId}/accounts`, { body });
    }

    /** Dry-run draft guardrails against recent transactions. */
    async replayGuardrails(
        agentId: string,
        body?: {
            days?: number;
            draft_guardrails?: Record<string, unknown>;
            draft_approval_policy?: Record<string, unknown>;
        },
    ): Promise<OneclawResponse<GuardrailReplayResponse>> {
        return this.http.request("POST", `/v1/agents/${agentId}/guardrails/replay`, { body });
    }
}

export interface AgentAccount {
    id: string;
    org_id: string;
    agent_id: string;
    chain: string;
    account_type: string;
    address: string;
    created_at: string;
}

export interface GuardrailReplayResponse {
    agent_id: string;
    window_days: number;
    allowed: number;
    denied: number;
    would_require_approval: number;
    samples: Array<Record<string, unknown>>;
}
