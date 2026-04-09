import type { components } from "./generated/api-types";

// Re-export the full generated types for advanced users who want raw
// spec-exact types (e.g. for openapi-fetch or custom codegen).
export type { paths, components, operations } from "./generated/api-types";

/**
 * Convenience alias for the generated component schemas.
 * Usage: `ApiSchemas["VaultResponse"]`, `ApiSchemas["AgentResponse"]`, etc.
 */
export type ApiSchemas = components["schemas"];

// ---------------------------------------------------------------------------
// Client configuration (SDK-only, not in the API spec)
// ---------------------------------------------------------------------------

export interface OneclawClientConfig {
    /** Base URL for the 1Claw API (e.g. "https://api.1claw.xyz") */
    baseUrl: string;
    /** Pre-existing Bearer token (user JWT or agent JWT). */
    token?: string;
    /** User API key — will be exchanged for a JWT on first request. */
    apiKey?: string;
    /** Optional: agent ID to pair with `apiKey` for agent-token auth. */
    agentId?: string;
    /** Signer for x402 payments. Implement this interface with your wallet. */
    x402Signer?: X402Signer;
    /** Maximum auto-pay amount in USD per request (default: 0 = never auto-pay). */
    maxAutoPayUsd?: number;
    /** Network for x402 payments (default: "eip155:8453" — Base). */
    network?: string;
    /** Optional plugin registry for extending the SDK with custom providers. */
    plugins?: import("./plugins").PluginRegistry;
}

// ---------------------------------------------------------------------------
// Standard response envelope (SDK-only)
// ---------------------------------------------------------------------------

export interface OneclawResponse<T> {
    data: T | null;
    error: { type: string; message: string; detail?: string } | null;
    meta?: ResponseMeta;
}

export interface ResponseMeta {
    status: number;
    requestId?: string;
}

// ---------------------------------------------------------------------------
// Auth — request types from generated spec
// ---------------------------------------------------------------------------

/** Login with email and password. Named `LoginRequest` in the OpenAPI spec. */
export type TokenRequest = ApiSchemas["LoginRequest"];

export type AgentTokenRequest = ApiSchemas["AgentTokenRequest"];

export type UserApiKeyTokenRequest = ApiSchemas["UserApiKeyTokenRequest"];

export type GoogleAuthRequest = ApiSchemas["GoogleAuthRequest"];

export type SignupRequest = ApiSchemas["SignupRequest"];

export type ChangePasswordRequest = ApiSchemas["ChangePasswordRequest"];

export type ForgotPasswordRequest = ApiSchemas["ForgotPasswordRequest"];
export type ForgotPasswordResponse = ApiSchemas["ForgotPasswordResponse"];
export type ResetPasswordRequest = ApiSchemas["ResetPasswordRequest"];
export type ResetPasswordResponse = ApiSchemas["ResetPasswordResponse"];

// Account management
export interface UserProfileResponse {
    id: string;
    email: string;
    display_name: string;
    auth_method: string;
    role: string;
    email_verified: boolean;
    marketing_emails: boolean;
    totp_enabled: boolean;
    created_at: string;
}

export interface UpdateProfileRequest {
    display_name?: string;
    marketing_emails?: boolean;
}

export interface DeleteAccountRequest {
    confirm: string;
}

// Agent self profile
export interface AgentSelfResponse {
    id: string;
    name: string;
    description: string;
    org_id: string;
    scopes: string[];
    is_active: boolean;
    intents_api_enabled: boolean;
    created_by?: string;
    created_at: string;
    expires_at?: string;
    last_active_at?: string;
}

// Auth response — hand-written (stricter required fields)
export interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
}

// ---------------------------------------------------------------------------
// API Keys — request types from generated spec, responses hand-written
// ---------------------------------------------------------------------------

export type CreateApiKeyRequest = ApiSchemas["CreateApiKeyRequest"];

export interface ApiKeyResponse {
    id: string;
    name: string;
    key_prefix: string;
    scopes: string[];
    is_active: boolean;
    created_at: string;
    expires_at?: string;
    last_used_at?: string;
}

export interface ApiKeyCreatedResponse {
    key: ApiKeyResponse;
    api_key: string;
}

export interface ApiKeyListResponse {
    keys: ApiKeyResponse[];
}

