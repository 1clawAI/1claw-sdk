import type { McpToolDefinition } from "../types";

/**
 * MCP tool definitions for AI agents (Claude, GPT, etc.) to interact
 * with 1Claw vaults natively via function/tool calling.
 *
 * Usage with Vercel AI SDK:
 * ```ts
 * import { getMcpToolDefinitions } from "@1claw/sdk/mcp";
 * const tools = getMcpToolDefinitions();
 * ```
 *
 * Each definition includes a JSON Schema `inputSchema` that LLMs use
 * to structure their tool-call arguments.
 */

export const TOOL_GET_SECRET: McpToolDefinition = {
  name: "1claw_get_secret",
  description:
    "Fetch a decrypted secret from a 1Claw vault. " +
    "Returns the secret value if access is granted. " +
    "May return a pending_approval status if human approval is required.",
  inputSchema: {
    type: "object",
    properties: {
      vault_id: {
        type: "string",
        description: "UUID of the vault containing the secret",
      },
      key: {
        type: "string",
        description: "Path/key of the secret within the vault",
      },
      reason: {
        type: "string",
        description: "Why the agent needs this secret (logged for audit)",
      },
    },
    required: ["vault_id", "key"],
  },
};

export const TOOL_SET_SECRET: McpToolDefinition = {
  name: "1claw_set_secret",
  description:
    "Store or update a secret in a 1Claw vault. " +
    "The value is encrypted at rest using HSM-backed keys.",
  inputSchema: {
    type: "object",
    properties: {
      vault_id: {
        type: "string",
        description: "UUID of the vault to store the secret in",
      },
      key: {
        type: "string",
        description: "Path/key for the secret",
      },
      value: {
        type: "string",
        description: "The secret value to encrypt and store",
      },
      type: {
        type: "string",
        description: "Type hint (e.g. 'api_key', 'password', 'token', 'generic')",
        default: "generic",
      },
    },
    required: ["vault_id", "key", "value"],
  },
};

export const TOOL_LIST_SECRET_KEYS: McpToolDefinition = {
  name: "1claw_list_secret_keys",
  description:
    "List all secret keys in a vault WITHOUT revealing their values. " +
    "Returns metadata only: path, type, version, and timestamps.",
  inputSchema: {
    type: "object",
    properties: {
      vault_id: {
        type: "string",
        description: "UUID of the vault to list secrets from",
      },
      prefix: {
        type: "string",
        description: "Optional prefix filter for secret paths",
      },
    },
    required: ["vault_id"],
  },
};

export const TOOL_DELETE_SECRET: McpToolDefinition = {
  name: "1claw_delete_secret",
  description: "Permanently delete a secret from a 1Claw vault.",
  inputSchema: {
    type: "object",
    properties: {
      vault_id: {
        type: "string",
        description: "UUID of the vault containing the secret",
      },
      key: {
        type: "string",
        description: "Path/key of the secret to delete",
      },
    },
    required: ["vault_id", "key"],
  },
};

export const TOOL_LIST_VAULTS: McpToolDefinition = {
  name: "1claw_list_vaults",
  description:
    "List all vaults accessible to the current identity. " +
    "Returns vault names, descriptions, and IDs.",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
};

export const TOOL_CREATE_VAULT: McpToolDefinition = {
  name: "1claw_create_vault",
  description: "Create a new encrypted vault in 1Claw.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Human-readable vault name",
      },
      description: {
        type: "string",
        description: "Optional vault description",
      },
    },
    required: ["name"],
  },
};

export const TOOL_REQUEST_APPROVAL: McpToolDefinition = {
  name: "1claw_request_approval",
  description:
    "Formally request human approval to access a gated secret. " +
    "A notification is sent to the vault owner for review.",
  inputSchema: {
    type: "object",
    properties: {
      vault_id: {
        type: "string",
        description: "UUID of the vault containing the secret",
      },
      secret_path: {
        type: "string",
        description: "Path of the secret requiring approval",
      },
      reason: {
        type: "string",
        description: "Why the agent needs access to this secret",
      },
    },
    required: ["vault_id", "secret_path"],
  },
};

export const TOOL_CHECK_APPROVAL: McpToolDefinition = {
  name: "1claw_check_approval_status",
  description:
    "Check the current status of a human approval request. " +
    "Returns 'pending', 'approved', or 'denied'.",
  inputSchema: {
    type: "object",
    properties: {
      request_id: {
        type: "string",
        description: "UUID of the approval request to check",
      },
    },
    required: ["request_id"],
  },
};

export const TOOL_PAY_AND_FETCH: McpToolDefinition = {
  name: "1claw_pay_and_fetch",
  description:
    "Pay the x402 micropayment fee and retrieve a secret. " +
    "Use this when the free tier is exhausted and you need " +
    "to pay for API access using USDC on Base.",
  inputSchema: {
    type: "object",
    properties: {
      vault_id: {
        type: "string",
        description: "UUID of the vault containing the secret",
      },
      key: {
        type: "string",
        description: "Path/key of the secret to fetch",
      },
    },
    required: ["vault_id", "key"],
  },
};

export const TOOL_SHARE_SECRET: McpToolDefinition = {
  name: "1claw_share_secret",
  description:
    "Share a secret with another person by email. " +
    "The recipient does NOT need a 1Claw account — they will see " +
    "the shared secret when they sign up or log in. " +
    "Use this to grant a human access to a credential.",
  inputSchema: {
    type: "object",
    properties: {
      secret_id: {
        type: "string",
        description: "UUID of the secret entry to share",
      },
      email: {
        type: "string",
        description: "Email address of the recipient",
      },
      expires_at: {
        type: "string",
        description: "ISO-8601 expiry date for the share (e.g. '2025-12-31T00:00:00Z')",
      },
      max_access_count: {
        type: "number",
        description: "Maximum number of times the secret can be accessed (default: 5)",
        default: 5,
      },
    },
    required: ["secret_id", "email", "expires_at"],
  },
};

/** All MCP tool definitions for 1Claw. */
export const ALL_TOOLS: McpToolDefinition[] = [
  TOOL_GET_SECRET,
  TOOL_SET_SECRET,
  TOOL_LIST_SECRET_KEYS,
  TOOL_DELETE_SECRET,
  TOOL_LIST_VAULTS,
  TOOL_CREATE_VAULT,
  TOOL_REQUEST_APPROVAL,
  TOOL_CHECK_APPROVAL,
  TOOL_PAY_AND_FETCH,
  TOOL_SHARE_SECRET,
];

/** Return all MCP tool definitions for use in agent tool registries. */
export function getMcpToolDefinitions(): McpToolDefinition[] {
  return ALL_TOOLS;
}
