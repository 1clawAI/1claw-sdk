// Client
export { OneclawClient, createClient } from "./core/client";

// Core internals (for advanced usage)
export { HttpClient } from "./core/http";

// Resource modules
export { VaultResource } from "./resources/vault";
export { SecretsResource } from "./resources/secrets";
export { AccessResource } from "./resources/access";
export { AgentsResource } from "./resources/agents";
export { SharingResource } from "./resources/sharing";
export { ApprovalsResource } from "./resources/approvals";
export { BillingResource } from "./resources/billing";
export { AuditResource } from "./resources/audit";
export { OrgResource } from "./resources/org";
export { AuthResource, generatePKCE, buildAuthorizeUrl } from "./resources/auth";
export type {
    OAuthTokenRequest,
    OAuthTokenResponse,
} from "./resources/auth";
export { ApiKeysResource } from "./resources/api-keys";
export { ChainsResource } from "./resources/chains";
export { X402Resource } from "./resources/x402";
export { TreasuryResource } from "./resources/treasury";
export type {
    TreasuryListResponse,
    AccessRequestListResponse,
} from "./resources/treasury";
export { SigningKeysResource } from "./resources/signing-keys";
export { PlatformResource, ScopedPlatformClient } from "./resources/platform";
export type {
    PlatformAppStatsResponse,
} from "./resources/platform";
export { TreasuryWalletsResource } from "./resources/treasury-wallets";
export { DevicesResource } from "./resources/devices";
export type {
    RegisterDeviceRequest,
    RegisterDeviceResponse,
    DeviceResponse,
    DeviceListResponse,
    DeviceChallengeRequest,
    DeviceChallengeResponse,
    DeviceAttestRequest,
    DeviceAttestResponse,
    PushTokenRequest,
} from "./resources/devices";
export { PasskeysResource } from "./resources/passkeys";
export type {
    PasskeyRegisterBeginResponse,
    PasskeyRegisterCompleteRequest,
    PasskeyRegisterCompleteResponse,
    PasskeyAssertBeginRequest,
    PasskeyAssertBeginResponse,
    PasskeyAssertCompleteRequest,
    PasskeyAssertCompleteResponse,
    PasskeyResponse,
    PasskeyListResponse,
} from "./resources/passkeys";
export type {
    GenerateTreasuryWalletsRequest,
    TreasuryWalletResponse,
    TreasuryWalletListResponse,
    TreasuryWalletExportResponse,
} from "./resources/treasury-wallets";
export { RiskResource } from "./resources/risk";
export type {
    RiskEvent,
    RiskVerdict,
    Honeytoken,
    CreateHoneytokenRequest,
    ListRiskEventsParams,
} from "./resources/risk";
export { TokensResource } from "./resources/tokens";
export { BindingsResource } from "./resources/bindings";
export { CardsResource } from "./resources/cards";
export { MemoryResource } from "./resources/memory";
export { AutomationsResource } from "./resources/automations";
export { RuntimesResource } from "./resources/runtimes";
export { DiscoveryResource } from "./resources/discovery";
export { ChatResource } from "./resources/chat";
export { ChannelsResource } from "./resources/channels";
export { WebhooksResource } from "./resources/webhooks";
export { OAuthConnectResource } from "./resources/oauth-connect";
export { CedarPoliciesResource } from "./resources/cedar-policies";
export { OpaPoliciesResource } from "./resources/opa-policies";
export { SubOrgsResource } from "./resources/sub-orgs";
export { PortfolioResource } from "./resources/portfolio";
export type { PortfolioParams } from "./resources/portfolio";

// DPoP (Demonstration of Proof-of-Possession)
export { DPoPManager } from "./auth/dpop";

// CMEK (Customer-Managed Encryption Keys)
export {
    generateCmekKey,
    cmekFingerprint,
    cmekEncrypt,
    cmekDecrypt,
    toBase64,
    fromBase64,
} from "./cmek";

// Errors
export {
    OneclawError,
    AuthError,
    ResourceLimitExceededError,
    PaymentRequiredError,
    ApprovalRequiredError,
    NotFoundError,
    RateLimitError,
    ValidationError,
    ServerError,
} from "./core/errors";

// Plugin interfaces
export type {
    CryptoProvider,
    KeyMaterial,
    AuditSink,
    AuditSinkEvent,
    PolicyEngine,
    PolicyContext,
    PolicyDecision,
    PluginRegistry,
} from "./plugins";

