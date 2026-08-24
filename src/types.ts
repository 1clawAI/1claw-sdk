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
    /** Enable DPoP proof-of-possession (default: false). */
    dpop?: boolean;
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

// RFC 8693 token-exchange (OIDC federation, e.g. Anthropic WIF).
export interface TokenExchangeRequest {
    /** Required `aud` value for the federation token (e.g. `https://api.anthropic.com`). */
    audience: string;
    /**
     * Optional 1claw subject token. When omitted, the SDK uses the current
     * client token (or `apiKey`) as the subject_token automatically.
     */
    subjectToken?: string;
    /**
     * Optional space-separated subset of scopes. Cannot escalate beyond
     * the agent's existing scopes.
     */
    scope?: string;
}

export interface TokenExchangeResponse {
    access_token: string;
    issued_token_type: string;
    token_type: string;
    expires_in: number;
    scope?: string;
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
    effect?: "allow" | "deny";
    priority?: number;
    attribute_conditions?: Record<string, unknown>;
    consensus_trigger?: ConsensusTrigger;
    tx_conditions?: TxConditions;
    policy_schema_version?: number;
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
    tx_max_value?: string;
    tx_daily_limit?: string;
    /** @deprecated Use tx_max_value — same native major-unit semantics. */
    tx_max_value_eth?: string;
    /** @deprecated Use tx_daily_limit. */
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
    /** ISO 8601 expiration timestamp for the agent's API key. Null = never expires. */
    api_key_expires_at?: string | null;
    tx_token_allowlist?: string[];
    tx_known_tokens_only?: boolean;
    xrpl_allowed_tx_types?: string[];
    per_chain_guardrails?: Record<string, {
        max_value?: string;
        daily_limit?: string;
        to_allowlist?: string[];
        token_allowlist?: string[];
        max_per_day?: number;
        overhead_budget?: string;
        max_ata_creates_per_day?: number;
    }>;
    execution_intents_enabled?: boolean;
    execution_guardrails?: Record<string, unknown>;
    intents_require_tee?: boolean;
    execution_require_tee?: boolean;
    tx_max_per_day?: number | null;
    tx_overhead_budget?: Record<string, string> | null;
    solana_ata_allowlist?: string[];
    /** Whether this agent may order payment cards (x402 card ordering). Pro+ tier. */
    cards_enabled?: boolean;
    /** Maximum USD amount for a single card order. */
    card_max_order_usd?: string;
    /** Maximum cumulative USD spent ordering cards per rolling 24h window. */
    card_daily_limit_usd?: string;
    /** Allowed x402 payTo recipients for card orders (empty = built-in Laso recipients). */
    card_payto_allowlist?: string[];
    /** Whether agents may reveal card details subject to per-card reveal policy. */
    card_reveal_enabled?: boolean;
    /** When true, card orders route through the approval queue before payment. Default on. */
    card_require_approval?: boolean;
}

export interface UpdateAgentRequest {
    name?: string;
    description?: string;
    scopes?: string[];
    is_active?: boolean;
    intents_api_enabled?: boolean;
    tx_to_allowlist?: string[];
    tx_max_value?: string | null;
    tx_daily_limit?: string | null;
    /** @deprecated Use tx_max_value. */
    tx_max_value_eth?: string | null;
    /** @deprecated Use tx_daily_limit. */
    tx_daily_limit_eth?: string | null;
    tx_allowed_chains?: string[];
    token_ttl_seconds?: number | null;
    vault_ids?: string[];
    shroud_enabled?: boolean;
    shroud_config?: ShroudConfig | null;
    expires_at?: string | null;
    /** Chains this agent may create signing keys for (e.g. ["evm", "solana"]). */
    signing_chains?: string[];
    /** Allowed EIP-712 domain names/verifyingContract pairs for typed-data signing. */
    eip712_domain_allowlist?: string[];
    /** Default policy when an EIP-712 domain is not in the allowlist: "allow" | "block". */
    eip712_default_policy?: "allow" | "block";
    /** Whether personal_sign / message signing is enabled for this agent. */
    message_signing_enabled?: boolean;
    /**
     * Whether the raw/precomputed-digest signing intent ("eip712_digest") is
     * enabled. This is blind signing and bypasses transaction guardrails — only
     * enable for trusted agents needing ERC-1271/ERC-7739 flows (e.g. Polymarket).
     */
    raw_signing_enabled?: boolean;
    /** ISO 8601 expiration timestamp for the agent's API key. Null = never expires. */
    api_key_expires_at?: string | null;
    tx_token_allowlist?: string[];
    tx_known_tokens_only?: boolean;
    xrpl_allowed_tx_types?: string[];
    per_chain_guardrails?: Record<string, {
        max_value?: string;
        daily_limit?: string;
        to_allowlist?: string[];
        token_allowlist?: string[];
        max_per_day?: number;
        overhead_budget?: string;
        max_ata_creates_per_day?: number;
    }> | null;
    execution_intents_enabled?: boolean;
    execution_guardrails?: Record<string, unknown> | null;
    intents_require_tee?: boolean;
    execution_require_tee?: boolean;
    tx_max_per_day?: number | null;
    tx_overhead_budget?: Record<string, string> | null;
    solana_ata_allowlist?: string[];
    /** Whether this agent may order payment cards (x402 card ordering). Pro+ tier. */
    cards_enabled?: boolean;
    /** Maximum USD amount for a single card order. `null` clears. */
    card_max_order_usd?: string | null;
    /** Maximum cumulative USD spent ordering cards per rolling 24h window. `null` clears. */
    card_daily_limit_usd?: string | null;
    /** Allowed x402 payTo recipients for card orders (empty = built-in Laso recipients). */
    card_payto_allowlist?: string[];
    /** Whether agents may reveal card details subject to per-card reveal policy. */
    card_reveal_enabled?: boolean;
    /** When true, card orders route through the approval queue before payment. */
    card_require_approval?: boolean;
    /** Approved policy_change id when resuming a queued guardrail widening. */
    approval_id?: string;
}

