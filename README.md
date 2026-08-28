# @1claw/sdk (v0.59.4)

> ⭐ **Star [1clawAI/agent-templates](https://github.com/1clawAI/agent-templates)** — ready-to-run agent templates wired to 1Claw. It is our single starred repo.

TypeScript/JavaScript client for the 1Claw Vault API.

This is the official SDK for Node.js, Next.js, and browser apps that call 1Claw over HTTP. It covers vaults, secrets, agents, policies, treasury, Intents API signing, execution bindings, platform apps, billing, and x402 payments. Types are generated from the OpenAPI spec, so request shapes stay in sync with the API.

Agent keys auto-exchange for JWTs and refresh before expiry. If you're wiring an AI agent in Cursor or Claude Desktop, you probably want [@1claw/mcp](https://www.npmjs.com/package/@1claw/mcp) instead. If you're building a web app or backend service in TypeScript, start here.

## Install

```bash
npm install @1claw/sdk
```

**Note:** This package is **ESM-only**. Use it in an ESM context (e.g. `"type": "module"` in `package.json`, or `.mjs` files). Next.js and other bundlers handle ESM natively. Running scripts with plain `node` or `tsx` may require an ESM setup to avoid `ERR_PACKAGE_PATH_NOT_EXPORTED`.

## Quick Start

```typescript
import { createClient } from "@1claw/sdk";

const client = createClient({
    baseUrl: "https://api.1claw.co",
    apiKey: "ocv_...", // auto-exchanges for a JWT
});

// List vaults
const { data } = await client.vault.list();
console.log(data?.vaults);

// Store a secret
await client.secrets.set("vault-id", "OPENAI_KEY", "sk-...", {
    type: "api_key",
});

// Retrieve a secret
const secret = await client.secrets.get("vault-id", "OPENAI_KEY");
console.log(secret.data?.value);
```

**API contract:** This SDK is built from the **OpenAPI 3.1** spec. The canonical spec is published as [@1claw/openapi-spec](https://www.npmjs.com/package/@1claw/openapi-spec) (YAML/JSON). Types are generated with `npm run generate` (`openapi-typescript ../openapi-spec/openapi.yaml`). Run `generate` after spec changes, then `npm run build`. Shapes such as `LlmTokenBillingStatus` (including optional `credit_balance` and `billing_cycle_usage.metered_lines`) come from the generated `api-types.ts`. For a full endpoint list, see the [API reference](https://docs.1claw.co/docs/reference/api-reference) or the spec.

## Authentication

Agent JWTs issued by `POST /v1/auth/agent-token` may include optional claims such as `shroud_enabled` and **`shroud_config`** (when Shroud is on for that agent). Those are for services like **Shroud** that verify the JWT; the TypeScript SDK uses the token for Vault API calls and does not need to read `shroud_config` unless you build custom tooling.

The SDK supports three authentication modes:

```typescript
// 1. User API key (auto-authenticates)
const client = createClient({
    baseUrl: "https://api.1claw.co",
    apiKey: "ocv_...",
});

// 2. Agent with API key (auto-authenticates as agent)
const agent = createClient({
    baseUrl: "https://api.1claw.co",
    apiKey: "ocv_...",
    agentId: "agent-uuid",
});

// 3. Pre-authenticated JWT
const authed = createClient({
    baseUrl: "https://api.1claw.co",
    token: "eyJ...",
});

// Or authenticate manually:
await client.auth.login({ email: "...", password: "..." });
await client.auth.agentToken({ agent_id: "...", api_key: "..." });
await client.auth.google({ id_token: "..." });

// Password reset (public; no Bearer token — use a client without stored JWT)
await client.auth.forgotPassword({ email: "user@example.com" });
await client.auth.resetPassword({ token: "...", new_password: "..." });

// Set password (platform OIDC users who don't have one)
await client.auth.setPassword({ password: "...", password_confirm: "..." });

// Change email (sends verification code to new address)
await client.auth.changeEmail({ new_email: "new@example.com" });
await client.auth.verifyEmailChange({ code: "123456" });
```

## API Resources

| Resource           | Methods                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `client.vault`     | `create`, `get`, `list`, `delete`, `enableMpc`, `disableMpc`                                                        |
| `client.secrets`   | `set`, `get`, `delete`, `list`, `rotate`                                                                            |
| `client.access`    | `grantHuman`, `grantAgent`, `update`, `revoke`, `listGrants`                                                        |
| `client.agents`    | `enroll` (also `AgentsResource.enroll(baseUrl, …)` static), `create`, `getSelf`, `get`, `list`, `update`, `delete`, `rotateKey`, `generateEoa`, `createSmartAccount`, `deleteSmartAccount`, `rotateSigner`, `submitTransaction`, `signTransaction`, `getTransaction`, `listTransactions`, `simulateTransaction`, `simulateBundle`, `sign`, `createDelegation`, `listDelegations`, `getDelegation`, `updateDelegation`, `revokeDelegation`, `getEffectiveDelegations` |
| `client.chains`    | `list`, `get`, `adminList`, `create`, `update`, `delete`                                                            |
| `client.sharing`   | `create`, `access`, `listOutbound`, `listInbound`, `accept`, `decline`, `revoke`                                    |
| `client.approvals` | `request`, `list`, `approve`, `deny`, `check`, `subscribe`                                                          |
| `client.billing`   | `usage`, `history`, `llmTokenBilling`, `subscribeLlmTokenBilling`, `disableLlmTokenBilling` (LLM token billing / Stripe AI Gateway) |
| `client.audit`     | `query`                                                                                                             |
| `client.org`       | `listMembers`, `getAgentKeysVault`, `getOnboardingStatus`, `provisionOnboarding`, `updateMemberRole`, `removeMember` |
| `client.auth`      | `login`, `signup`, `agentToken`, `apiKeyToken`, `google`, `socialLogin`, `sendEmailOtp`, `verifyEmailOtp`, `exchangeOAuthCode`, `revokeToken`, `revokeConsent`, `getUserInfo`, `changePassword`, `setPassword`, `changeEmail`, `verifyEmailChange`, `forgotPassword`, `resetPassword`, `exportData`, `exchangeFederatedToken`, `logout`, `getMe`, `updateMe`, `deleteMe` |
| `client.apiKeys`   | `create`, `list`, `revoke`                                                                                          |
| `client.treasury`  | `create`, `list`, `get`, `update`, `delete`, `addSigner`, `removeSigner`, `requestAccess`, `listAccessRequests`, `approveAccess`, `denyAccess`, `propose`, `listProposals`, `getProposal`, `signProposal`, `executeProposal` |
| `client.treasuryWallets` | `generateWallets`, `listWallets`, `getWallet`, `getWalletBalance`, `sendFromWallet`, `swapFromWallet`, `exportWallet`, `rotateWallet`, `deactivateWallet`, `getEffectiveSpendPolicy` |
| `client.depositDestinations` | `create`, `list`, `get`, `update` |
| `client.internalAccounts` | `create`, `list`, `get`, `transfer`, `getLedger` |
| `client.fiat` | `createOnrampSession`, `initiateOfframp` |
| `client.signingKeys` | `create`, `list`, `rotate`, `deactivate`, `export`                                                               |
| `client.agents` (Bankr) | `leaseBankrKey`, `listBankrKeys`, `revokeBankrKey` — privileged; `api_key` omitted for agent JWTs (use Shroud) |
| `client.platform`  | `createApp`, `listApps`, `getApp`, `updateApp`, `deleteApp`, `rotateKey`, `rotateWebhookSecret`, `getAppStats`, `marketplace`, `createTemplate`, `listTemplates`, `getTemplate`, `upsertUser`, `listUsers`, `bootstrapUser`, `reissueClaim`, `claimPreview`, `claimRedeem`, `listConnectedApps`, `disconnectApp`, `grantAccess`, `listGrants`, `revokeGrant`, `createSpendPolicy`, `listSpendPolicies`, `setUserSpendPolicy`, `deleteSpendPolicy`, `updateConnectionDelegation`, **`siweChallenge`**, **`getConnection`**, **`getConnectionUsage`**, **`listEntitlements`**, **`refreshEntitlements`**, **`previewTemplate`**, **`transferAppOwnership`**, **`getSpendPolicy`**, **`getConnectionSpendPolicy`**, **`listConnectionApprovals`**, **`getConnectionApproval`**, **`listConnectionPendingApprovals`**, **`createConnectionPendingApproval`**, **`getConnectionPendingApproval`**, **`decideConnectionPendingApproval`**, **`decideConnectionApproval`**, **`createConnectionRuntime`**, **`getConnectionRuntime`**, **`connectionPasskeyEnrollBegin`**, **`connectionPasskeyEnrollComplete`**, **`connectionAgentChat`**, **`listConnectionSigningKeys`**, **`getConnectionSigningKey`**, **`deactivateConnectionSigningKey`**, **`patchConnectionAgent`**, **`getConnectionPortfolio`**, **`getConnectionBalances`**, **`listConnectionAutomations`**, **`createConnectionAutomation`**, **`cancelConnectionAutomationRun`**, **`getConnectionMemory`**, **`putConnectionMemory`**, **`deleteConnectionMemory`** |
| `client.treasuryWallets` | … **`getInferenceBudget`** (platform-connected users) |
| `client.bindings`  | `create`, `list`, `get`, `update`, `delete`, `test`, `execute`, `rotateCredential`, `listExecutions` |
| `client.chat`      | `sendMessage`, `sendMessageStream`, `listConversations`, `getConversation`, `deleteConversation` |
| `client.channels`  | `create`, `list`, `update`, `delete`, `send`, `test`, `refreshWebhook`, `listMessages` |
| `client.oauthConnect` | `listProviders`, `listConnections`, `connect`, `disconnect`, `saveAppCredentials`, `listAppCredentials`, `deleteAppCredentials` |
| `client.cedarPolicies` | `create`, `list`, `get`, `delete`, `test` |
| `client.opaPolicies` | `create`, `list`, `get`, `delete`, `test` |
| `client.contractAbis` | `upload`, `list`, `delete` |
| `client.pendingApprovals` | `list`, `get`, `approve`, `execute`, `cancel` |
| `client.subOrgs`   | `create`, `list`, `get`, `delete`, `grantPermission`, `revokePermission`, `addUser`, `generateWallets` |
| `client.portfolio` | `get` |
| `client.cards`     | `order`, `orderGiftCard`, `searchGiftCards`, `list`, `get`, `reveal`, `update`, `void`, `refresh`, `import` |
| `client.devices`   | `register`, `list`, `delete`, `challenge`, `attest`, `setPushToken`                                                 |
| `client.passkeys`  | `list`, `registerBegin`, `registerComplete`, `assertBegin`, `assertComplete`, `delete`                               |
| `client.risk`      | `listEvents`, `getVerdict`, `listVerdicts`, `createHoneytoken`, `listHoneytokens`, `deleteHoneytoken`                |
| `client.webhooks`  | `create`, `list`, `get`, `update`, `delete`                                                                          |
| `client.memory`    | `put`, `get`, `list`, `delete`, `search`, `listNamespaces`, `deleteNamespace`                                         |
| `client.automations` | `create`, `list`, `get`, `update`, `delete`, `trigger`, `listRuns`                                                 |
| `client.runtimes`  | `create`, `list`, `get`, `update`, `delete`, `start`, `stop`, `logs`, `checkSlug`                                    |
| `client.discovery` | `getAgentCard`, `directory`, `updateDiscovery`, `marketplace`                                                        |
| `client.envVars`   | `list`, `create`, `get`, `update`, `delete`, `resolve`                                                              |
| `client.x402`      | `getPaymentRequirement`, `pay`, `verifyReceipt`, `withPayment`                                                      |

**Platform bootstrap response:** `bootstrapUser()` returns a `summary` object containing `agent_api_key` (one-time, not retrievable later) and `signing_keys[]` (with chain, address, and public_key for each provisioned key).

### Environment Variables

Manage per-vault environment variables with environment scoping (production, preview, development) and precedence-based resolution:

```typescript
// List env vars for a vault
const { env_vars } = await client.envVars.list(vaultId);

// Create an env var
const envVar = await client.envVars.create(vaultId, {
  key: "DATABASE_URL",
  value: "postgres://...",
  environments: ["production", "preview"],
  sensitive: true,
});

// Get a specific env var
const dbUrl = await client.envVars.get(vaultId, "DATABASE_URL");

// Update an env var
await client.envVars.update(vaultId, "DATABASE_URL", {
  value: "postgres://new-host/...",
});

// Resolve env vars (the final KEY=VALUE set with precedence)
const { vars, sources } = await client.envVars.resolve(vaultId, "production");

// Delete an env var
await client.envVars.delete(vaultId, "DATABASE_URL");
```

### Agent Environment Tagging (v0.52)

Tag agents with a named environment for policy scoping and env var resolution:

```typescript
// Create an agent tagged for preview deployments
await client.agents.create({
  name: "preview-bot",
  environment: "preview",
  env_auto_resolve: true,
});

// Update environment and per-environment guardrails
await client.agents.update(agentId, {
  environment: "production",
  environment_locked: true,
  per_environment_guardrails: {
    production: { max_value: "1.0", daily_limit: "10.0" },
    preview: { max_value: "0.1", daily_limit: "1.0" },
  },
});

// Resolve env vars — when env_auto_resolve is true on the agent JWT,
// omit environment and the server uses the agent's tag
const { vars } = await client.envVars.resolve(vaultId);
```

Agent JWTs include an `environment` claim when set. Policy conditions support `environment_in` for environment-scoped access.

**Agent create response:** `agents.create()` returns `{ agent: AgentResponse, api_key?: string }`. The `api_key` is only present for `auth_method: "api_key"` and is shown once — use `data.agent.id` and `data.api_key` from the response.

**Access grants:** `grantAgent(vaultId, agentId, permissions, options?)` — positional args; options include `secretPathPattern`, `conditions`, `expires_at`.

## Response Envelope

All methods return a typed envelope:

```typescript
interface OneclawResponse<T> {
    data: T | null;
    error: { type: string; message: string; detail?: string } | null;
    meta?: { status: number };
}
```

Check `error` before accessing `data`:

```typescript
const res = await client.secrets.get("vault-id", "key");
if (res.error) {
    console.error(res.error.type, res.error.message);
} else {
    console.log(res.data.value);
}
```

## Error Types

The SDK exports a typed error hierarchy for catch-based flows:

| Error                   | HTTP Status | Description                                           |
| ----------------------- | ----------- | ----------------------------------------------------- |
| `OneclawError`          | any         | Base error class                                      |
| `AuthError`             | 401, 403    | Authentication/authorization failure                  |
| `PaymentRequiredError`  | 402         | x402 payment required (includes `paymentRequirement`) |
| `ResourceLimitExceededError` | 403    | Tier limit reached (vaults, agents, secrets)          |
| `ApprovalRequiredError` | 403         | Human approval gate triggered                         |
| `NotFoundError`         | 404         | Resource not found                                    |
| `RateLimitError`        | 429         | Rate limit exceeded                                   |
| `ValidationError`       | 400         | Invalid request body                                  |
| `ServerError`           | 500+        | Server-side failure                                   |

## Intents API

Agents can be granted the ability to sign and broadcast on-chain transactions through the Intents API. Private keys stay in the HSM — the agent submits intent, the API signs and broadcasts.

Toggle `intents_api_enabled` when creating or updating an agent:

```typescript
// Register an API key agent with Intents API access (default auth_method)
const { data } = await client.agents.create({
    name: "defi-bot",
    auth_method: "api_key", // "api_key" | "mtls" | "oidc_client_credentials"
    scopes: ["keys/*", "api-keys/*"],
    intents_api_enabled: true,
});
// data.api_key is only returned for auth_method: "api_key"
// All agents automatically receive an Ed25519 SSH keypair (data.agent.ssh_public_key)

// Register an mTLS agent (no API key returned)
const { data: mtlsAgent } = await client.agents.create({
    name: "mtls-bot",
    auth_method: "mtls",
    client_cert_fingerprint: "sha256-fingerprint-hex",
});

// Register an OIDC agent (no API key returned)
const { data: oidcAgent } = await client.agents.create({
    name: "oidc-bot",
    auth_method: "oidc_client_credentials",
    oidc_issuer: "https://accounts.google.com",
    oidc_client_id: "your-client-id",
});

// Or enable it later
await client.agents.update(agentId, {
    intents_api_enabled: true,
});

// Check an agent's proxy status
const agent = await client.agents.get(agentId);
console.log(agent.data?.intents_api_enabled); // true
```

### Submitting a transaction

Once `intents_api_enabled` is true and the agent has a signing key stored in an accessible vault, the agent can submit transaction intents:

```typescript
const txRes = await client.agents.submitTransaction(agentId, {
    to: "0x000000000000000000000000000000000000dEaD",
    value: "0.01", // ETH
    chain: "base",
    // Optional: data, signing_key_path, nonce, gas_price, gas_limit
});

console.log(txRes.data?.status); // "signed"
console.log(txRes.data?.tx_hash); // "0x..."
console.log(txRes.data?.signed_tx); // signed raw transaction hex
```

The backend fetches the signing key from the vault, signs the EIP-155 transaction, and returns the signed transaction hex. The signing key is decrypted in-memory, used, and immediately zeroized — it never leaves the server.

The SDK automatically generates an `Idempotency-Key` header (UUID v4) on each `submitTransaction` call, providing replay protection. Duplicate requests within 24 hours return the cached response instead of re-signing.

### Sign-only mode (BYORPC)

Use `signTransaction` when you want the server to sign but **not** broadcast — for example, to submit via your own RPC (Flashbots, MEV protection, custom relayers):

```typescript
const signRes = await client.agents.signTransaction(agentId, {
    to: "0x000000000000000000000000000000000000dEaD",
    value: "0.01",
    chain: "base",
});

console.log(signRes.data?.signed_tx); // raw signed tx hex
console.log(signRes.data?.tx_hash);   // precomputed keccak hash
console.log(signRes.data?.from);      // derived sender address

// Broadcast yourself via ethers, viem, or raw JSON-RPC
```

All agent guardrails (allowlists, value caps, daily limits) are enforced exactly as for submit. The transaction is recorded for audit and daily-limit tracking with `status: "sign_only"`.

### Graduated HITL & v0.55 guardrails

Configure graduated human-in-the-loop thresholds on agents with Intents API enabled:

```typescript
await client.agents.update(agentId, {
  tx_approval_policy: {
    require_above_native: { ethereum: "0.1", base: "0.05" },
    require_for_new_recipients: true,
    require_for_unlimited_approvals: true,
  },
  typed_data_policy: "approve",           // EIP-712 → 202 awaiting_approval
  simulation_failure_policy: "approve",   // Tenderly revert → HITL
  raw_signing_policy: "approve",          // allow | deny | approve
  tx_block_unlimited_approvals: true,
  tx_max_value_usd: "1000",
  tx_daily_limit_usd: "5000",
  allow_erc4337: true,
  allow_eip7702: false,
  clear_auto_suspended: true,             // owner/admin — clear circuit breaker
});
```

Org emergency freeze (owner/admin): `POST /v1/org/freeze` and `POST /v1/org/unfreeze`.

### Non-EVM transactions (Bitcoin, Solana, XRP, Cardano, Tron)

The same `submitTransaction` / `signTransaction` methods accept chain-specific fields. Values are in the chain's native unit (BTC, SOL, XRP, ADA, TRX):

```typescript
// Solana devnet — native SOL
await client.agents.submitTransaction(agentId, {
    chain: "solana-devnet",
    to: "RecipientBase58...",
    value: "0.001",
});

// Bitcoin testnet
await client.agents.signTransaction(agentId, {
    chain: "bitcoin-testnet",
    to: "tb1q...",
    value: "0.00001",
    fee_rate_sat_per_vbyte: 5,
});

// XRP — simple Payment with destination tag
await client.agents.submitTransaction(agentId, {
    chain: "xrp-testnet",
    to: "r...",
    value: "1",
    destination_tag: 12345,
});

// XRP — arbitrary XRPL transaction type via xrpl_tx_json
// Supports 30+ types: TrustSet, OfferCreate, NFTokenMint, AMMCreate, EscrowCreate, etc.
// Account, Sequence, Fee, and SigningPubKey are auto-filled by the server.
await client.agents.submitTransaction(agentId, {
    chain: "xrp",
    xrpl_tx_json: {
        TransactionType: "TrustSet",
        LimitAmount: {
            currency: "USD",
            issuer: "rIssuer...",
            value: "100",
        },
    },
});

// Solana SPL token
await client.agents.submitTransaction(agentId, {
    chain: "solana-devnet",
    to: "RecipientBase58...",
    value: "10",
    token_mint: "MintBase58...",
    token_decimals: 6,
});
```

See the [Intents API guide](https://docs.1claw.co/docs/guides/intents-api#non-evm-transaction-signing) for full field reference.

Key properties:

- **Disabled by default** — a human must explicitly enable per-agent
- **Signing keys never leave the HSM** — same envelope encryption as secrets
- **Idempotent by default** — each submission includes an auto-generated `Idempotency-Key` header
- **Every transaction is audit-logged** with full calldata
- **Revocable instantly** — set `intents_api_enabled: false` to cut off access

### TEE Enforcement (Pro+)

Lock down agents so signing and execution requests **must** route through the hardware enclave (Shroud TEE). Direct Vault API calls are rejected with 403.

```typescript
await client.agents.update(agentId, {
    intents_require_tee: true,    // Only signs within the hardware enclave
    execution_require_tee: true,  // Only runs within the hardware enclave
});
```

When `intents_require_tee` is true:
- Transaction submit/sign requests to `api.1claw.co` are rejected (403)
- Agents must route through `shroud.1claw.co` where signing happens inside TEE memory

When `execution_require_tee` is true:
- Execute requests to `api.1claw.co` are rejected (403)
- All direct secret reads by the agent are blocked — forces use of Execution Intent bindings
- Agents must route through `shroud.1claw.co`

Both require `intents_api_enabled` / `execution_intents_enabled` to be on first.

### Agent-to-Agent Delegation

Human-controlled authorization for inter-agent task delegation. Agents cannot delegate to other agents without an explicit delegation record created by a human.

```typescript
// Create a delegation (human-only)
await client.agents.createDelegation(orchestratorId, {
    delegate_id: subAgentId,
    allowed_tools: ["delegate_task", "search_memory"],
    max_daily_delegations: 100,
    max_depth: 2,
    delegation_mode: "caller",
    expires_at: "2026-12-31T23:59:59Z",
});

// List delegations for an agent
const delegations = await client.agents.listDelegations(agentId);

// Get effective delegations (agent-callable — for runtime tool discovery)
const effective = await client.agents.getEffectiveDelegations(agentId);

// Update a delegation (human-only)
await client.agents.updateDelegation(agentId, delegationId, {
    max_daily_delegations: 200,
    is_active: false,
});

// Revoke a delegation (human-only)
await client.agents.revokeDelegation(agentId, delegationId);
```

Delegation modes: `caller` (delegate uses its own credentials), `target` (delegate uses target's config), `both` (either mode per invocation).

### Overhead Budget and Transaction Count Limits

Protect against non-value drain attacks (ATA rent drain, XRP reserve exhaustion, Tron energy drain):

```typescript
await client.agents.update(agentId, {
    tx_max_per_day: 100,                     // Cap transactions per UTC day
    tx_overhead_budget: {                    // Per-chain non-value cost budgets (native units)
        solana: "0.5",
        xrp: "100",
        ethereum: "0.01",
    },
    solana_ata_allowlist: [                  // Only these addresses may have ATAs created
        "7nYzKqAqfaGEhN6oeKCQVFjduQ9qH1dWs2gVFkNKBpQF",
    ],
    per_chain_guardrails: {                  // Per-chain overrides
        solana: { max_per_day: 20, overhead_budget: "0.2", max_ata_creates_per_day: 5 },
    },
});

// Check current spend:
const agent = await client.agents.get(agentId);
console.log(agent.data?.tx_count_today);           // e.g. 42
console.log(agent.data?.tx_overhead_today_by_chain); // e.g. { "solana": "0.12" }
```

## OAuth2 / PKCE ("Sign in with 1Claw")

The SDK provides helpers for implementing the full OAuth2 PKCE flow and managing tokens/consent:

```typescript
import { generatePKCE, buildAuthorizeUrl, createClient } from "@1claw/sdk";

// 1. Generate PKCE pair
const pkce = await generatePKCE();

// 2. Build the authorize URL
const authUrl = buildAuthorizeUrl("https://1claw.co", {
    clientId: "your-platform-app-slug",
    redirectUri: "https://yourapp.com/callback",
    scopes: ["openid", "profile", "email"],
    state: "random-state",
    codeChallenge: pkce.codeChallenge,
});

// 3. After redirect, exchange the code for tokens
const client = createClient({ baseUrl: "https://api.1claw.co" });
const tokens = await client.auth.exchangeOAuthCode({
    code: "authorization-code-from-callback",
    client_id: "your-platform-app-slug",
    redirect_uri: "https://yourapp.com/callback",
    code_verifier: pkce.codeVerifier,
});

// 4. Fetch user info
const userInfo = await client.auth.getUserInfo(tokens.data?.access_token);

// 5. Revoke a token (RFC 7009)
await client.auth.revokeToken({ token: "...", token_type_hint: "refresh_token" });

// 6. Revoke consent for an app (invalidates all tokens)
await client.auth.revokeConsent("platform-app-id");
```

## OIDC Federation (Anthropic WIF, GCP STS, AWS STS)

`https://api.1claw.co` is a fully OpenID Connect–compliant issuer. External relying parties — Anthropic Workload Identity Federation, GCP STS, AWS STS, Stytch, etc. — can validate 1claw-issued JWTs by fetching:

- `GET https://api.1claw.co/.well-known/openid-configuration`
- `GET https://api.1claw.co/.well-known/jwks.json`

The SDK exposes one method to mint a federation token:

```typescript
const tokenRes = await client.auth.exchangeFederatedToken({
    audience: "https://api.anthropic.com",
    // subjectToken? — defaults to the client's current login or apiKey
    // scope? — optional space-separated subset of agent's scopes
});

const oidcJwt = tokenRes.data?.access_token; // RS256-signed; ~15 min default TTL, hard cap 1h
```

The acting agent must have `federation_enabled: true` and the `audience` must be on its `federation_audiences` allowlist (set via dashboard or `client.agents.update`). Every active KMS key version is published in JWKS, so verifiers reject unknown `kid`s automatically when 1claw rotates keys.

End-to-end Anthropic WIF demo: see the [`examples/anthropic-wif`](https://github.com/1clawAI/1claw-examples/tree/main/anthropic-wif) repo and [`internal-docs/runbooks/oidc-federation.md`](../../internal-docs/runbooks/oidc-federation.md).

## Customer-Managed Encryption Keys (CMEK)

For enterprises that require cryptographic proof that 1claw cannot access their secrets unilaterally, the SDK provides client-side CMEK utilities. Keys are generated and managed entirely on your side — only the SHA-256 fingerprint is stored on the server.

```typescript
import { cmek } from "@1claw/sdk";

// Generate a 256-bit AES key (returns CryptoKey)
const key = await cmek.generateCmekKey();

// Compute fingerprint (SHA-256 hex)
const fingerprint = await cmek.cmekFingerprint(key);

// Enable CMEK on a vault
await client.vault.enableCmek(vaultId, { fingerprint });

// Encrypt a secret value before storing
const encrypted = await cmek.cmekEncrypt(key, "my-secret-value");
await client.secrets.set(vaultId, "path/to/secret", encrypted);

// Decrypt after retrieving
const res = await client.secrets.get(vaultId, "path/to/secret");
const plaintext = await cmek.cmekDecrypt(key, res.data.value);
```

### Server-assisted key rotation

```typescript
await client.vault.rotateCmek(vaultId, oldKey, newKey, {
    new_fingerprint: await cmek.cmekFingerprint(newKey),
});
```

The server re-encrypts all secrets in batches of 100. Poll rotation status:

```typescript
const job = await client.vault.getRotationJobStatus(vaultId, jobId);
console.log(job.data?.status, job.data?.processed, "/", job.data?.total_secrets);
```

## MPC Vault Support

Vaults can optionally use multi-party computation (MPC) for secret splitting. When MPC is enabled, the server holds one share and the client holds another — neither party can reconstruct the secret alone.

```typescript
// Enable MPC on a vault
await client.vault.enableMpc(vaultId);

// Store a secret — response includes the client_share
const res = await client.secrets.set(vaultId, "my-key", "secret-value");
const clientShare = res.data?.client_share; // Save this securely on your side

// Retrieve a secret — pass client_share to reconstruct
const secret = await client.secrets.get(vaultId, "my-key", {
    client_share: clientShare,
});
console.log(secret.data?.value);

// Disable MPC (converts back to standard encryption)
await client.vault.disableMpc(vaultId);
```

When MPC is enabled, `set` responses include a `client_share` field that must be stored client-side. The `get` method accepts an optional `client_share` parameter to reconstruct the full secret. Without the client share, the server returns only its share.

## Agent Token Auto-Refresh

When using agent credentials (`agentId` + `apiKey`), the SDK automatically refreshes tokens 60 seconds before expiry. No manual token management needed:

```typescript
const client = createClient({
    baseUrl: "https://api.1claw.co",
    apiKey: "ocv_...",
    agentId: "agent-uuid",
});
// Tokens refresh transparently — just make API calls
```

## DPoP (Proof-of-Possession)

Enable [DPoP (RFC 9449)](https://datatracker.ietf.org/doc/html/rfc9449) to bind tokens to the client's ephemeral keypair. When enabled, the SDK generates a P-256 ECDSA keypair at startup and attaches a `DPoP` proof JWT to every request — stolen tokens are unusable without the matching private key.

```typescript
const client = createClient({
    baseUrl: "https://api.1claw.co",
    apiKey: "ocv_...",
    agentId: "agent-uuid",
    dpop: true, // Generates ephemeral P-256 keypair, attaches DPoP proofs
});
```

The `DPoPManager` class is also exported for advanced use cases:

```typescript
import { DPoPManager } from "@1claw/sdk";

const dpop = new DPoPManager();
await dpop.init();

const proof = await dpop.generateProof("POST", "https://api.1claw.co/v1/auth/agent-token");
const thumbprint = dpop.getThumbprint(); // JWK SHA-256 thumbprint (base64url)
```

## Risk Engine

Query risk events, retrieve threat verdicts, and manage honeytokens via `client.risk`:

```typescript
// List recent risk events (filtered by severity)
const events = await client.risk.listEvents({
    severity: "high",
    limit: 50,
});
console.log(events.data?.events);

// Get the current risk verdict for a specific agent
const verdict = await client.risk.getVerdict("agent", agentId);
console.log(verdict.data?.verdict?.severity); // "low" | "medium" | "high" | "critical"
console.log(verdict.data?.verdict?.reasons);  // detector breakdown

// List all verdicts for the org
const verdicts = await client.risk.listVerdicts();

// Create a honeytoken (canary secret that triggers alerts on access)
const ht = await client.risk.createHoneytoken({
    vault_id: vaultId,
    secret_path: "honeypot/admin-key",
    notes: "Canary for unauthorized agent access",
});
console.log(ht.data?.honeytoken.id);

// List and delete honeytokens
const honeytokens = await client.risk.listHoneytokens();
await client.risk.deleteHoneytoken(honeytokenId);
```

## x402 Payment Protocol

When free-tier limits are exceeded, the API returns `402 Payment Required`. The SDK can automatically handle payments if you provide a signer:

```typescript
import { createClient, type X402Signer } from "@1claw/sdk";

const signer: X402Signer = {
    getAddress: async () => "0x...",
    signPayment: async (accept) => {
        // Sign EIP-712 payment with your wallet library (ethers, viem, etc.)
        return signedPayloadHex;
    },
};

const client = createClient({
    baseUrl: "https://api.1claw.co",
    apiKey: "ocv_...",
    x402Signer: signer,
    maxAutoPayUsd: 0.01, // auto-pay up to $0.01 per request
});

// Or use the explicit pay-and-fetch flow:
const secret = await client.x402.withPayment("vault-id", "key", signer);
```

## Payment Cards (x402 Card Ordering)

Order prepaid and gift cards where the agent pays via an outbound x402 payment (USDC on Base) and never sees the PAN/CVV:

```typescript
// Order a prepaid card
const card = await client.cards.order("agent-id", {
    kind: "prepaid",
    amount_usd: "5.00",
});
// card.id, card.status ("pending"), card.last4 (once ready)

// Poll until ready (or rely on card.ready webhook)
const status = await client.cards.get(card.id);

// Reveal (human-only with password re-auth)
const revealed = await client.cards.reveal(card.id, "my-password");
// revealed.pan, revealed.cvv, revealed.disclaimer

// Gift cards
const gifts = await client.cards.searchGiftCards({ country: "US" });
const giftCard = await client.cards.order("agent-id", {
    kind: "gift_card",
    amount_usd: "25.00",
    laso_server_id: gifts[0].serverId,
});

// Lifecycle
await client.cards.void(card.id);
await client.cards.refresh(card.id);
const all = await client.cards.list();
```

## Plugins

The SDK supports optional plugin interfaces for extending behavior without modifying the core:

```typescript
import { createClient } from "@1claw/sdk";
import type { CryptoProvider, AuditSink, PolicyEngine } from "@1claw/sdk";

const client = createClient({
    baseUrl: "https://api.1claw.co",
    apiKey: "ocv_...",
    plugins: {
        cryptoProvider: myAwsKmsProvider,
        auditSink: mySplunkSink,
        policyEngine: myOpaEngine,
    },
});
```

| Interface        | Purpose                                                      | Default behavior              |
| ---------------- | ------------------------------------------------------------ | ----------------------------- |
| `CryptoProvider` | Client-side encryption (encrypt, decrypt, generateKey)       | Server-side HSM (no-op)       |
| `AuditSink`      | Forward SDK events to external systems (Splunk, Datadog)     | No-op (server handles audit)  |
| `PolicyEngine`   | Pre-evaluate policies locally before API calls               | No-op (server enforces)       |

Implement any interface in your own package — no PRs to the SDK needed.

## Shroud Security (LLM Proxy)

Agents can route LLM traffic through Shroud, a TEE-based proxy with comprehensive security features. Configure per-agent security policies via the `shroud_config` object:

```typescript
const { data } = await client.agents.create({
    name: "secure-agent",
    shroud_enabled: true,
    shroud_config: {
        // Basic settings
        pii_policy: "redact",           // block | redact | warn | allow
        injection_threshold: 0.7,

        // Model restrictions
        allowed_models: ["gpt-4o-mini", "claude-sonnet-5"],  // Whitelist specific models
        denied_models: ["gpt-3.5-turbo"],                   // Blacklist models
        allowed_providers: ["openai", "anthropic"],          // Restrict providers

        // Threat detection
        unicode_normalization: {
            enabled: true,
            strip_zero_width: true,
            normalize_homoglyphs: true,
        },
        command_injection_detection: {
            enabled: true,
            action: "block",            // block | sanitize | warn | log
        },
        social_engineering_detection: {
            enabled: true,
            action: "warn",
            sensitivity: "medium",      // low | medium | high
        },
        encoding_detection: { enabled: true, action: "warn" },
        network_detection: { enabled: true, action: "warn" },
        filesystem_detection: { enabled: false },  // disabled by default

        // Advanced inspection (Phase 2+3)
        tool_call_inspection: {
            enabled: true,
            scan_arguments: true,
            block_credential_exfil: true,
            action: "block",
        },
        output_policy: {
            enabled: true,
            blocked_entities: ["CompetitorCo"],
            block_harmful_content: true,
            harmful_categories: ["malware", "illegal"],
            action: "warn",
        },
        secret_injection_detection: {
            enabled: true,
            action: "block",
            sensitivity: "medium",
        },
        advanced_redaction: {
            enabled: true,
            detect_base64_encoded: true,
            detect_split_secrets: true,
            detect_prefix_leak: true,
        },
        semantic_policy: {
            enabled: true,
            allowed_topics: ["customer_support"],
            denied_tasks: ["code_generation", "data_export"],
            action: "warn",
        },
        flagged_request_retention_days: 30,

        // Global settings
        sanitization_mode: "block",     // block | surgical | log_only
        threat_logging: true,
    },
});
```

Update an existing agent's security config:

```typescript
await client.agents.update(agentId, {
    shroud_config: {
        command_injection_detection: { enabled: true, action: "block" },
        social_engineering_detection: { enabled: true, action: "block" },
        allowed_models: ["gpt-4o-mini"],  // Restrict to cost-effective models
    },
});
```

### Specifying Models in Requests

When making LLM requests to Shroud, specify the model in one of two ways:

**Option 1: Header**
```typescript
const res = await fetch("https://shroud.1claw.co/v1/chat/completions", {
  method: "POST",
  headers: {
    "X-Shroud-Agent-Key": `${agentId}:${agentApiKey}`,
    "X-Shroud-Provider": "openai",
    "X-Shroud-Model": "gpt-4o-mini",  // ← Model in header
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    messages: [{ role: "user", content: "Hello" }],
  }),
});
```

**Option 2: Request Body** (for OpenAI-style providers)
```typescript
body: JSON.stringify({
  model: "gpt-4o-mini",  // ← Model in body
  messages: [{ role: "user", content: "Hello" }],
})
```

Shroud enforces the agent's `allowed_models` and `denied_models` restrictions automatically — requests using unauthorized models return **403 Forbidden**.

See the [Shroud Security Guide](https://docs.1claw.co/docs/guides/shroud) for full configuration options.

## v0.48 — Cedar/OPA Enforcement v2

Policy backend settings, contract ABI registry, and consensus pending approvals:

```typescript
// Org policy backend (shadow mode default)
const settings = await client.org.getPolicyBackendSettings();
await client.org.updatePolicyBackendSettings({ mode: "shadow", backend: "builtin+cedar" });
const report = await client.org.getPolicyShadowReport();

// Contract ABI registry (owner/admin)
await client.contractAbis.create({
    chain: "ethereum",
    contract_address: "0x...",
    abi_json: [...],
});
await client.contractAbis.list({ chain: "ethereum" });

// Consensus pending approvals
await client.pendingApprovals.submit({
    policy_id: "...",
    action: "sign",
    action_payload: { chain: "ethereum", to: "0x...", value: "0" },
});
await client.pendingApprovals.list({ status: "pending" });

// Access policies with consensus_trigger
await client.access.createPolicy(vaultId, {
    secret_path_pattern: "keys/*",
    principal_type: "agent",
    principal_id: agentId,
    permissions: ["read"],
    consensus_trigger: {
        conditions: [{ type: "value_above", threshold_wei: "1000000000000000000" }],
        approval: {
            min_approvals: 2,
            required_roles: ["owner", "admin"],
            per_role_minimums: { owner: 1 },
            require_credential_types: ["passkey"],
        },
    },
    tx_conditions: {
        eip712_primary_type_in: ["Permit", "Permit2"],
        eip712_verifying_contract_in: ["0x000000000022D473030F116dDEE9F6B43aC78BA3"],
        eip7702_authorized_addresses_in: ["0xKnownSafeDelegate"],
    },
});
```

## v0.47 — Turnkey Parity

New SDK resources for enterprise and treasury features:

```typescript
// Unified portfolio across treasury wallets, signing keys, and smart accounts
const portfolio = await client.portfolio.get({ include_tokens: true });

// Cedar declarative policies (Team+ tier)
await client.cedarPolicies.create({ name: "allow-read", cedar_text: "permit(...);" });
await client.cedarPolicies.test({ principal_type: "agent", action: "read", ... });

// OPA Rego policies (Business+ tier)
await client.opaPolicies.create({ name: "deny-export", rego_source: "package oneclaw\n..." });

// Sub-organizations (Enterprise hierarchy)
await client.subOrgs.create({ name: "Engineering" });
await client.subOrgs.list();

// Import existing Gnosis Safe smart accounts
await client.agents.importSmartAccount(agentId, {
    chain: "ethereum",
    chain_id: 1,
    safe_address: "0x...",
    verify: true,
});

// BYOK signing key import (human-only, requires password re-auth)
await client.signingKeys.import(agentId, "ethereum", {
    private_key: "0x...",
    format: "hex",
}, { authConfirm: "your-password" });
```

## v0.56 — Safe accounts, guardrail governance, HFA

Phase 5 Safe foundation and v0.56 guardrail governance APIs:

```typescript
// Agent on-chain accounts (EOA + counterfactual Safe)
const { data: accounts } = await client.agents.listAccounts(agentId);
await client.agents.migrateToSafe(agentId, { chain: "ethereum", deprecate_eoa: true });
await client.agents.deprecateEoaAccount(agentId, "ethereum");
await client.agents.syncOrgSafeAllowances(); // owner/admin

// Public Safe module registry (Guard + Zodiac addresses per chain)
const registry = await client.agents.getSafeModuleRegistry("ethereum");

// Guardrail widening returns 202 — resubmit PATCH with approval_id after decide
await client.agents.update(agentId, {
    tx_to_allowlist: ["0xNewRecipient..."],
    approval_id: "uuid-from-202-response",
});

// Guardrail governance (owner/admin)
await client.org.getGuardrailShadowReport({ since: "2026-01-01T00:00:00Z" });
await client.org.listGuardrailRevisions();
await client.agents.replayGuardrails(agentId, {
    days: 7,
    draft_guardrails: { tx_max_value_eth: "0.1" },
});

// Human Factor Auth — treasury send/swap step-up policies
await client.auth.getHumanFactorAuth();
await client.auth.setHumanFactorAuth({ require_passkey: true, require_totp: false });
const embedded = await client.treasuryWallets.getAuthPolicy(); // wallet-react / embedded clients

// Passkey tx-assert for treasury send/swap (alternative to X-Auth-Confirm password)
const begin = await client.auth.beginPasskeyTxAssert({ tx_digest: "abc123...", action: "swap" });
// ... complete ceremony, then send with X-Passkey-Token header
```

## v0.57 — Platform API expansion

SIWE wallet login, parameterized bootstrap, connection polling, entitlements, and inference budgets:

```typescript
// SIWE challenge + upsert (plt_ auth)
const challenge = await client.platform.siweChallenge();
// ... sign SIWE message, upsert with subject_token_type urn:1claw:params:oauth:token-type:siwe

await client.platform.getConnection(connectionId);
await client.platform.getConnectionUsage(connectionId);
await client.platform.listEntitlements(connectionId);
await client.platform.previewTemplate(appId, templateId, { parameters: { agent_name: "demo" } });

await client.treasuryWallets.getInferenceBudget();
```

## v0.58 — Platform API control plane

App-scoped reads, spend-policy idempotency, and ownership transfer (plt_ auth unless noted):

```typescript
await client.platform.transferAppOwnership(appId, {
    target_org_id: "org-uuid",
});
await client.platform.getSpendPolicy(appId, policyId);
await client.platform.getConnectionSpendPolicy(connectionId);
await client.platform.listConnectionApprovals(connectionId);
await client.platform.getConnectionApproval(connectionId, approvalId);
await client.platform.listConnectionPendingApprovals(connectionId);
await client.platform.getTemplate(appId, templateId);
await client.platform.createConnectionRuntime(connectionId, {
    name: "my-runtime",
    agent_id: "agent-uuid",
    preset: "small",
    template: "openclaw",
});
await client.platform.connectionAgentChat(connectionId, agentId, {
    message: "Hello",
});
await client.platform.decideConnectionPendingApproval(connectionId, approvalId, {
    decision: "approve",
    payload_hash: "...",
    credential_type: "wallet_mandate",
});
await client.platform.decideConnectionApproval(connectionId, approvalId, {
    decision: "approved",
});
await client.platform.deactivateConnectionSigningKey(connectionId, "ethereum", agentId);
// setUserSpendPolicy(connectionId, data, { idempotencyKey: "..." }) — 24h replay protection
```

## v0.59 — Fathom platform integration

Connection-scoped runtime, passkey enroll, and agent `system_prompt`:

```typescript
await client.platform.getConnectionRuntime(connectionId, runtimeId);
await client.platform.connectionPasskeyEnrollBegin(connectionId);
await client.platform.connectionPasskeyEnrollComplete(connectionId, {
    credential_id: "...",
    attestation_object: "...",
    client_data_json: "...",
});
await client.platform.connectionAgentChat(connectionId, agentId, {
    message: "Hello",
    system_prompt: "You are helpful.",
});
await client.agents.create({ name: "bot", system_prompt: "Default persona" });
// getConnection() includes provisioned_tier when billing_model is platform_pays
```

## OpenAPI Types

The SDK's request types are generated from the **OpenAPI 3.1** spec, published as [@1claw/openapi-spec](https://www.npmjs.com/package/@1claw/openapi-spec). Advanced users can access the raw generated types:

```typescript
import type { paths, components, operations, ApiSchemas } from "@1claw/sdk";

// Access any schema from the spec
type Vault = ApiSchemas["VaultResponse"];
type Agent = ApiSchemas["AgentResponse"];
```

Regenerate types after spec changes (from the monorepo): `cd packages/sdk && npm run generate` — reads [`../openapi-spec/openapi.yaml`](../openapi-spec/openapi.yaml) via `openapi-typescript`.

## MCP Integration (AI Agents)

The SDK exposes MCP-compatible tool definitions for AI agents:

```typescript
import { getMcpToolDefinitions, McpHandler } from "@1claw/sdk/mcp";
import { createClient } from "@1claw/sdk";

// Get tool definitions for your agent's tool registry
const tools = getMcpToolDefinitions();
// → 1claw_get_secret, 1claw_set_secret, 1claw_list_secret_keys, etc.

// Dispatch tool calls from your agent
const client = createClient({ baseUrl: "...", token: "..." });
const handler = new McpHandler(client);
const result = await handler.handle("1claw_get_secret", {
    vault_id: "...",
    key: "OPENAI_KEY",
});
```

### With Vercel AI SDK

```typescript
import { tool } from "ai";
import { z } from "zod";
import { createClient } from "@1claw/sdk";

const client = createClient({ baseUrl: "...", apiKey: "..." });

export const oneclawTools = {
    getSecret: tool({
        description: "Fetch a secret from the 1claw vault",
        parameters: z.object({
            vaultId: z.string(),
            key: z.string(),
        }),
        execute: async ({ vaultId, key }) => {
            const res = await client.secrets.get(vaultId, key);
            if (res.error) return { error: res.error.message };
            return { status: "available", hint: `Secret retrieved (${key})` };
        },
    }),
};
```

## License

[MIT](./LICENSE)