// ---------------------------------------------------------------------------
// Vaults — request types from generated spec, responses hand-written
// ---------------------------------------------------------------------------

export type CreateVaultRequest = ApiSchemas["CreateVaultRequest"];

export interface EnableMpcRequest {
    mpc_custody: string;
}

export interface VaultResponse {
    id: string;
    name: string;
    description: string;
    created_by: string;
    created_by_type: string;
    created_at: string;
    cmek_enabled?: boolean;
    cmek_fingerprint?: string;
    mpc_custody?: string;
    mpc_threshold?: number;
    mpc_providers?: string[];
}

export interface VaultListResponse {
    vaults: VaultResponse[];
}

export interface EnableCmekRequest {
    fingerprint: string;
}

export interface CmekRotationJobResponse {
    id: string;
    vault_id: string;
    old_fingerprint: string;
    new_fingerprint: string;
    status: string;
    total_secrets: number;
    processed: number;
    error?: string;
    started_at?: string;
    completed_at?: string;
    created_at: string;
}

// ---------------------------------------------------------------------------
// Secrets — request types from generated spec, responses hand-written
// ---------------------------------------------------------------------------

export type PutSecretRequest = ApiSchemas["PutSecretRequest"];

export interface SecretMetadataResponse {
    id: string;
    path: string;
    type: string;
    version: number;
    metadata: Record<string, unknown>;
    created_at: string;
    expires_at?: string;
    is_disabled?: boolean;
}

export interface SecretVersionListResponse {
    versions: SecretMetadataResponse[];
}

export interface RotateSecretRequest {
    length?: number;
    charset?: "hex" | "base64" | "alphanumeric" | "ascii";
    type?: string;
}

export interface SecretResponse {
    id: string;
    path: string;
    type: string;
    value: string;
    version: number;
    metadata: Record<string, unknown>;
    created_by: string;
    created_at: string;
    expires_at?: string;
    cmek_encrypted?: boolean;
}

export interface SecretListResponse {
    secrets: SecretMetadataResponse[];
}

// ---------------------------------------------------------------------------
// Policies (Access Control) — request types from generated spec
// ---------------------------------------------------------------------------

export type CreatePolicyRequest = ApiSchemas["CreatePolicyRequest"];

export type UpdatePolicyRequest = ApiSchemas["UpdatePolicyRequest"];

export interface PolicyResponse {
    id: string;
    vault_id: string;
    secret_path_pattern: string;
    principal_type: string;
    principal_id: string;
    permissions: string[];
    conditions: Record<string, unknown>;
    expires_at?: string;
    created_by: string;
    created_by_type: string;
    created_at: string;
}

export interface PolicyListResponse {
    policies: PolicyResponse[];
}

// ---------------------------------------------------------------------------
// Agents — request types from generated spec, responses hand-written
// ---------------------------------------------------------------------------

/**
 * Hand-written: generated version marks `intents_api_enabled` as required
 * (with default false), but SDK callers expect it to be optional.
 */
/** Unicode normalization and homoglyph detection settings. */
export interface UnicodeNormalizationConfig {
    enabled?: boolean;
    strip_zero_width?: boolean;
    normalize_homoglyphs?: boolean;
    normalization_form?: "NFC" | "NFKC" | "NFD" | "NFKD";
}

/** Shell/command injection detection settings. */
export interface CommandInjectionConfig {
    enabled?: boolean;
    action?: "block" | "sanitize" | "warn" | "log";
    patterns?: "default" | "strict" | "custom";
    custom_patterns?: string[];
}

/** Social engineering and manipulation detection settings. */
export interface SocialEngineeringConfig {
    enabled?: boolean;
    action?: "block" | "warn" | "log";
    sensitivity?: "low" | "medium" | "high";
}

/** Encoding/obfuscation detection settings. */
export interface EncodingDetectionConfig {
    enabled?: boolean;
    action?: "block" | "decode" | "warn" | "log";
    detect_base64?: boolean;
    detect_hex?: boolean;
    detect_unicode_escape?: boolean;
}

/** Suspicious URL/domain detection settings. */
export interface NetworkDetectionConfig {
    enabled?: boolean;
    action?: "block" | "warn" | "log";
    blocked_domains?: string[];
    allowed_domains?: string[];
}