export interface AgentResponse {
    id: string;
    name: string;
    description: string;
    auth_method: "api_key" | "mtls" | "oidc_client_credentials";
    scopes: string[];
    is_active: boolean;
    intents_api_enabled: boolean;
    tx_to_allowlist?: string[];
    tx_max_value?: string;
    tx_daily_limit?: string;
    /** @deprecated Use tx_max_value — same native major-unit semantics. */
    tx_max_value_eth?: string;
    /** @deprecated Use tx_daily_limit. */
    tx_daily_limit_eth?: string;
    tx_spent_today?: string;
    /** @deprecated Use tx_spent_today or tx_spent_today_by_chain. */
    tx_spent_today_eth?: string;
    tx_token_allowlist?: string[];
    tx_known_tokens_only?: boolean;
    xrpl_allowed_tx_types?: string[];
    per_chain_guardrails?: Record<string, unknown>;
    tx_spent_today_by_chain?: Record<string, string>;
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
    /** Chains this agent may create signing keys for (e.g. ["evm", "solana"]). */
    signing_chains?: string[];
    /** Allowed EIP-712 domain names/verifyingContract pairs for typed-data signing. */
    eip712_domain_allowlist?: string[];
    /** Default policy when an EIP-712 domain is not in the allowlist. */
    eip712_default_policy?: "allow" | "block";
    /** Whether personal_sign / message signing is enabled for this agent. */
    message_signing_enabled?: boolean;
    /** Whether the raw/precomputed-digest signing intent is enabled (blind signing). */
    raw_signing_enabled?: boolean;
    /** ISO 8601 expiration timestamp for the agent's API key. Null = never expires. */
    api_key_expires_at?: string | null;
    /** Agent's Ethereum EOA address (used as Safe signer for smart accounts). */
    evm_address?: string | null;
    /** Per-chain smart accounts (Safe multisigs) registered for this agent. */
    smart_accounts?: AgentSmartAccount[];
    /** Legacy single Smart Account address (prefer smart_accounts[]). */
    smart_account_address?: string | null;
    /** Legacy single Smart Account chain name. */
    smart_account_chain?: string | null;
    /** Legacy single Smart Account chain ID. */
    smart_account_chain_id?: number | null;
    execution_intents_enabled?: boolean;
    execution_guardrails?: Record<string, unknown>;
    intents_require_tee?: boolean;
    execution_require_tee?: boolean;
    /** Max transactions per UTC calendar day. Null = unlimited. */
    tx_max_per_day?: number | null;
    /** Per-chain daily overhead budget in native units (rent, fees, energy). */
    tx_overhead_budget?: Record<string, string> | null;
    /** Solana wallet addresses whose ATAs may be created. Empty = unrestricted. */
    solana_ata_allowlist?: string[];
    /** Today's transaction count (UTC calendar day). Present when intents_api_enabled. */
    tx_count_today?: number;
    /** Today's overhead spend by chain in native units. */
    tx_overhead_today_by_chain?: Record<string, string>;
    /** Whether this agent may order payment cards (x402 card ordering). */
    cards_enabled?: boolean;
    /** Maximum USD amount for a single card order. */
    card_max_order_usd?: string;
    /** Maximum cumulative USD spent ordering cards per rolling 24h window. */
    card_daily_limit_usd?: string;
    /** Allowed x402 payTo recipients for card orders (empty = built-in Laso recipients). */
    card_payto_allowlist?: string[];
    /** Whether agents may reveal card details subject to per-card reveal policy. */
    card_reveal_enabled?: boolean;
    /** When true, card orders route through the approval queue before payment. */
    card_require_approval?: boolean;
    created_at: string;
    expires_at?: string;
    last_active_at?: string;
}

// ---------------------------------------------------------------------------
// Payment Card Vault
// ---------------------------------------------------------------------------

/** Order a prepaid or gift card via the x402 flow. */
export interface OrderCardRequest {
    /** "prepaid" or "gift_card". */
    kind: "prepaid" | "gift_card";
    /** USD amount to load onto the card. */
    amount_usd: string;
    /** Optional Laso gift-card server/brand id (gift cards only). */
    laso_server_id?: string;
    /** Optional country (prepaid cards; defaults to US). */
    country?: string;
}

/** Masked card view — never contains PAN/CVV. */
export interface CardResponse {
    id: string;
    agent_id?: string | null;
    issuer: "laso" | "manual";
    kind: "prepaid" | "gift_card";
    brand?: string;
    last4?: string;
    exp_month?: number;
    exp_year?: number;
    currency: string;
    order_amount_usd?: string;
    balance?: string;
    status:
        | "ordering"
        | "pending"
        | "ready"
        | "depleted"
        | "expired"
        | "voided"
        | "orphaned_payment"
        | "awaiting_approval"
        | "rejected";
    storage_mode: "reference" | "full";
    reveal_policy: Record<string, unknown>;
    approval_id?: string;
    void_after?: string;
    created_at: string;
    updated_at: string;
}

export interface CardListResponse {
    cards: CardResponse[];
}

/** Revealed card details — sensitive. Returned only by the reveal endpoint. */
export interface CardRevealResponse {
    id: string;
    pan?: string;
    cvv?: string;
    exp_month?: number;
    exp_year?: number;
    brand?: string;
    /** Gift-card redemption payload (URL/code/PIN) when applicable. */
    redemption?: unknown;
    /** Post-reveal disclaimer surfaced to the caller. */
    disclaimer: string;
}

/** Human-settable per-card reveal policy + lifecycle controls. */
export interface UpdateCardRequest {
    /** Whether the owning agent may reveal this card (subject to max/TTL). */
    agent_reveal?: boolean;
    /** Maximum number of reveals allowed. */
    max_reveals?: number;
    /** Reveal policy expiry (ISO 8601; null clears). */
    reveal_expires_at?: string | null;
    /** Auto-void timestamp — blocks reveals/refreshes after this time (null clears). */
    void_after?: string | null;
}

/** Manually import an existing card (human-only, full storage mode). */
export interface ImportCardRequest {
    pan: string;
    cvv: string;
    exp_month: number;
    exp_year: number;
    brand?: string;
    currency?: string;
    balance?: string;
    agent_id?: string;
}

/** Search available Laso gift-card brands/servers. */
export interface SearchGiftCardsRequest {
    query?: string;
    country?: string;
}

// ---------------------------------------------------------------------------
// Execution Intents — Bindings & Execution
// ---------------------------------------------------------------------------

/** Credential source: inline value (copied into __agent-keys) or a live
 *  pointer to an existing vault secret (resolved at execution time). */
export interface CredentialSource {
    type: "inline" | "vault_ref";
    /** For inline: the credential value object. */
    value?: Record<string, unknown>;
    /** For vault_ref: the vault containing the referenced secret. */
    vault_id?: string;
    /** For vault_ref: the secret path in the vault. */
    path?: string;
}

export interface CreateBindingRequest {
    name: string;
    binding_type: string;
    config?: Record<string, unknown>;
    guardrails?: Record<string, unknown>;
    /** Legacy: inline credential value (still supported). */
    credential?: Record<string, unknown>;
    /** Structured credential source (takes precedence over `credential`). */
    credential_source?: CredentialSource;
}

export interface UpdateBindingRequest {
    config?: Record<string, unknown>;
    guardrails?: Record<string, unknown>;
    is_active?: boolean;
    /** Legacy: inline credential value. */
    credential?: Record<string, unknown>;
    /** Structured credential source (takes precedence over `credential`). */
    credential_source?: CredentialSource;
    /** Approved policy_change id when resuming a queued guardrail widening. */
    approval_id?: string;
}

/** Rotate (overwrite) a binding's stored credential without touching config. */
export interface RotateCredentialRequest {
    credential: Record<string, unknown> | string;
}

export interface BindingResponse {
    id: string;
    agent_id: string;
    binding_type: string;
    name: string;
    config: Record<string, unknown>;
    guardrails: Record<string, unknown>;
    is_active: boolean;
    /** Whether a credential is stored. The value itself is never returned. */
    credential_set?: boolean;
    /** How the credential is sourced: "inline" or "vault_ref". */
    credential_source_type?: "inline" | "vault_ref" | null;
    /** For vault_ref: the vault ID containing the referenced secret. */
    credential_vault_id?: string | null;
    /** For vault_ref: the secret path in the referenced vault. */
    credential_path?: string | null;
    created_at: string;
    updated_at: string;
}

export interface BindingListResponse {
    bindings: BindingResponse[];
}

export interface ExecuteRequest {
    binding: string;
    intent_type: string;
    execution_mode?: "vault" | "tee";
    params: Record<string, unknown>;
}

export interface ExecuteResponse {
    execution_id: string;
    status: string;
    result?: Record<string, unknown>;
    error?: string;
    duration_ms?: number;
    redactions_applied?: number;
    /** Where the intent ran: "vault" or "tee". Reported truthfully. */
    execution_surface?: string;
}

