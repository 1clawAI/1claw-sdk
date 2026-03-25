# @1claw/sdk

TypeScript SDK for **1Claw Vault** — HSM-backed secret management for AI agents and humans.

## Install

```bash
npm install @1claw/sdk
```

**Note:** This package is **ESM-only**. Use it in an ESM context (e.g. `"type": "module"` in `package.json`, or `.mjs` files). Next.js and other bundlers handle ESM natively. Running scripts with plain `node` or `tsx` may require an ESM setup to avoid `ERR_PACKAGE_PATH_NOT_EXPORTED`.

## Quick Start

```typescript
import { createClient } from "@1claw/sdk";

const client = createClient({
    baseUrl: "https://api.1claw.xyz",
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

**API contract:** This SDK is built from the **OpenAPI 3.1** spec. The canonical spec is published as [@1claw/openapi-spec](https://www.npmjs.com/package/@1claw/openapi-spec) (YAML/JSON). Types are generated with `npm run generate` (`openapi-typescript ../openapi-spec/openapi.yaml`). Run `generate` after spec changes, then `npm run build`. Shapes such as `LlmTokenBillingStatus` (including optional `credit_balance` and `billing_cycle_usage.metered_lines`) come from the generated `api-types.ts`. For a full endpoint list, see the [API reference](https://docs.1claw.xyz/docs/reference/api-reference) or the spec.

## Authentication

Agent JWTs issued by `POST /v1/auth/agent-token` may include optional claims such as `shroud_enabled` and **`shroud_config`** (when Shroud is on for that agent). Those are for services like **Shroud** that verify the JWT; the TypeScript SDK uses the token for Vault API calls and does not need to read `shroud_config` unless you build custom tooling.

The SDK supports three authentication modes:

```typescript
// 1. User API key (auto-authenticates)
const client = createClient({
    baseUrl: "https://api.1claw.xyz",
    apiKey: "ocv_...",
});

// 2. Agent with API key (auto-authenticates as agent)
const agent = createClient({
    baseUrl: "https://api.1claw.xyz",
    apiKey: "ocv_...",
    agentId: "agent-uuid",
});

// 3. Pre-authenticated JWT
const authed = createClient({
    baseUrl: "https://api.1claw.xyz",
    token: "eyJ...",
});

// Or authenticate manually:
await client.auth.login({ email: "...", password: "..." });
await client.auth.agentToken({ agent_id: "...", api_key: "..." });
await client.auth.google({ id_token: "..." });

// Password reset (public; no Bearer token — use a client without stored JWT)
await client.auth.forgotPassword({ email: "user@example.com" });
await client.auth.resetPassword({ token: "...", new_password: "..." });
```

## API Resources

| Resource           | Methods                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `client.vault`     | `create`, `get`, `list`, `delete`                                                                                   |
| `client.secrets`   | `set`, `get`, `delete`, `list`, `rotate`                                                                            |
| `client.access`    | `grantHuman`, `grantAgent`, `update`, `revoke`, `listGrants`                                                        |
| `client.agents`    | `create`, `getSelf`, `get`, `list`, `update`, `delete`, `rotateKey`, `submitTransaction`, `signTransaction`, `getTransaction`, `listTransactions`, `simulateTransaction`, `simulateBundle` |
| `client.chains`    | `list`, `get`, `adminList`, `create`, `update`, `delete`                                                            |
| `client.sharing`   | `create`, `access`, `listOutbound`, `listInbound`, `accept`, `decline`, `revoke`                                    |
| `client.approvals` | `request`, `list`, `approve`, `deny`, `check`, `subscribe`                                                          |
| `client.billing`   | `usage`, `history`, `llmTokenBilling`, `subscribeLlmTokenBilling`, `disableLlmTokenBilling` (LLM token billing / Stripe AI Gateway) |
| `client.audit`     | `query`                                                                                                             |
| `client.org`       | `listMembers`, `getAgentKeysVault`, `updateMemberRole`, `removeMember`                                              |
| `client.auth`      | `login`, `signup`, `agentToken`, `apiKeyToken`, `google`, `changePassword`, `logout`, `getMe`, `updateMe`, `deleteMe` |
| `client.apiKeys`   | `create`, `list`, `revoke`                                                                                          |
| `client.treasury`  | `create`, `list`, `get`, `update`, `delete`, `addSigner`, `removeSigner`, `requestAccess`, `listAccessRequests`, `approveAccess`, `denyAccess` |
| `client.x402`      | `getPaymentRequirement`, `pay`, `verifyReceipt`, `withPayment`                                                      |

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
    scopes: ["vault:read", "tx:sign"],
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

Key properties:

- **Disabled by default** — a human must explicitly enable per-agent
- **Signing keys never leave the HSM** — same envelope encryption as secrets
- **Idempotent by default** — each submission includes an auto-generated `Idempotency-Key` header
- **Every transaction is audit-logged** with full calldata
- **Revocable instantly** — set `intents_api_enabled: false` to cut off access

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

## Agent Token Auto-Refresh

When using agent credentials (`agentId` + `apiKey`), the SDK automatically refreshes tokens 60 seconds before expiry. No manual token management needed:

```typescript
const client = createClient({
    baseUrl: "https://api.1claw.xyz",
    apiKey: "ocv_...",
    agentId: "agent-uuid",
});
// Tokens refresh transparently — just make API calls
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
    baseUrl: "https://api.1claw.xyz",
    apiKey: "ocv_...",
    x402Signer: signer,
    maxAutoPayUsd: 0.01, // auto-pay up to $0.01 per request
});

// Or use the explicit pay-and-fetch flow:
const secret = await client.x402.withPayment("vault-id", "key", signer);
```

## Plugins

The SDK supports optional plugin interfaces for extending behavior without modifying the core:

```typescript
import { createClient } from "@1claw/sdk";
import type { CryptoProvider, AuditSink, PolicyEngine } from "@1claw/sdk";

const client = createClient({
    baseUrl: "https://api.1claw.xyz",
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
        allowed_models: ["gpt-4o-mini", "claude-sonnet-4"],  // Whitelist specific models
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
const res = await fetch("https://shroud.1claw.xyz/v1/chat/completions", {
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

See the [Shroud Security Guide](https://docs.1claw.xyz/docs/guides/shroud) for full configuration options.

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