/** Filesystem path detection settings. */
export interface FilesystemDetectionConfig {
    enabled?: boolean;
    action?: "block" | "sanitize" | "warn" | "log";
    blocked_paths?: string[];
}

/** Tool/function call inspection settings. */
export interface ToolCallPolicy {
    enabled?: boolean;
    allowed_tool_names?: string[];
    denied_tool_names?: string[];
    scan_arguments?: boolean;
    block_credential_exfil?: boolean;
    action?: "block" | "sanitize" | "warn" | "log";
}

/** Output content policy settings for LLM responses. */
export interface OutputPolicy {
    enabled?: boolean;
    blocked_patterns?: string[];
    blocked_entities?: string[];
    block_harmful_content?: boolean;
    harmful_categories?: ("violence" | "self_harm" | "illegal" | "hate" | "sexual" | "malware")[];
    action?: "block" | "sanitize" | "warn" | "log";
}

/** Detects credentials injected into prompts that are not from the vault. */
export interface SecretInjectionConfig {
    enabled?: boolean;
    action?: "block" | "sanitize" | "warn" | "log";
    sensitivity?: "low" | "medium" | "high";
}

/** Advanced secret redaction (base64-encoded, split, prefix leaks). */
export interface AdvancedRedactionConfig {
    enabled?: boolean;
    detect_base64_encoded?: boolean;
    detect_split_secrets?: boolean;
    detect_prefix_leak?: boolean;
    min_secret_length?: number;
}

/** Semantic/intent-level policy enforcement. */
export interface SemanticPolicy {
    enabled?: boolean;
    allowed_topics?: string[];
    denied_topics?: string[];
    allowed_tasks?: string[];
    denied_tasks?: string[];
    action?: "block" | "sanitize" | "warn" | "log";
}

/** Per-agent Shroud LLM Proxy configuration. */
export interface ShroudConfig {
    pii_policy?: "block" | "redact" | "warn" | "allow";
    injection_threshold?: number;
    context_injection_threshold?: number;
    allowed_providers?: string[];
    allowed_models?: string[];
    denied_models?: string[];
    max_tokens_per_request?: number;
    max_requests_per_minute?: number;
    max_requests_per_day?: number;
    daily_budget_usd?: number;
    enable_secret_redaction?: boolean;
    enable_response_filtering?: boolean;
    /** Unicode normalization and homoglyph detection. */
    unicode_normalization?: UnicodeNormalizationConfig;
    /** Shell/command injection detection. */
    command_injection_detection?: CommandInjectionConfig;
    /** Social engineering and manipulation detection. */
    social_engineering_detection?: SocialEngineeringConfig;
    /** Encoding/obfuscation detection (Base64, hex, Unicode escapes). */
    encoding_detection?: EncodingDetectionConfig;
    /** Suspicious URL/domain detection. */
    network_detection?: NetworkDetectionConfig;
    /** Filesystem path detection. */
    filesystem_detection?: FilesystemDetectionConfig;
    /** Global behavior when threats are detected. */
    sanitization_mode?: "block" | "surgical" | "log_only";
    /** Whether to log all detected threats to audit. */
    threat_logging?: boolean;
    /** Tool/function call inspection. */
    tool_call_inspection?: ToolCallPolicy;
    /** Output content policies for LLM responses. */
    output_policy?: OutputPolicy;
    /** Detect credentials injected into prompts that are not from the vault. */
    secret_injection_detection?: SecretInjectionConfig;
    /** Advanced secret redaction (base64-encoded, split secrets, prefix leaks). */
    advanced_redaction?: AdvancedRedactionConfig;
    /** Semantic/intent-level policy enforcement. */
    semantic_policy?: SemanticPolicy;
    /** Number of days to retain flagged request bodies for replay/investigation. */
    flagged_request_retention_days?: number;
}