export interface ExecutionEventResponse {
    id: string;
    agent_id: string;
    binding_id: string;
    intent_type: string;
    execution_mode: string;
    status: string;
    request_summary?: Record<string, unknown>;
    result_summary?: Record<string, unknown>;
    error_message?: string;
    duration_ms?: number;
    cost_cents?: number;
    redactions_applied?: number;
    created_at: string;
}

export interface ExecutionEventListResponse {
    events: ExecutionEventResponse[];
}

export interface TestBindingRequest {
    timeout_ms?: number;
}

export interface TestBindingResponse {
    success: boolean;
    latency_ms: number;
    error?: string;
}

export interface AgentCreatedResponse {
    agent: AgentResponse;
    /** Only present for api_key auth method */
    api_key?: string;
}

export interface AgentSmartAccount {
    chain: string;
    chain_id: number;
    safe_address: string;
    nonce?: number;
    init_data?: string;
}

export interface AddSmartAccountRequest {
    chain: string;
    chain_id: number;
    safe_address: string;
    nonce?: number;
    init_data?: string;
}

export interface GenerateEoaResponse {
    evm_address: string;
}

export interface RotateSignerKeyResponse {
    new_evm_address: string;
}

// ── Bankr Dynamic Key Vending ──

export interface LeaseBankrKeyRequest {
    wallet_id?: string;
    ttl_seconds?: number;
    permissions?: {
        llm_gateway_enabled?: boolean;
        agent_api_enabled?: boolean;
        read_only?: boolean;
    };
}

export interface LeaseBankrKeyResponse {
    lease_id: string;
    /** Present for human callers only; omitted for agent JWTs (key stored for Shroud resolution). */
    api_key?: string;
    wallet_id: string;
    expires_at: string;
}

export interface BankrKeyLease {
    id: string;
    wallet_id: string;
    bankr_key_id: string;
    permissions: Record<string, unknown>;
    expires_at: string;
    created_at: string;
}

export interface BankrKeyLeaseListResponse {
    leases: BankrKeyLease[];
}

export interface AgentListResponse {
    agents: AgentResponse[];
}

export interface AgentKeyRotatedResponse {
    api_key: string;
}

export interface BatchDeleteAgentsRequest {
    agent_ids: string[];
}

export interface BatchDeleteAgentsResponse {
    deleted: number;
    failed: number;
    errors: { id: string; reason: string }[];
}

export type EnrollAgentRequest = ApiSchemas["EnrollAgentRequest"];
export type EnrollAgentResponse = ApiSchemas["EnrollAgentResponse"];

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
    /** Transaction mode: "eoa" (default), "smart_account" (ERC-4337), or "treasury" (treasury delegation). */
    mode?: "eoa" | "smart_account" | "treasury";
    /** Treasury ID for mode "treasury". Routes signing through treasury delegation. */
    treasury_id?: string;
    /** When true, submits as a gasless (sponsored) transaction via ERC-4337 paymaster. */
    gasless?: boolean;

    // ── Non-EVM chain fields (Bitcoin, Solana, XRP, Cardano, Tron) ──
    /** XRP: destination tag for exchange deposits. */
    destination_tag?: number;
    /** XRP / Solana: optional memo. */
    memo?: string;
    /** Bitcoin: override the fetched fee rate (sat/vByte). */
    fee_rate_sat_per_vbyte?: number;
    /** Tron: TRC-20 energy fee limit in sun. */
    fee_limit_sun?: number;
    /** Solana (SPL) / Tron (TRC-20): token mint or contract address; omit for native transfer. */
    token_mint?: string;
    /** Solana / Tron: token decimals (default 6). */
    token_decimals?: number;
    /** Cardano: transaction time-to-live (absolute slot). */
    ttl?: number;
    /**
     * Raw XRPL transaction JSON for full transaction type coverage.
     * When present (and chain is XRP), the handler uses the xrpl-rust binary
     * codec to sign the transaction as-is. Supports all XRPL transaction types:
     * Payment, TrustSet, OfferCreate, NFTokenMint, AMMCreate, EscrowCreate, etc.
     * Account, Sequence, Fee, LastLedgerSequence, and SigningPubKey are auto-filled.
     */
    xrpl_tx_json?: Record<string, unknown>;
    /** Pending approval ID — resubmit with this after consensus approval is executed. */
    approval_id?: string;
    /** Pre-built raw transaction as a base64-encoded byte string for deep-inspect before signing. */
    raw_transaction?: string;
    /** Pre-built Tron transaction JSON object for full Tron transaction type coverage. */
    tron_transaction?: Record<string, unknown>;
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

    // ── Non-EVM chain fields (Bitcoin, Solana, XRP, Cardano, Tron) ──
    /** XRP: destination tag for exchange deposits. */
    destination_tag?: number;
    /** XRP / Solana: optional memo. */
    memo?: string;
    /** Bitcoin: override the fetched fee rate (sat/vByte). */
    fee_rate_sat_per_vbyte?: number;
    /** Tron: TRC-20 energy fee limit in sun. */
    fee_limit_sun?: number;
    /** Solana (SPL) / Tron (TRC-20): token mint or contract address; omit for native transfer. */
    token_mint?: string;
    /** Solana / Tron: token decimals (default 6). */
    token_decimals?: number;
    /** Cardano: transaction time-to-live (absolute slot). */
    ttl?: number;
    /** Raw XRPL transaction JSON for full transaction type coverage. */
    xrpl_tx_json?: Record<string, unknown>;
    /** Pre-built raw transaction as a base64-encoded byte string for deep-inspect before signing. */
    raw_transaction?: string;
    /** Pre-built Tron transaction JSON object for full Tron transaction type coverage. */
    tron_transaction?: Record<string, unknown>;
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
// Signing Keys (Multi-chain) — hand-written
// ---------------------------------------------------------------------------

export interface CreateSigningKeyRequest {
    chain: string;
}

export interface SigningKeyResponse {
    id: string;
    agent_id: string;
    chain: string;
    curve: string;
    public_key: string;
    address?: string;
    key_version: number;
    is_active: boolean;
    created_at: string;
    rotated_at?: string;
}

export interface SigningKeyListResponse {
    keys: SigningKeyResponse[];
}

export interface SigningKeyExportResponse {
    chain: string;
    curve: string;
    public_key: string;
    address?: string;
    private_key: string;
    key_version: number;
    agent_id: string;
}

// ---------------------------------------------------------------------------
// Unified Sign Intent — hand-written
// ---------------------------------------------------------------------------

export interface SignIntentRequest {
    intent_type: "personal_sign" | "typed_data" | "eip712_digest" | "transaction";
    chain: string;
    /** Raw message bytes (hex) or UTF-8 string for personal_sign. */
    message?: string;
    /** EIP-712 typed data object for typed_data signing. */
    typed_data?: unknown;
    /**
     * Client-computed 32-byte digest (0x-prefixed) for `eip712_digest` signing.
     * The server signs it directly (blind signing) — requires the agent's
     * `raw_signing_enabled` flag. Use for ERC-1271/ERC-7739 nested EIP-712
     * flows (e.g. Polymarket) where the canonical hash is computed client-side.
     */
    hash?: string;
    /** EVM tx type: 0 (legacy), 1 (EIP-2930), 2 (EIP-1559), 3 (EIP-4844), 4 (EIP-7702). */
    tx_type?: number;
    to?: string;
    value?: string;
    data?: string;
    nonce?: number;
    gas_limit?: number;
    gas_price?: string;
    max_fee_per_gas?: string;
    max_priority_fee_per_gas?: string;
    /** EIP-2930 / EIP-1559+ access list. */
    access_list?: Array<{ address: string; storage_keys: string[] }>;
    /** EIP-4844 max fee per blob gas. */
    max_fee_per_blob_gas?: string;
    /** EIP-4844 blob versioned hashes. */
    blob_versioned_hashes?: string[];
    /** EIP-7702 authorization list. */
    authorization_list?: unknown;
    signing_key_path?: string;

