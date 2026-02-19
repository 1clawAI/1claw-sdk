// ---------------------------------------------------------------------------
// Client configuration
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
}

// ---------------------------------------------------------------------------
// Standard response envelope
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
// Auth
// ---------------------------------------------------------------------------

export interface TokenRequest {
  email: string;
  password: string;
}

export interface AgentTokenRequest {
  agent_id: string;
  api_key: string;
}

export interface UserApiKeyTokenRequest {
  api_key: string;
}

export interface GoogleAuthRequest {
  id_token: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// ---------------------------------------------------------------------------
// API Keys
// ---------------------------------------------------------------------------

export interface CreateApiKeyRequest {
  name: string;
  scopes?: string[];
  expires_at?: string;
}

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
// Vaults
// ---------------------------------------------------------------------------

export interface CreateVaultRequest {
  name: string;
  description?: string;
}

export interface VaultResponse {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_by_type: string;
  created_at: string;
}

export interface VaultListResponse {
  vaults: VaultResponse[];
}

// ---------------------------------------------------------------------------
// Secrets
// ---------------------------------------------------------------------------

export interface PutSecretRequest {
  type: string;
  value: string;
  metadata?: Record<string, unknown>;
  expires_at?: string;
  rotation_policy?: Record<string, unknown>;
  max_access_count?: number;
}

export interface SecretMetadataResponse {
  id: string;
  path: string;
  type: string;
  version: number;
  metadata: Record<string, unknown>;
  created_at: string;
  expires_at?: string;
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
}

export interface SecretListResponse {
  secrets: SecretMetadataResponse[];
}

// ---------------------------------------------------------------------------
// Policies (Access Control)
// ---------------------------------------------------------------------------

export interface CreatePolicyRequest {
  secret_path_pattern: string;
  principal_type: string;
  principal_id: string;
  permissions: string[];
  conditions?: Record<string, unknown>;
  expires_at?: string;
}

export interface UpdatePolicyRequest {
  permissions: string[];
  conditions?: Record<string, unknown>;
  expires_at?: string;
}

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
// Agents
// ---------------------------------------------------------------------------

export interface CreateAgentRequest {
  name: string;
  description?: string;
  auth_method?: string;
  scopes?: string[];
  expires_at?: string;
}

export interface UpdateAgentRequest {
  name?: string;
  scopes?: string[];
  is_active?: boolean;
  expires_at?: string | null;
}

export interface AgentResponse {
  id: string;
  name: string;
  description: string;
  auth_method: string;
  scopes: string[];
  is_active: boolean;
  created_at: string;
  expires_at?: string;
  last_active_at?: string;
}

export interface AgentCreatedResponse {
  agent: AgentResponse;
  api_key: string;
}

export interface AgentListResponse {
  agents: AgentResponse[];
}

export interface AgentKeyRotatedResponse {
  api_key: string;
}

// ---------------------------------------------------------------------------
// Sharing
// ---------------------------------------------------------------------------

export interface CreateShareRequest {
  recipient_type: string;
  recipient_id?: string;
  permissions?: string[];
  max_access_count?: number;
  expires_at: string;
  passphrase?: string;
  ip_allowlist?: string[];
}

export interface ShareResponse {
  id: string;
  share_url: string;
}

// ---------------------------------------------------------------------------
// Organization
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

export interface UpdateMemberRoleRequest {
  role: "owner" | "admin" | "member";
}

// ---------------------------------------------------------------------------
// Billing & Usage
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
// Audit
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
// x402 Payment Protocol
// ---------------------------------------------------------------------------

export interface PaymentAccept {
  scheme: string;
  network: string;
  payTo: string;
  price: string;
  requiredDeadlineSeconds: number;
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
 */
export interface X402Signer {
  /** The wallet address that will be debited. */
  getAddress(): Promise<string>;
  /** Sign an EIP-712 typed-data payload and return the signature bytes. */
  signPayment(requirement: PaymentAccept): Promise<string>;
}

// ---------------------------------------------------------------------------
// Approvals (Human-in-the-loop) — future API
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
// Admin
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
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export interface HealthResponse {
  status: string;
  hsm?: string;
}

// ---------------------------------------------------------------------------
// MCP Tool definitions
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