export interface CreateAgentRequest {
    name: string;
    description?: string;
    auth_method?: "api_key" | "mtls" | "oidc_client_credentials";
    scopes?: string[];
    expires_at?: string;
    intents_api_enabled?: boolean;
    tx_to_allowlist?: string[];
    tx_max_value_eth?: string;
    tx_daily_limit_eth?: string;
    tx_allowed_chains?: string[];
    token_ttl_seconds?: number | null;
    vault_ids?: string[];
    /** SHA-256 fingerprint of the client certificate (required for mTLS auth) */
    client_cert_fingerprint?: string;
    /** OIDC issuer URL (required for oidc_client_credentials auth) */
    oidc_issuer?: string;
    /** OIDC client ID (required for oidc_client_credentials auth) */
    oidc_client_id?: string;
    /** Enable Shroud LLM Proxy for this agent. */
    shroud_enabled?: boolean;
    /** Shroud per-agent policy (PII, injection, providers, token limits, etc.). */
    shroud_config?: ShroudConfig;
}

export type UpdateAgentRequest = ApiSchemas["UpdateAgentRequest"];

export interface AgentResponse {
    id: string;
    name: string;
    description: string;
    auth_method: "api_key" | "mtls" | "oidc_client_credentials";
    scopes: string[];
    is_active: boolean;
    intents_api_enabled: boolean;
    tx_to_allowlist?: string[];
    tx_max_value_eth?: string;
    tx_daily_limit_eth?: string;
    /** ETH already spent today (UTC) per recorded txs; pairs with tx_daily_limit_eth. */
    tx_spent_today_eth?: string;
    tx_allowed_chains?: string[];
    token_ttl_seconds?: number | null;
    vault_ids?: string[];
    /** SHA-256 fingerprint of the client certificate (mTLS agents) */
    client_cert_fingerprint?: string;
    /** OIDC issuer URL (oidc_client_credentials agents) */
    oidc_issuer?: string;
    /** OIDC client ID (oidc_client_credentials agents) */
    oidc_client_id?: string;
    /** Ed25519 SSH public key (base64-encoded, auto-generated at creation) */
    ssh_public_key?: string;
    /** P-256 ECDH public key (base64 SEC1 uncompressed point, auto-generated at creation) */
    ecdh_public_key?: string;
    /** Whether this agent routes LLM traffic through the Shroud TEE proxy. */
    shroud_enabled: boolean;
    /** Per-agent Shroud policy (PII, injection, providers, token limits, etc.). */
    shroud_config?: ShroudConfig | null;
    created_at: string;
    expires_at?: string;
    last_active_at?: string;
}

export interface AgentCreatedResponse {
    agent: AgentResponse;
    /** Only present for api_key auth method */
    api_key?: string;
}

export interface AgentListResponse {
    agents: AgentResponse[];
}

export interface AgentKeyRotatedResponse {
    api_key: string;
}

export interface EnrollAgentRequest {
    name: string;
    human_email: string;
    description?: string;
}

export interface EnrollAgentResponse {
    agent_id: string;
    message: string;
}

export interface AgentSelfResponse {
    id: string;
    name: string;
    description: string;
    org_id: string;
    scopes: string[];
    is_active: boolean;
    intents_api_enabled: boolean;
    created_by?: string;
    created_at: string;
    expires_at?: string;
    last_active_at?: string;
    /** Ed25519 SSH public key (base64-encoded) */
    ssh_public_key?: string;
    /** P-256 ECDH public key (base64 SEC1 uncompressed point) */
    ecdh_public_key?: string;
}

// ---------------------------------------------------------------------------
// Chains — request types from generated spec, responses hand-written
// ---------------------------------------------------------------------------

export interface ChainResponse {
    id: string;
    name: string;
    display_name: string;
    chain_id: number;
    rpc_url?: string;
    ws_url?: string;
    explorer_url?: string;
    native_currency: string;
    is_testnet: boolean;
    is_enabled: boolean;
    created_at: string;
    updated_at: string;
}

export interface ChainListResponse {
    chains: ChainResponse[];
}

/**
 * Hand-written: generated version marks `native_currency`, `is_testnet`,
 * `is_enabled` as required (with defaults), but SDK callers expect optional.
 */
export interface CreateChainRequest {
    name: string;
    display_name: string;
    chain_id: number;
    rpc_url?: string;
    ws_url?: string;
    explorer_url?: string;
    native_currency?: string;
    is_testnet?: boolean;
    is_enabled?: boolean;
}

export type UpdateChainRequest = ApiSchemas["UpdateChainRequest"];

// ---------------------------------------------------------------------------
// Transactions (Intents API) — request types from generated spec
// ---------------------------------------------------------------------------