    // ── Non-EVM chain fields (Bitcoin, Solana, XRP, Cardano, Tron) ──
    /** XRP: destination tag for exchange deposits. */
    destination_tag?: number;
    /** XRP / Solana: optional memo. */
    memo?: string;
    /** Bitcoin: override the fetched fee rate (sat/vByte). */
    fee_rate_sat_per_vbyte?: number;
    /** Tron: TRC-20 energy fee limit in sun. */
    fee_limit_sun?: number;
    /** Solana (SPL) / Tron (TRC-20): token mint or contract address; omit for native transfer. */
    token_mint?: string;
    /** Solana / Tron: token decimals (default 6). */
    token_decimals?: number;
    /** Cardano: transaction time-to-live (absolute slot). */
    ttl?: number;
    /** When true, sign only (do not broadcast). Non-EVM transaction intents only. */
    sign_only?: boolean;
    /**
     * Raw XRPL transaction JSON for full transaction type coverage.
     * When present (and chain is XRP), the handler uses the xrpl-rust binary
     * codec to sign the transaction as-is. Supports all XRPL transaction types:
     * Payment, TrustSet, OfferCreate, NFTokenMint, AMMCreate, EscrowCreate, etc.
     * Account, Sequence, Fee, LastLedgerSequence, and SigningPubKey are auto-filled.
     */
    xrpl_tx_json?: Record<string, unknown>;
    /** Pending approval ID — resubmit with this after consensus approval is executed. */
    approval_id?: string;
    /** Pre-built raw transaction as a base64-encoded byte string for deep-inspect before signing. */
    raw_transaction?: string;
    /** Pre-built Tron transaction JSON object for full Tron transaction type coverage. */
    tron_transaction?: Record<string, unknown>;
}

export interface SignIntentResponse {
    intent_type: "personal_sign" | "typed_data" | "eip712_digest" | "transaction";
    chain: string;
    from: string;
    signature?: string;
    signed_tx?: string;
    tx_hash?: string;
    message_hash?: string;
    typed_data_hash?: string;
    tx_type?: number;
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
    active_subscription_count?: number;
    subscription_ids?: string[];
    warning?: string;
}

export interface LlmCheckoutResponse {
    checkout_url?: string;
    already_subscribed?: boolean;
    subscription_id?: string;
}

export interface LlmCancelDuplicatesResponse {
    cancelled_count: number;
    cancelled_subscription_ids: string[];
    remaining_subscription_ids: string[];
    failed_subscription_ids?: string[];
    warning?: string;
}