// Types
export type {
    OneclawClientConfig,
    OneclawResponse,
    ResponseMeta,
    // Auth
    TokenRequest,
    AgentTokenRequest,
    UserApiKeyTokenRequest,
    GoogleAuthRequest,
    SignupRequest,
    TokenResponse,
    TokenExchangeRequest,
    TokenExchangeResponse,
    ChangePasswordRequest,
    // Account management
    UserProfileResponse,
    UpdateProfileRequest,
    DeleteAccountRequest,
    // API Keys
    CreateApiKeyRequest,
    ApiKeyResponse,
    ApiKeyCreatedResponse,
    ApiKeyListResponse,
    // Vaults
    CreateVaultRequest,
    EnableCmekRequest,
    EnableMpcRequest,
    CmekRotationJobResponse,
    VaultResponse,
    VaultListResponse,
    // Secrets
    PutSecretRequest,
    SecretMetadataResponse,
    SecretResponse,
    SecretListResponse,
    // Policies
    CreatePolicyRequest,
    UpdatePolicyRequest,
    PolicyResponse,
    PolicyListResponse,
    // Agents
    CreateAgentRequest,
    UpdateAgentRequest,
    AgentResponse,
    AgentCreatedResponse,
    AgentListResponse,
    AgentKeyRotatedResponse,
    AgentSelfResponse,
    BatchDeleteAgentsRequest,
    BatchDeleteAgentsResponse,
    // Chains
    ChainResponse,
    ChainListResponse,
    CreateChainRequest,
    UpdateChainRequest,
    // Transactions (Intents API)
    SubmitTransactionRequest,
    SignTransactionRequest,
    SignTransactionResponse,
    SimulateTransactionRequest,
    SimulateBundleRequest,
    SimulateBundleItem,
    SimulationResponse,
    BundleSimulationResponse,
    BalanceChange,
    TransactionResponse,
    TransactionListResponse,
    // Signing Keys (Multi-chain)
    CreateSigningKeyRequest,
    SigningKeyResponse,
    SigningKeyListResponse,
    SigningKeyBalanceResponse,
    // Token Registry
    KnownToken,
    KnownTokenListResponse,
    CreateKnownTokenRequest,
    TokenBalance,
    // Unified Sign Intent
    SignIntentRequest,
    SignIntentResponse,
    // Sharing
    CreateShareRequest,
    ShareResponse,
    SharedSecretResponse,
    // Organization
    OrgMemberResponse,
    OrgMemberListResponse,
    UpdateMemberRoleRequest,
    // Billing
    MonthSummary,
    UsageSummaryResponse,
    UsageEventResponse,
    UsageHistoryResponse,
    // Audit
    AuditQuery,
    AuditEvent,
    AuditEventsResponse,
    // x402
    PaymentAccept,
    PaymentRequirement,
    PaymentPayload,
    PaymentReceipt,
    X402Signer,
    // Approvals
    ApprovalRequest,
    CreateApprovalRequest,
    ApprovalListResponse,
    // Admin
    SettingResponse,
    SettingsListResponse,
    X402ConfigResponse,
    // Shroud Config
    ShroudConfig,
    ToolCallPolicy,
    OutputPolicy,
    SecretInjectionConfig,
    AdvancedRedactionConfig,
    SemanticPolicy,
    UnicodeNormalizationConfig,
    CommandInjectionConfig,
    SocialEngineeringConfig,
    EncodingDetectionConfig,
    NetworkDetectionConfig,
    FilesystemDetectionConfig,
    // Platform API
    CreatePlatformAppRequest,
    UpdatePlatformAppRequest,
    PlatformAppResponse,
    PlatformAppCreatedResponse,
    PlatformAppListResponse,
    CreateTemplateRequest,
    TemplateResponse,
    TemplateListResponse,
    UpsertPlatformUserRequest,
    PlatformUserResponse,
    LinkRequiredInfo,
    PlatformConnectedUserListResponse,
    BootstrapRequest,
    BootstrapResponse,
    ConnectedAppResponse,
    ConnectedAppListResponse,
    ClaimPreviewResponse,
    ClaimRedeemResponse,
    RotatePlatformKeyRequest,
    RotatePlatformKeyResponse,
    PlatformAppStats,
    RotateWebhookSecretResponse,
    // Execution Intents / Bindings
    CredentialSource,
    CreateBindingRequest,
    UpdateBindingRequest,
    BindingResponse,
    BindingListResponse,
    ExecuteRequest,
    ExecuteResponse,
    ExecutionEventResponse,
    ExecutionEventListResponse,
    TestBindingRequest,
    TestBindingResponse,
    // Payment Card Vault
    OrderCardRequest,
    CardResponse,
    CardListResponse,
    CardRevealResponse,
    UpdateCardRequest,
    ImportCardRequest,
    SearchGiftCardsRequest,
    // Memory
    PutMemoryRequest,
    MemoryEntryResponse,
    MemoryEntryListResponse,
    NamespaceListResponse,
    MemorySearchRequest,
    MemorySearchResponse,
    // Automations
    CreateAutomationRequest,
    UpdateAutomationRequest,
    AutomationResponse,
    AutomationListResponse,
    AutomationRunResponse,
    AutomationRunListResponse,
    AutomationRunStatus,
    AutomationPreset,
    AutomationPresetsResponse,
    // Webhooks
    CreateWebhookRequest,
    UpdateWebhookRequest,
    WebhookResponse,
    WebhookListResponse,
    // Runtimes
    CreateRuntimeRequest,
    UpdateRuntimeRequest,
    RuntimeResponse,
    RuntimeListResponse,
    SlugCheckResponse,
    ShellSessionRequest,
    ShellSessionResponse,
    // Discovery
    AgentCardResponse,
    DirectoryEntry,
    DirectoryResponse,
    UpdateDiscoveryRequest,
    MarketplaceAppEntry,
    MarketplaceResponse,
    OrgDirectoryAgent,
    OrgDirectoryResponse,
    OrgDirectoryParams,
    // Platform Delegation
    DelegationLogEntry,
    DelegationLogResponse,
    ConnectionResourcesResponse,
    UpdateConnectionDelegationRequest,
    // Agent Delegations
    CreateDelegationRequest,
    UpdateDelegationRequest,
    DelegationResponse,
    DelegationListResponse,
    // OAuth2
    OAuth2StatusResponse,
    // Chat
    SendChatMessageRequest,
    SendChatMessageResponse,
    ChatConversationResponse,
    ChatConversationListResponse,
    ChatMessageResponse,
    ConversationDetailResponse,
    // Channels
    CreateChannelRequest,
    UpdateChannelRequest,
    ChannelResponse,
    ChannelListResponse,
    SendChannelMessageRequest,
    ChannelMessageResponse,
    ChannelMessageListResponse,
    // OAuth / PKCE
    PKCEPair,
    UserInfoResponse,
    BuildAuthorizeUrlParams,
    OAuthRevokeRequest,
    OAuthRevokeResponse,
    OAuthConsentRevokeResponse,
    // OAuth Connected Accounts
    OAuthProviderScope,
    OAuthProviderResponse,
    OAuthProviderListResponse,
    OAuthConnectionResponse,
    OAuthConnectionListResponse,
    ConnectOAuthRequest,
    ConnectOAuthResponse,
    OAuthAppCredentialResponse,
    OAuthAppCredentialListResponse,
    SaveOAuthAppCredentialsRequest,
    // Policy Engine v2
    PolicyResponseV2,
    ImportKeyRequest,
    // Cedar Policies
    CreateCedarPolicyRequest,
    CedarPolicyResponse,
    CedarPolicyListResponse,
    CedarPolicyTestRequest,
    CedarPolicyTestResponse,
    // OPA Policies
    CreateOpaPolicyRequest,
    OpaPolicyResponse,
    OpaPolicyListResponse,
    OpaPolicyTestRequest,
    OpaPolicyTestResponse,
    // Sub-Organizations
    CreateSubOrgRequest,
    SubOrgResponse,
    SubOrgListResponse,
    SubOrgPermissionRequest,
    SubOrgAddUserRequest,
    SubOrgGenerateWalletsRequest,
    // Portfolio
    PortfolioResponse,
    PortfolioWalletEntry,
    PortfolioTokenBalance,
    // Smart Account Import
    ImportSmartAccountRequest,
    // Health
    HealthResponse,
    // MCP
    McpToolDefinition,
    McpToolResult,
    // Generated OpenAPI types (raw spec access)
    paths,
    components,
    operations,
    ApiSchemas,
} from "./types";