/**
 * Hand-written: generated version marks `simulate_first` as required
 * (with default false), but SDK callers expect it to be optional.
 */
export interface SubmitTransactionRequest {
    to: string;
    value: string;
    chain: string;
    data?: string;
    signing_key_path?: string;
    nonce?: number;
    gas_price?: string;
    gas_limit?: number;
    max_fee_per_gas?: string;
    max_priority_fee_per_gas?: string;
    simulate_first?: boolean;
}

/**
 * Sign-only request: signs a transaction but does NOT broadcast.
 * The caller receives the signed_tx hex to broadcast via their own RPC.
 */
export interface SignTransactionRequest {
    to: string;
    value: string;
    chain: string;
    data?: string;
    signing_key_path?: string;
    nonce?: number;
    gas_price?: string;
    gas_limit?: number;
    max_fee_per_gas?: string;
    max_priority_fee_per_gas?: string;
    simulate_first?: boolean;
}

export interface SignTransactionResponse {
    signed_tx: string;
    tx_hash: string;
    from: string;
    to: string;
    chain: string;
    chain_id: number;
    nonce: number;
    value_wei: string;
    status: "sign_only";
    simulation_id?: string;
    simulation_status?: string;
    max_fee_per_gas?: string;
    max_priority_fee_per_gas?: string;
}

export type SimulateTransactionRequest =
    ApiSchemas["SimulateTransactionRequest"];

export interface SimulateBundleRequest {
    transactions: SimulateBundleItem[];
}

export type SimulateBundleItem = ApiSchemas["SimulateTransactionRequest"];

export interface BalanceChange {
    address: string;
    token?: string;
    token_symbol?: string;
    before?: string;
    after?: string;
    change?: string;
}

export interface SimulationResponse {
    simulation_id: string;
    status: "success" | "reverted" | "error";
    gas_used: number;
    gas_estimate_usd?: string;
    balance_changes: BalanceChange[];
    error?: string;
    error_code?: string;
    error_human_readable?: string;
    revert_reason?: string;
    tenderly_dashboard_url?: string;
    simulated_at: string;
}

export interface BundleSimulationResponse {
    simulations: SimulationResponse[];
}

export interface TransactionResponse {
    id: string;
    agent_id: string;
    chain: string;
    chain_id: number;
    to: string;
    value_wei: string;
    status: "pending" | "signed" | "sign_only" | "broadcast" | "failed" | "simulation_failed";
    /** Raw signed tx hex. Omitted on list/get unless request used includeSignedTx: true. Always present on submit response. */
    signed_tx?: string;
    tx_hash?: string;
    error_message?: string;
    created_at: string;
    signed_at?: string;
    simulation_id?: string;
    simulation_status?: string;
    max_fee_per_gas?: string;
    max_priority_fee_per_gas?: string;
}

export interface TransactionListResponse {
    transactions: TransactionResponse[];
}

// ---------------------------------------------------------------------------
// Sharing — request type from generated spec (has precise enum)
// ---------------------------------------------------------------------------

export type CreateShareRequest = ApiSchemas["CreateShareRequest"];

export interface ShareResponse {
    id: string;
    share_url: string;
    recipient_type: string;
    recipient_email?: string;
    expires_at: string;
    max_access_count: number;
}

export interface SharedSecretResponse {
    id: string;
    path: string;
    type: string;
    value: string;
    access_count: number;
    max_access_count: number;
}

// ---------------------------------------------------------------------------
// Organization — request type from generated spec (has precise enum)
// ---------------------------------------------------------------------------

export interface OrgMemberResponse {
    id: string;
    email: string;
    display_name: string;
    role: string;
    auth_method: string;
    created_at: string;
}

export interface OrgMemberListResponse {
    members: OrgMemberResponse[];
}

export type UpdateMemberRoleRequest = ApiSchemas["UpdateMemberRoleRequest"];

// ---------------------------------------------------------------------------
// Billing & Usage — hand-written (generated inline types differ structurally)
// ---------------------------------------------------------------------------

export interface MonthSummary {
    total_requests: number;
    paid_requests: number;
    free_requests: number;
    total_cost_usd: string;
}

export interface UsageSummaryResponse {
    billing_tier: string;
    free_tier_limit: number;
    current_month: MonthSummary;
}