export interface LlmDisableResponse {
    enabled: boolean;
    subscriptions_found: number;
    subscriptions_cancelled: number;
    cancelled_subscription_ids?: string[];
    failed_subscription_ids?: string[];
    warning?: string;
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

export interface AuditVerifyQuery {
    from?: string;
    to?: string;
    limit?: number;
}

export interface AuditVerifyResponse {
    chain_valid: boolean;
    events_verified: number;
    events_checked: number;
    broken_at_event_id?: string | null;
    scheme: {
        algorithm?: string;
        chain_structure?: string;
        hash_field?: string;
        link_field?: string;
        documentation?: string;
    };
}

export interface ShroudAttestationResponse {
    attested: boolean;
    /** Granularity: none | identity | confidential | sev_snp */
    attestation_level: "none" | "identity" | "confidential" | "sev_snp";
    image_hash: string;
    identity_token: string;
    confidential_claims?: ConfidentialClaims | null;
    verification: {
        steps?: string[];
        google_certs_url?: string;
        expected_audience?: string;
    };
}

export interface ConfidentialClaims {
    secboot?: boolean;
    hwmodel?: string;
    instance_confidentiality?: string;
    sw_name?: string;
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
    action: string;
    target_type: string;
    target_id: string;
    summary: Record<string, unknown>;
    reason?: string;
    risk_tier?: number;
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
// GDPR Data Export
// ---------------------------------------------------------------------------

export interface ExportDataResponse {
    export_version: string;
    exported_at: string;
    user: Record<string, unknown>;
    vaults: Record<string, unknown>[];
    agents: Record<string, unknown>[];
    secrets_metadata: Record<string, unknown>[];
    policies: Record<string, unknown>[];
}

// ---------------------------------------------------------------------------
// Platform API
// ---------------------------------------------------------------------------

export interface CreatePlatformAppRequest {
    name: string;
    slug: string;
    description?: string;
    oidc_jwks_url?: string;
    oidc_issuer?: string;
    oidc_audience?: string;
    redirect_uris?: string[];
    billing_model?: string;
    auth_mode?: string;
    max_connected_users?: number;
    /** ISO 8601 expiration timestamp for the platform app's API key. Null = never expires. */
    api_key_expires_at?: string | null;
}

export interface UpdatePlatformAppRequest {
    name?: string;
    description?: string;
    logo_url?: string;
    oidc_jwks_url?: string;
    oidc_issuer?: string;
    oidc_audience?: string;
    redirect_uris?: string[];
    webhook_url?: string;
    billing_model?: string;
    auth_mode?: string;
    max_connected_users?: number | null;
    is_active?: boolean;
    /** ISO 8601 expiration timestamp for the platform app's API key. Null = never expires. */
    api_key_expires_at?: string | null;
}

export interface PlatformAppResponse {
    id: string;
    name: string;
    slug: string;
    description: string;
    logo_url?: string;
    api_key_prefix: string;
    oidc_jwks_url?: string;
    oidc_issuer?: string;
    oidc_audience?: string;
    redirect_uris: string[];
    webhook_url?: string;
    is_active: boolean;
    billing_model: string;
    auth_mode: string;
    max_connected_users?: number;
    connected_users: number;
    /** ISO 8601 expiration timestamp for the platform app's API key. Null = never expires. */
    api_key_expires_at?: string | null;
    /** ISO 8601 timestamp of the last API key rotation. */
    api_key_rotated_at?: string | null;
    created_at: string;
    updated_at: string;
}

export interface PlatformAppCreatedResponse extends PlatformAppResponse {
    api_key: string;
}

export interface RotatePlatformKeyRequest {
    /** ISO 8601 expiration timestamp for the new API key. Omit or null for no expiration. */
    api_key_expires_at?: string | null;
}

export interface RotatePlatformKeyResponse {
    api_key: string;
    api_key_prefix: string;
    api_key_expires_at?: string | null;
}

export interface PlatformAppStats {
    total_connections: number;
    active_connections: number;
    claimed_connections: number;
    total_bootstraps: number;
    total_grants: number;
}

export interface RotateWebhookSecretResponse {
    webhook_secret: string;
}

export interface PlatformAppListResponse {
    apps: PlatformAppResponse[];
}

export interface CreateTemplateRequest {
    name: string;
    description?: string;
    spec: Record<string, unknown>;
}

export interface TemplateResponse {
    id: string;
    platform_app_id: string;
    name: string;
    description: string;
    version: number;
    spec: Record<string, unknown>;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface TemplateListResponse {
    templates: TemplateResponse[];
}

export interface UpsertPlatformUserRequest {
    subject_token?: string;
    subject_token_type?: string;
    email?: string;
    display_name?: string;
}

export interface LinkRequiredInfo {
    status: "link_required";
    reason: string;
    authorize_url: string;
    app_slug: string;
}

export interface PlatformUserResponse {
    user_handle?: string;
    is_new: boolean;
    connection_id?: string;
    email?: string;
    link_required?: LinkRequiredInfo;
}

export interface PlatformConnectedUserResponse {
    connection_id: string;
    user_id: string;
    external_subject: string;
    status: string;
    vault_ids: string[];
    agent_ids: string[];
    created_at: string;
    claimed_at?: string;
}

export interface PlatformConnectedUserListResponse {
    users: PlatformConnectedUserResponse[];
}

export interface BootstrapRequest {
    template_id?: string;
    return_to?: string;
}

export interface BootstrapSigningKey {
    chain: string;
    curve: string;
    public_key: string;
    address: string;
}

export interface BootstrapResponse {
    claim_url: string;
    claim_token: string;
    expires_in: number;
    connection_id: string;
    summary: {
        vault_id?: string;
        agent_id?: string;
        agent_ids?: string[];
        policy_ids: string[];
        signing_key_chains?: string[];
        agent_api_key?: string;
        signing_keys?: BootstrapSigningKey[];
        agent_evm_address?: string;
        runtime_ids?: string[];
        automation_ids?: string[];
    };
}

export interface ReissueClaimRequest {
    return_to?: string;
}

export interface ReissueClaimResponse {
    claim_url: string;
    claim_token: string;
    expires_in: number;
    connection_id: string;
}

export interface ConnectedAppResponse {
    connection_id: string;
    app_name: string;
    app_slug: string;
    app_logo_url?: string;
    status: string;
    created_at: string;
    claimed_at?: string;
}

export interface ConnectedAppListResponse {
    apps: ConnectedAppResponse[];
}

export interface GrantResourcesRequest {
    vault_ids: string[];
    agent_ids: string[];
    allowed_paths?: string[];
    permissions?: string[];
    expires_at?: string;
}

export interface GrantResponse {
    id: string;
    vault_id: string;
    allowed_paths: string[];
    permissions: string[];
    expires_at?: string;
    created_at: string;
}

export interface GrantResourcesResponse {
    connection_id: string;
    grants: GrantResponse[];
    vault_ids: string[];
    agent_ids: string[];
}

export interface GrantListResponse {
    grants: GrantResponse[];
}

export interface ClaimPreviewResponse {
    app_name: string;
    app_slug: string;
    app_logo_url: string | null;
    auth_mode: string;
    vault_ids: string[];
    agent_ids: string[];
    policy_count: number;
    status: string;
    already_claimed: boolean;
    expired: boolean;
    return_to: string | null;
}

export interface ClaimRedeemResponse {
    status: string;
    connection_id: string;
    vault_ids: string[];
    agent_ids: string[];
    return_to: string | null;
    dashboard_url: string;
}

// ---------------------------------------------------------------------------
// OAuth / PKCE helpers
// ---------------------------------------------------------------------------

export interface PKCEPair {
    codeVerifier: string;
    codeChallenge: string;
}

export interface UserInfoResponse {
    sub: string;
    email?: string;
    name?: string;
    wallet_address?: string;
}

export interface BuildAuthorizeUrlParams {
    clientId: string;
    redirectUri: string;
    scopes?: string[];
    state?: string;
    codeChallenge?: string;
    codeChallengeMethod?: "S256";
    responseType?: "code";
}

export interface OAuthRevokeRequest {
    token: string;
    token_type_hint?: "access_token" | "refresh_token";
}

export interface OAuthRevokeResponse {
    revoked: boolean;
}

export interface OAuthConsentRevokeResponse {
    revoked: boolean;
    app_id: string;
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

// ---------------------------------------------------------------------------
// Token Registry
// ---------------------------------------------------------------------------

export interface KnownToken {
    id: string;
    chain: string;
    symbol: string;
    name: string;
    contract_address: string;
    decimals: number;
    is_testnet: boolean;
    is_verified: boolean;
    logo_url?: string | null;
    created_at: string;
    updated_at: string;
}

export interface KnownTokenListResponse {
    tokens: KnownToken[];
}

export interface CreateKnownTokenRequest {
    chain: string;
    symbol: string;
    name: string;
    contract_address: string;
    decimals: number;
    is_testnet?: boolean;
    is_verified?: boolean;
    logo_url?: string | null;
}

export interface TokenBalance {
    contract_address: string;
    symbol?: string | null;
    balance: string;
    decimals?: number | null;
}

export interface SigningKeyBalanceResponse {
    chain: string;
    address: string;
    balance_wei: string;
    balance_display: string;
    tokens?: TokenBalance[];
}

// ---------------------------------------------------------------------------
// Memory — per-agent key-value storage with namespaces and optional TTL
// ---------------------------------------------------------------------------

export interface PutMemoryRequest {
    value: unknown;
    ttl_seconds?: number;
}

export interface MemoryEntryResponse {
    id: string;
    agent_id: string;
    namespace: string;
    key: string;
    value: unknown;
    ttl_expires_at?: string;
    created_at: string;
    updated_at: string;
}

export interface MemoryEntryListResponse {
    entries: MemoryEntryResponse[];
}

export interface NamespaceListResponse {
    namespaces: string[];
}

export interface MemorySearchRequest {
    namespace: string;
    query: string;
    top_k?: number;
}

export interface MemorySearchResponse {
    results: Array<{
        key: string;
        value: unknown;
        score: number;
        namespace: string;
    }>;
}

// ---------------------------------------------------------------------------
// Automations — scheduled / event-driven / webhook-triggered agent workflows
// ---------------------------------------------------------------------------

/** Single workflow step (backend accepts flexible JSON per step type). */
export type WorkflowStep = Record<string, unknown>;

/**
 * Workflow definition: bare step array or `{ steps: [...] }` (dashboard/preset shape).
 * Matches OpenAPI CreateAutomationRequest.workflow_spec.
 */
export type WorkflowSpec = WorkflowStep[] | { steps: WorkflowStep[] };

export interface CreateAutomationRequest {
    name: string;
    agent_id: string;
    trigger_type: "cron" | "event" | "webhook" | "manual" | "schedule";
    cron_expr?: string;
    timezone?: string;
    event_filter?: Record<string, unknown>;
    workflow_spec: WorkflowSpec;
}

export interface UpdateAutomationRequest {
    name?: string;
    cron_expr?: string | null;
    timezone?: string;
    event_filter?: Record<string, unknown> | null;
    workflow_spec?: WorkflowSpec;
    is_active?: boolean;
}

export interface AutomationResponse {
    id: string;
    agent_id: string;
    name: string;
    trigger_type: string;
    cron_expr?: string;
    timezone: string;
    event_filter?: Record<string, unknown>;
    workflow_spec: WorkflowSpec;
    is_active: boolean;
    last_run_at?: string;
    next_run_at?: string;
    created_at: string;
    updated_at: string;
    /** One-time on create (webhook trigger) — `whk_…` */
    webhook_token?: string;
    /** Public trigger URL including token — only on create/rotate */
    webhook_url?: string;
    /** Status of the most recent run (enriched list). */
    last_run_status?: string | null;
    /** Total runs in the last 30 days (enriched list). */
    total_runs?: number | null;
    /** Success rate percentage (enriched list). */
    success_rate?: number | null;
    /** Agent display name (enriched list). */
    agent_name?: string | null;
}

export interface AutomationListResponse {
    automations: AutomationResponse[];
}

export interface AutomationRunResponse {
    id: string;
    automation_id: string;
    agent_id: string;
    status: string;
    step_results?: unknown;
    error?: string;
    trigger_source?: string;
    started_at: string;
    finished_at?: string;
    tokens_used: number;
    cost_cents: number;
}

export interface AutomationRunListResponse {
    runs: AutomationRunResponse[];
}

export type AutomationRunStatus = 'running' | 'success' | 'failed' | 'timed_out' | 'cancelled' | 'awaiting_approval';

export interface AutomationPreset {
    id: string;
    name: string;
    description?: string;
    trigger_type: string;
    cron_expr?: string | null;
    workflow_spec: WorkflowSpec;
}

export interface AutomationPresetsResponse {
    presets: AutomationPreset[];
}

// ---------------------------------------------------------------------------
// Webhooks — event notification system
// ---------------------------------------------------------------------------

export interface CreateWebhookRequest {
    url: string;
    events: string[];
    secret?: string;
}

export interface UpdateWebhookRequest {
    url?: string;
    events?: string[];
    is_active?: boolean;
}

export interface WebhookResponse {
    id: string;
    org_id: string;
    url: string;
    events: string[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface WebhookListResponse {
    webhooks: WebhookResponse[];
}

// ---------------------------------------------------------------------------
// Runtimes — managed compute environments for agent code execution
// ---------------------------------------------------------------------------

export interface CreateRuntimeRequest {
    name: string;
    agent_id: string;
    template?: string;
    preset?: string;
    image?: string;
    env_public?: Record<string, string>;
    idle_timeout_secs?: number;
    expose_http?: boolean;
    http_port?: number;
    slug?: string;
    inbound_auth?: "api_key" | "jwt" | "public";
    shell_access_enabled?: boolean;
    shell_auth_policy?: string;
    shell_max_session_minutes?: number;
}

export interface UpdateRuntimeRequest {
    name?: string;
    env_public?: Record<string, string>;
    idle_timeout_secs?: number;
    image?: string;
    expose_http?: boolean;
    http_port?: number;
    slug?: string;
    inbound_auth?: "api_key" | "jwt" | "public";
    shell_access_enabled?: boolean;
    shell_auth_policy?: string;
    shell_max_session_minutes?: number;
}

export interface RuntimeResponse {
    id: string;
    agent_id: string;
    name: string;
    template?: string;
    preset: string;
    provider: string;
    status: string;
    image?: string;
    env_public?: Record<string, string>;
    idle_timeout_secs: number;
    last_activity_at?: string;
    trial_hours_used?: number;
    monthly_hours_used?: number;
    expose_http: boolean;
    slug?: string;
    public_url?: string;
    http_port?: number;
    inbound_auth: string;
    shell_access_enabled?: boolean;
    shell_auth_policy?: string;
    shell_max_session_minutes?: number;
    created_at: string;
    updated_at: string;
}

export interface RuntimeListResponse {
    runtimes: RuntimeResponse[];
}

export interface ShellSessionRequest {
    password?: string;
    totp_code?: string;
    passkey_credential?: Record<string, unknown>;
    /** Single-use `rat_` token from POST /v1/auth/reauth (purpose runtime_shell). */
    reauth_token?: string;
}

export interface ShellSessionResponse {
    session_token: string;
    ws_url: string;
    expires_in: number;
    runtime_id: string;
    max_session_minutes: number;
    /** Sidecar PTY id for reconnect/reattach */
    session_id?: string;
}

export interface RuntimeChatRequest {
    message?: string;
    messages?: Array<Record<string, unknown>>;
    model?: string;
    provider?: string;
    stream?: boolean;
}

// ---------------------------------------------------------------------------
// Discovery — agent cards, directory, and marketplace
// ---------------------------------------------------------------------------

export interface AgentCardResponse {
    id: string;
    name: string;
    description: string;
    tags: string[];
    a2a_url?: string;
    mcp_url?: string;
    capabilities: string[];
}

export interface DirectoryEntry {
    id: string;
    name: string;
    description: string;
    tags: string[];
    a2a_url?: string;
    mcp_url?: string;
    capabilities: string[];
}

export interface DirectoryResponse {
    agents: DirectoryEntry[];
    total: number;
    page: number;
    page_size: number;
}

export interface UpdateDiscoveryRequest {
    discoverable?: boolean;
    public_description?: string;
    public_tags?: string[];
}

export interface OrgDirectoryAgent {
    id: string;
    name: string;
    public_description?: string | null;
    public_tags: string[];
    a2a_url?: string | null;
    mcp_url?: string | null;
    intents_api_enabled: boolean;
    execution_intents_enabled: boolean;
    memory_enabled: boolean;
    shroud_enabled: boolean;
}

export interface OrgDirectoryResponse {
    agents: OrgDirectoryAgent[];
    total: number;
    page: number;
    page_size: number;
}

export interface OrgDirectoryParams {
    q?: string;
    tags?: string;
    page?: number;
    page_size?: number;
}

export interface MarketplaceAppEntry {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logo_url?: string;
    category?: string;
    listing_tags: string[];
    listing_screenshots: string[];
    pricing_summary?: string;
}

export interface MarketplaceResponse {
    apps: MarketplaceAppEntry[];
}

export interface SlugCheckResponse {
    slug: string;
    available: boolean;
}

// ---------------------------------------------------------------------------
// Platform Delegation (Phase 11)
// ---------------------------------------------------------------------------

export interface DelegationLogEntry {
    id: string;
    connection_id: string;
    platform_app_id: string;
    actor_id: string;
    action: string;
    resource_type: string | null;
    resource_id: string | null;
    success: boolean;
    error: string | null;
    created_at: string;
}

export interface DelegationLogResponse {
    entries: DelegationLogEntry[];
    total: number;
}

export interface ConnectionResourcesResponse {
    vaults: Array<{ id: string; name: string }>;
    agents: Array<{ id: string; name: string }>;
    policies: Array<{ id: string }>;
    automations: Array<{ id: string; name: string }>;
    runtimes: Array<{ id: string; agent_id: string; preset: string }>;
}

export interface UpdateConnectionDelegationRequest {
    delegation_enabled?: boolean;
    delegation_scopes?: string[];
}

// ---------------------------------------------------------------------------
// OAuth2 Credential Bindings
// ---------------------------------------------------------------------------

export interface OAuth2StatusResponse {
    connected: boolean;
    needs_reauth: boolean;
    scopes: string[];
    provider?: string;
    expires_at?: string;
}

// ---------------------------------------------------------------------------
// Agent Chat
// ---------------------------------------------------------------------------

export interface SendChatMessageRequest {
    message: string;
    conversation_id?: string;
    mode?: string;
    model?: string;
    provider?: string;
    system_prompt?: string;
}

export interface ChatMessageResponse {
    id: string;
    conversation_id: string;
    role: string;
    content: string;
    tool_calls?: unknown;
    tool_results?: unknown;
    tokens_prompt: number;
    tokens_completion: number;
    model?: string;
    created_at: string;
}

export interface ChatConversationResponse {
    id: string;
    agent_id: string;
    title?: string;
    mode: string;
    model?: string;
    provider?: string;
    created_at: string;
    updated_at: string;
}

export interface ChatConversationListResponse {
    conversations: ChatConversationResponse[];
}

export interface ConversationDetailResponse {
    conversation: ChatConversationResponse;
    messages: ChatMessageResponse[];
}

export interface SendChatMessageResponse {
    conversation_id: string;
    message: ChatMessageResponse;
}

// ---------------------------------------------------------------------------
// Agent Channels (Telegram, WhatsApp, Discord)
// ---------------------------------------------------------------------------

export interface CreateChannelRequest {
    channel_type: string;
    channel_name?: string;
    config: Record<string, string>;
    slash_commands_enabled?: boolean;
    voice_transcription_enabled?: boolean;
}

export interface UpdateChannelRequest {
    channel_name?: string;
    is_active?: boolean;
    config?: Record<string, string>;
    slash_commands_enabled?: boolean;
    voice_transcription_enabled?: boolean;
    auto_respond_enabled?: boolean;
    sender_allowlist?: string[];
}

export interface ChannelResponse {
    id: string;
    org_id: string;
    agent_id: string;
    channel_type: string;
    channel_name?: string;
    webhook_path?: string;
    webhook_url?: string;
    webhook_secret?: string | null;
    is_active: boolean;
    slash_commands_enabled?: boolean;
    voice_transcription_enabled?: boolean;
    unified_conversation_id?: string | null;
    is_home_platform?: boolean;
    sender_allowlist?: string[] | null;
    auto_respond_enabled?: boolean;
    metadata?: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
}

export interface ChannelListResponse {
    channels: ChannelResponse[];
}

export interface SendChannelMessageRequest {
    external_chat_id: string;
    content: string;
    reply_to?: string;
}

export interface ChannelMessageResponse {
    id: string;
    channel_id: string;
    direction: string;
    external_chat_id: string;
    external_message_id?: string;
    sender_name?: string;
    content: string;
    media_url?: string;
    is_voice_message?: boolean;
    voice_file_id?: string | null;
    voice_duration_secs?: number | null;
    transcription_status?: 'pending' | 'completed' | 'failed' | null;
    created_at: string;
}

export interface ChannelMessageListResponse {
    messages: ChannelMessageResponse[];
}

// ---------------------------------------------------------------------------
// OAuth Connected Accounts
// ---------------------------------------------------------------------------

export interface OAuthProviderScope {
    scope: string;
    label: string;
    description: string;
    default: boolean;
}

export interface OAuthProviderResponse {
    slug: string;
    display_name: string;
    icon_url: string | null;
    authorization_url: string;
    token_url: string;
    scopes_available: OAuthProviderScope[];
    default_scopes: string[];
    extra_auth_params: Record<string, string>;
    requires_app_credentials: boolean;
    documentation_url: string | null;
}

export interface OAuthProviderListResponse {
    providers: OAuthProviderResponse[];
}

export interface OAuthConnectionResponse {
    binding_id: string;
    provider_slug: string;
    provider_name: string;
    scopes: string[];
    status: string;
    needs_reauth: boolean;
    created_at: string;
}

export interface OAuthConnectionListResponse {
    connections: OAuthConnectionResponse[];
}

export interface ConnectOAuthRequest {
    provider_slug: string;
    scopes?: string[];
    redirect_after?: string;
}

export interface ConnectOAuthResponse {
    authorization_url: string;
}

export interface OAuthAppCredentialResponse {
    id: string;
    provider_slug: string;
    client_id: string;
    redirect_uri: string | null;
    created_at: string;
    updated_at: string;
}

export interface OAuthAppCredentialListResponse {
    credentials: OAuthAppCredentialResponse[];
}

export interface SaveOAuthAppCredentialsRequest {
    provider_slug: string;
    client_id: string;
    client_secret: string;
    redirect_uri?: string;
}

// ---------------------------------------------------------------------------
// Agent Delegations
// ---------------------------------------------------------------------------

export interface CreateDelegationRequest {
    delegate_id: string;
    allowed_tools?: string[];
    blocked_tools?: string[];
    max_daily_delegations?: number;
    max_depth?: number;
    guardrails?: Record<string, unknown>;
    delegation_mode?: 'caller' | 'target' | 'both';
    expires_at?: string;
}

export interface UpdateDelegationRequest {
    allowed_tools?: string[];
    blocked_tools?: string[];
    max_daily_delegations?: number;
    max_depth?: number;
    guardrails?: Record<string, unknown>;
    delegation_mode?: 'caller' | 'target' | 'both';
    is_active?: boolean;
    expires_at?: string;
}

export interface DelegationResponse {
    id: string;
    org_id: string;
    delegator_id: string;
    delegate_id: string;
    delegator_name?: string;
    delegate_name?: string;
    allowed_tools: string[];
    blocked_tools: string[];
    max_daily_delegations?: number;
    max_depth: number;
    guardrails: Record<string, unknown>;
    delegation_mode: string;
    is_active: boolean;
    created_by: string;
    expires_at?: string;
    created_at: string;
    updated_at: string;
    delegations_today?: number;
}

export interface DelegationListResponse {
    delegations: DelegationResponse[];
}

// ---------------------------------------------------------------------------
// Policy Engine v2
// ---------------------------------------------------------------------------

export interface PolicyResponseV2 extends PolicyResponse {
    effect: "allow" | "deny";
    priority: number;
    attribute_conditions: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Key Import
// ---------------------------------------------------------------------------

export interface ImportKeyRequest {
    private_key: string;
    format?: "hex" | "base64" | "wif";
}

// ---------------------------------------------------------------------------
// Cedar Policies
// ---------------------------------------------------------------------------

export interface CreateCedarPolicyRequest {
    policy_text: string;
    description?: string;
}

export interface CedarPolicyResponse {
    id: string;
    policy_text: string;
    description?: string;
    created_at: string;
    created_by: string;
}

export interface CedarPolicyListResponse {
    policies: CedarPolicyResponse[];
}

export interface CedarPolicyTestRequest {
    principal: string;
    action: string;
    resource: string;
    context?: Record<string, unknown>;
}

export interface CedarPolicyTestResponse {
    decision: "allow" | "deny";
    reasons: string[];
}

// ---------------------------------------------------------------------------
// OPA Policies
// ---------------------------------------------------------------------------

export interface CreateOpaPolicyRequest {
    rego_module: string;
    description?: string;
    data?: Record<string, unknown>;
}

export interface OpaPolicyResponse {
    id: string;
    rego_module: string;
    description?: string;
    data?: Record<string, unknown>;
    created_at: string;
    created_by: string;
}

export interface OpaPolicyListResponse {
    policies: OpaPolicyResponse[];
}

export interface OpaPolicyTestRequest {
    input: Record<string, unknown>;
    data?: Record<string, unknown>;
}

export interface OpaPolicyTestResponse {
    result: Record<string, unknown>;
    decision: "allow" | "deny";
}

// ---------------------------------------------------------------------------
// Sub-Organizations
// ---------------------------------------------------------------------------

export interface CreateSubOrgRequest {
    name: string;
    description?: string;
    billing_model?: "inherit" | "independent";
}

export interface SubOrgResponse {
    id: string;
    parent_org_id: string;
    name: string;
    description?: string;
    billing_model: string;
    status: "active" | "archived";
    created_at: string;
}

export interface SubOrgListResponse {
    sub_orgs: SubOrgResponse[];
}

export interface SubOrgPermissionRequest {
    permission: string;
    resource_ids?: string[];
}

export interface SubOrgAddUserRequest {
    user_id: string;
    role?: "admin" | "member" | "viewer";
}

export interface SubOrgGenerateWalletsRequest {
    chains?: string[];
}

// ---------------------------------------------------------------------------
// Portfolio
// ---------------------------------------------------------------------------

export interface PortfolioResponse {
    wallets: PortfolioWalletEntry[];
    total_usd_estimate?: string;
}

export interface PortfolioWalletEntry {
    wallet_type: "treasury" | "signing_key" | "smart_account";
    chain: string;
    address: string;
    native_balance: string;
    native_balance_usd?: string;
    tokens?: PortfolioTokenBalance[];
}

export interface PortfolioTokenBalance {
    contract_address: string;
    symbol: string;
    name?: string;
    balance: string;
    balance_usd?: string;
    decimals: number;
}

// ---------------------------------------------------------------------------
// Smart Account Import
// ---------------------------------------------------------------------------

export interface ImportSmartAccountRequest {
    chain: string;
    chain_id: number;
    safe_address: string;
    verify?: boolean;
}

// ---------------------------------------------------------------------------
// Policy Backend Settings (Cedar/OPA Enforcement v2)
// ---------------------------------------------------------------------------

export interface PolicyBackendSettings {
    backend: "builtin" | "cedar" | "opa" | "builtin+cedar" | "builtin+opa";
    mode: "shadow" | "enforce";
    scope: string[];
    breaker_behavior: "fail_closed" | "fail_open_builtin";
}

export interface UpdatePolicyBackendSettingsRequest {
    backend?: "builtin" | "cedar" | "opa" | "builtin+cedar" | "builtin+opa";
    mode?: "shadow" | "enforce";
    scope?: string[];
    breaker_behavior?: "fail_closed" | "fail_open_builtin";
}

export interface ShadowReportResponse {
    concordance_rate: number;
    total_evaluated: number;
    divergent_count: number;
    sample_events: ShadowDivergenceEvent[];
}

export interface ShadowDivergenceEvent {
    timestamp: string;
    action: string;
    principal_type: string;
    principal_id: string;
    resource: string;
    builtin_decision: string;
    backend_decision: string;
    reason?: string;
}

// ---------------------------------------------------------------------------
// Contract ABI Registry
// ---------------------------------------------------------------------------

export interface CreateContractAbiRequest {
    chain: string;
    contract_address: string;
    abi_json: unknown;
    name?: string;
    description?: string;
    token_decimals?: number;
    interface_kind?: "evm_abi" | "solana_idl";
}

export interface ContractAbiResponse {
    id: string;
    org_id: string;
    chain: string;
    contract_address: string;
    abi_json: unknown;
    name?: string;
    description?: string;
    token_decimals?: number;
    interface_kind?: "evm_abi" | "solana_idl";
    created_at: string;
}

export interface ContractAbiListResponse {
    abis: ContractAbiResponse[];
}

// ---------------------------------------------------------------------------
// Pending Approvals (Consensus Policies)
// ---------------------------------------------------------------------------

export interface SubmitPendingApprovalRequest {
    policy_id: string;
    action: string;
    action_payload: Record<string, unknown>;
}

export interface PendingApprovalResponse {
    id: string;
    org_id: string;
    policy_id: string;
    action: string;
    action_payload: Record<string, unknown>;
    status: "pending" | "approved" | "rejected" | "executed" | "expired" | "cancelled";
    submitted_by: string;
    submitted_by_type: string;
    required_approvals: number;
    current_approvals: number;
    signatures: PendingApprovalSignature[];
    expires_at?: string;
    created_at: string;
    updated_at: string;
}

export interface PendingApprovalSignature {
    signer_id: string;
    signer_type: string;
    decision: "approve" | "reject";
    payload_hash: string;
    reason?: string;
    created_at: string;
}

export interface PendingApprovalListResponse {
    pending_approvals: PendingApprovalResponse[];
}

export interface ApprovePendingApprovalRequest {
    decision: "approve" | "reject";
    payload_hash: string;
    reason?: string;
    credential_type?: "password" | "passkey" | "totp" | "biometric" | "api_key";
}

// ---------------------------------------------------------------------------
// Consensus Trigger (on Access Policies) — from generated spec
// ---------------------------------------------------------------------------

export type ConsensusTrigger = ApiSchemas["ConsensusTrigger"];
export type ConsensusCondition = ApiSchemas["ConsensusCondition"];
export type ApprovalRequirement = ApiSchemas["ApprovalRequirement"];

// ---------------------------------------------------------------------------
// Policy Engine v2 — hand-written types for new fields (v0.49)
// ---------------------------------------------------------------------------

/** Flat condition set used by consensus composability (skip_when / require_when). */
export interface FlatConditionSet {
    value_above?: string;
    chain_in?: string[];
    to_address_in?: string[];
    function_selector_in?: string[];
    erc20_amount_above?: string;
    intent_type_in?: string[];
    always?: boolean;
}

/** Signing-time conditions on access policies (all tiers). */
export interface TxConditions {
    match_mode?: "all" | "any";
    function_name_in?: string[];
    function_selector_in?: string[];
    erc20_amount_above?: string;
    value_above?: string;
    to_address_in?: string[];
    chain_in?: string[];
    intent_type_in?: string[];
    decode_failed?: boolean;
    program_id_in?: string[];
    eip712_primary_type_in?: string[];
    eip712_verifying_contract_in?: string[];
    eip712_domain_name_in?: string[];
    eip712_domain_chain_id_in?: number[];
    eip7702_authorized_addresses_in?: string[];
    deep_inspect?: boolean;
}

/** Time window condition for policy evaluation. */
export interface TimeWindow {
    start_hour?: number;
    end_hour?: number;
    days_of_week?: number[];
    timezone?: string;
    cron_expr?: string;
}

// ---------------------------------------------------------------------------
// Wallet Access Policies (v0.53.1)
// ---------------------------------------------------------------------------

export interface WalletAccessPolicy {
    id: string;
    org_id: string;
    wallet_chain: string;
    target_agent_id?: string;
    target_user_id?: string;
    permissions: string[];
    conditions?: WalletAccessConditions;
    expires_at?: string;
    created_at: string;
}

export interface WalletAccessConditions {
    max_value_per_tx_eth?: string;
    daily_limit_eth?: string;
    allowed_chains?: string[];
    allowed_tokens?: string[];
}

export interface CreateWalletAccessPolicyRequest {
    wallet_chain: string;
    target_agent_id?: string;
    target_user_id?: string;
    permissions: string[];
    conditions?: WalletAccessConditions;
    expires_at?: string;
}

// ---------------------------------------------------------------------------
// Credential Recovery (v0.53.1)
// ---------------------------------------------------------------------------

export interface CredentialRecoveryRequest {
    request_id: string;
    status: string;
    recovery_type: string;
    reason?: string;
    approved_at?: string;
    executable_after?: string;
    created_at: string;
}

export interface CreateRecoveryRequest {
    recovery_type: "mfa_reset" | "passkey_reset" | "password_reset";
    reason?: string;
}

export interface RecoveryPolicy {
    enabled: boolean;
    require_admin_approval: boolean;
    delay_hours: number;
    allowed_types: string[];
}

// ---------------------------------------------------------------------------
// Shamir KEK (v0.53.1)
// ---------------------------------------------------------------------------

export interface ShamirKekStatus {
    configured: boolean;
    kek_id?: string;
    threshold?: number;
    total_shares?: number;
    custody_mode?: string;
    custodians?: { email: string; share_provided: boolean }[];
    created_at?: string;
}

export interface SetupShamirRequest {
    threshold: number;
    total_shares: number;
    custodian_emails: string[];
}

export interface ShamirSetupResponse {
    kek_id: string;
    threshold: number;
    total_shares: number;
    shares: { index: number; custodian_email: string; share_b64: string }[];
    custody_mode: string;
    created_at: string;
}
