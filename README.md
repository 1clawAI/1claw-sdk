# @1claw/sdk

TypeScript SDK for **1Claw Vault** — HSM-backed secret management for AI agents and humans.

## Install

```bash
npm install @1claw/sdk
```

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

## Authentication

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
```

## API Resources

| Resource           | Methods                                                                    |
| ------------------ | -------------------------------------------------------------------------- |
| `client.vault`     | `create`, `get`, `list`, `delete`                                          |
| `client.secrets`   | `set`, `get`, `delete`, `list`, `rotate`                                   |
| `client.access`    | `grantHuman`, `grantAgent`, `update`, `revoke`, `listGrants`               |
| `client.agents`    | `create`, `get`, `list`, `update`, `delete`, `rotateKey`                   |
| `client.sharing`   | `create`, `access`, `revoke`                                               |
| `client.approvals` | `request`, `list`, `approve`, `deny`, `check`, `subscribe`                 |
| `client.billing`   | `usage`, `history`                                                         |
| `client.audit`     | `query`                                                                    |
| `client.org`       | `listMembers`, `updateMemberRole`, `removeMember`                          |
| `client.auth`      | `login`, `agentToken`, `apiKeyToken`, `google`, `changePassword`, `logout` |
| `client.apiKeys`   | `create`, `list`, `revoke`                                                 |
| `client.x402`      | `getPaymentRequirement`, `pay`, `verifyReceipt`, `withPayment`             |

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
| `ApprovalRequiredError` | 403         | Human approval gate triggered                         |
| `NotFoundError`         | 404         | Resource not found                                    |
| `RateLimitError`        | 429         | Rate limit exceeded                                   |
| `ValidationError`       | 400         | Invalid request body                                  |
| `ServerError`           | 500+        | Server-side failure                                   |

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

PolyForm Noncommercial 1.0.0
