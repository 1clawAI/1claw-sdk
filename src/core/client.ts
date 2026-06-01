import type { OneclawClientConfig } from "../types";
import { HttpClient } from "./http";
import { VaultResource } from "../resources/vault";
import { SecretsResource } from "../resources/secrets";
import { AccessResource } from "../resources/access";
import { AgentsResource } from "../resources/agents";
import { SharingResource } from "../resources/sharing";
import { ApprovalsResource } from "../resources/approvals";
import { BillingResource } from "../resources/billing";
import { AuditResource } from "../resources/audit";
import { OrgResource } from "../resources/org";
import { AuthResource } from "../resources/auth";
import { ApiKeysResource } from "../resources/api-keys";
import { ChainsResource } from "../resources/chains";
import { X402Resource } from "../resources/x402";
import { TreasuryResource } from "../resources/treasury";
import { SigningKeysResource } from "../resources/signing-keys";
import { TreasuryWalletsResource } from "../resources/treasury-wallets";
import { PlatformResource } from "../resources/platform";
import { DevicesResource } from "../resources/devices";
import { PasskeysResource } from "../resources/passkeys";
import { DepositDestinationsResource } from "../resources/deposit-destinations";
import { InternalAccountsResource } from "../resources/internal-accounts";
import { FiatResource } from "../resources/fiat";

/**
 * The main 1Claw SDK client. All API resources are exposed as
 * namespaced properties for discoverability and tree-shaking.
 *
 * @example
 * ```ts
 * import { createClient } from "@1claw/sdk";
 *
 * const client = createClient({
 *   baseUrl: "https://api.1claw.xyz",
 *   apiKey: "ocv_...",
 * });
 *
 * // Authenticate (exchanges API key for a JWT)
 * await client.auth.apiKeyToken({ api_key: "ocv_..." });
 *
 * // Use resources
 * const vaults = await client.vault.list();
 * const secret = await client.secrets.get(vaultId, "my-key");
 * ```
 */
export class OneclawClient {
    private readonly http: HttpClient;

    /** Vault management — create, list, get, delete vaults. */
    readonly vault: VaultResource;
    /** Secret management — store, retrieve, list, rotate, delete secrets. */
    readonly secrets: SecretsResource;
    /** Access control — grant/revoke policies for humans and agents. */
    readonly access: AccessResource;
    /** Agent management — register, update, delete agents and rotate keys. */
    readonly agents: AgentsResource;
    /** Secret sharing — create and manage time-limited share links. */
    readonly sharing: SharingResource;
    /** Human-in-the-loop approvals — request, review, approve/deny. */
    readonly approvals: ApprovalsResource;
    /** Billing and usage — view usage summaries and per-request history. */
    readonly billing: BillingResource;
    /** Audit log — query the immutable audit trail. */
    readonly audit: AuditResource;
    /** Organization — manage members and roles. */
    readonly org: OrgResource;
    /** Authentication — login, agent auth, API key auth, Google OAuth. */
    readonly auth: AuthResource;
    /** API keys — create, list, and revoke personal API keys. */
    readonly apiKeys: ApiKeysResource;
    /** Supported blockchains — list chains and manage RPC configuration. */
    readonly chains: ChainsResource;
    /** x402 payment protocol — inspect, pay, and verify micropayments. */
    readonly x402: X402Resource;
    /** Safe multisig treasuries — CRUD, signers, agent access requests. */
    readonly treasury: TreasuryResource;
    /** Multi-chain signing keys — create, list, rotate, deactivate per-agent keys. */
    readonly signingKeys: SigningKeysResource;
    /** Treasury wallets — multi-chain wallet generation for human users. */
    readonly treasuryWallets: TreasuryWalletsResource;
    /** Platform API — build multi-tenant apps on top of 1Claw. */
    readonly platform: PlatformResource;
    /** Mobile device attestation — register devices, step-up auth. */
    readonly devices: DevicesResource;
    /** WebAuthn passkeys — register and assert FIDO2 credentials. */
    readonly passkeys: PasskeysResource;
    /** Deposit destinations — unique addresses for tracking incoming payments. */
    readonly depositDestinations: DepositDestinationsResource;
    /** Internal accounts — off-chain double-entry ledger for instant transfers. */
    readonly internalAccounts: InternalAccountsResource;
    /** Fiat on/off ramps — buy and sell crypto via partner integrations. */
    readonly fiat: FiatResource;

    constructor(config: OneclawClientConfig) {
        this.http = new HttpClient(config);

        if (config.apiKey && !config.token && !config.agentId) {
            // ocv_ keys are agent keys — HttpClient handles token exchange.
            // 1ck_ keys are user keys — need a one-time token exchange here.
            if (!config.apiKey.startsWith("ocv_")) {
                this.autoAuthenticateUserKey(config);
            }
        }

        this.vault = new VaultResource(this.http);
        this.secrets = new SecretsResource(this.http);
        this.access = new AccessResource(this.http);
        this.agents = new AgentsResource(this.http);
        this.sharing = new SharingResource(this.http);
        this.approvals = new ApprovalsResource(this.http);
        this.billing = new BillingResource(this.http);
        this.audit = new AuditResource(this.http);
        this.org = new OrgResource(this.http);
        this.auth = new AuthResource(this.http);
        this.apiKeys = new ApiKeysResource(this.http);
        this.chains = new ChainsResource(this.http);
        this.x402 = new X402Resource(this.http, config.x402Signer);
        this.treasury = new TreasuryResource(this.http);
        this.signingKeys = new SigningKeysResource(this.http);
        this.treasuryWallets = new TreasuryWalletsResource(this.http);
        this.platform = new PlatformResource(this.http);
        this.devices = new DevicesResource(this.http);
        this.passkeys = new PasskeysResource(this.http);
        this.depositDestinations = new DepositDestinationsResource(this.http);
        this.internalAccounts = new InternalAccountsResource(this.http);
        this.fiat = new FiatResource(this.http);
    }

    private autoAuthenticateUserKey(config: OneclawClientConfig): void {
        const authPromise = this.http
            .request<{ access_token: string }>("POST", "/v1/auth/api-key-token", {
                body: { api_key: config.apiKey },
            })
            .then((res) => {
                if (res.data?.access_token)
                    this.http.setToken(res.data.access_token);
            });

        authPromise.catch(() => {
            /* auth failure will surface on the next request */
        });
    }
}

/**
 * Factory function to create a new 1Claw SDK client.
 *
 * @example
 * ```ts
 * // User with API key
 * const client = createClient({
 *   baseUrl: "https://api.1claw.xyz",
 *   apiKey: "ocv_...",
 * });
 *
 * // Agent with API key
 * const agent = createClient({
 *   baseUrl: "https://api.1claw.xyz",
 *   apiKey: "ocv_...",
 *   agentId: "agent-uuid",
 * });
 *
 * // Pre-authenticated with JWT
 * const authed = createClient({
 *   baseUrl: "https://api.1claw.xyz",
 *   token: "eyJ...",
 * });
 * ```
 */
export function createClient(config: OneclawClientConfig): OneclawClient {
    return new OneclawClient(config);
}