export interface UsageEventResponse {
    id: string;
    principal_type: string;
    principal_id: string;
    method: string;
    endpoint: string;
    status_code: number;
    price_usd: string;
    is_paid: boolean;
    created_at: string;
}

export interface UsageHistoryResponse {
    events: UsageEventResponse[];
}

// ---------------------------------------------------------------------------
// LLM Token Billing
// ---------------------------------------------------------------------------

export interface LlmTokenBillingStatus {
    enabled: boolean;
    subscription_status?: string;
}

export interface LlmCheckoutResponse {
    checkout_url: string;
}

export interface LlmDisableResponse {
    enabled: boolean;
}

// ---------------------------------------------------------------------------
// Audit — hand-written (AuditQuery is SDK-only, not in the spec)
// ---------------------------------------------------------------------------

export interface AuditQuery {
    resource_id?: string;
    actor_id?: string;
    action?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
}

export interface AuditEvent {
    id: string;
    action: string;
    actor_id: string;
    actor_type: string;
    resource_type: string;
    resource_id: string;
    org_id: string;
    details: Record<string, unknown>;
    ip_address?: string;
    created_at: string;
}

export interface AuditEventsResponse {
    events: AuditEvent[];
    count: number;
}

// ---------------------------------------------------------------------------
// x402 Payment Protocol — hand-written (aligns with docs.g402.ai / x402scan)
// ---------------------------------------------------------------------------

export interface PaymentAccept {
    scheme: string;
    network: string;
    payTo: string;
    /** Payment amount in atomic units (e.g. USDC 6 decimals). Use for signing and limit checks. */
    maxAmountRequired: string;
    /** Full URL of the paid resource. */
    resource: string;
    maxTimeoutSeconds: number;
    asset: string;
    description: string;
    mimeType: string;
    /** @deprecated Prefer maxAmountRequired (atomic). USD string for backward compat if server sends it. */
    price?: string;
    /** @deprecated Prefer maxTimeoutSeconds. */
    requiredDeadlineSeconds?: number;
}

export interface PaymentRequirement {
    x402Version: number;
    accepts: PaymentAccept[];
    description: string;
}

export interface PaymentPayload {
    x402Version: number;
    scheme: string;
    network: string;
    payload: string;
}

export interface PaymentReceipt {
    x402Version: number;
    scheme: string;
    network: string;
    payload: string;
    txHash?: string;
}

/**
 * Interface for wallet signers that can produce x402 payment signatures.
 * Implement this with your preferred wallet library (ethers, viem, etc.).
 * Use accept.maxAmountRequired (atomic units) and accept.asset for the payment.
 */
export interface X402Signer {
    /** The wallet address that will be debited. */
    getAddress(): Promise<string>;
    /** Sign an EIP-712 typed-data payload and return the signature bytes. */
    signPayment(accept: PaymentAccept): Promise<string>;
}

// ---------------------------------------------------------------------------
// Approvals (Human-in-the-loop) — hand-written (not fully in spec yet)
// ---------------------------------------------------------------------------

export interface ApprovalRequest {
    id: string;
    vault_id: string;
    secret_path: string;
    requester_id: string;
    requester_type: string;
    reason?: string;
    status: "pending" | "approved" | "denied";
    decided_by?: string;
    decided_at?: string;
    created_at: string;
}

export interface CreateApprovalRequest {
    vault_id: string;
    secret_path: string;
    reason?: string;
}

export interface ApprovalListResponse {
    approvals: ApprovalRequest[];
}

// ---------------------------------------------------------------------------
// Admin — hand-written (stricter required fields)
// ---------------------------------------------------------------------------

export interface SettingResponse {
    key: string;
    value: string;
    updated_by?: string;
    updated_at: string;
}

export interface SettingsListResponse {
    settings: SettingResponse[];
}

export interface X402ConfigResponse {
    pay_to: string;
    network: string;
    scheme: string;
    free_tier_limit: number;
    facilitator_url: string;
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export interface HealthResponse {
    status: string;
    hsm?: string;
}

// ---------------------------------------------------------------------------
// MCP Tool definitions (SDK-only, not in the API spec)
// ---------------------------------------------------------------------------

export interface McpToolDefinition {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
}

export interface McpToolResult {
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
}
