import { describe, it, expect, vi, afterEach } from "vitest";
import { HttpClient } from "../core/http";
import { AuthResource, generatePKCE, buildAuthorizeUrl } from "../resources/auth";
import { PlatformResource } from "../resources/platform";
import { DiscoveryResource } from "../resources/discovery";

const BASE = "https://api.test";
const originalFetch = globalThis.fetch;

function mockFetch(status: number, body: unknown) {
    return vi.fn().mockResolvedValue({
        ok: status >= 200 && status < 300,
        status,
        headers: new Headers(),
        json: () => Promise.resolve(body),
    } as unknown as Response);
}

function makeHttp(token = "test-jwt") {
    return new HttpClient({ baseUrl: BASE, token });
}

function lastCall() {
    const f = globalThis.fetch as ReturnType<typeof vi.fn>;
    return { url: f.mock.calls[0][0] as string, init: f.mock.calls[0][1] as RequestInit };
}

afterEach(() => {
    globalThis.fetch = originalFetch;
});

// ---------------------------------------------------------------------------
// generatePKCE
// ---------------------------------------------------------------------------
describe("generatePKCE", () => {
    it("returns a codeVerifier of 43 characters (base64url of 32 bytes)", async () => {
        const pkce = await generatePKCE();
        expect(pkce.codeVerifier).toBeDefined();
        expect(pkce.codeVerifier.length).toBeGreaterThanOrEqual(43);
        expect(pkce.codeVerifier.length).toBeLessThanOrEqual(128);
    });

    it("returns a codeChallenge that is valid base64url", async () => {
        const pkce = await generatePKCE();
        expect(pkce.codeChallenge).toBeDefined();
        expect(pkce.codeChallenge).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it("codeVerifier contains only base64url characters (no +, /, =)", async () => {
        const pkce = await generatePKCE();
        expect(pkce.codeVerifier).not.toMatch(/[+/=]/);
    });

    it("produces different values on each call", async () => {
        const a = await generatePKCE();
        const b = await generatePKCE();
        expect(a.codeVerifier).not.toBe(b.codeVerifier);
        expect(a.codeChallenge).not.toBe(b.codeChallenge);
    });

    it("codeChallenge is the SHA-256 digest of codeVerifier (base64url)", async () => {
        const pkce = await generatePKCE();
        const digest = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(pkce.codeVerifier),
        );
        const expected = btoa(String.fromCharCode(...new Uint8Array(digest)))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
        expect(pkce.codeChallenge).toBe(expected);
    });
});

// ---------------------------------------------------------------------------
// buildAuthorizeUrl
// ---------------------------------------------------------------------------
describe("buildAuthorizeUrl", () => {
    it("constructs URL with required params", () => {
        const url = buildAuthorizeUrl("https://1claw.co", {
            clientId: "app-123",
            redirectUri: "https://example.com/callback",
        });

        const parsed = new URL(url);
        expect(parsed.origin).toBe("https://1claw.co");
        expect(parsed.pathname).toBe("/oauth/authorize");
        expect(parsed.searchParams.get("client_id")).toBe("app-123");
        expect(parsed.searchParams.get("redirect_uri")).toBe("https://example.com/callback");
        expect(parsed.searchParams.get("response_type")).toBe("code");
    });

    it("includes scopes when provided", () => {
        const url = buildAuthorizeUrl("https://1claw.co", {
            clientId: "app-123",
            redirectUri: "https://example.com/callback",
            scopes: ["openid", "profile", "email"],
        });

        const parsed = new URL(url);
        expect(parsed.searchParams.get("scope")).toBe("openid profile email");
    });

    it("includes state when provided", () => {
        const url = buildAuthorizeUrl("https://1claw.co", {
            clientId: "app-123",
            redirectUri: "https://example.com/callback",
            state: "random-state-value",
        });

        const parsed = new URL(url);
        expect(parsed.searchParams.get("state")).toBe("random-state-value");
    });

    it("includes PKCE code_challenge and code_challenge_method", () => {
        const url = buildAuthorizeUrl("https://1claw.co", {
            clientId: "app-123",
            redirectUri: "https://example.com/callback",
            codeChallenge: "challenge-hash-value",
        });

        const parsed = new URL(url);
        expect(parsed.searchParams.get("code_challenge")).toBe("challenge-hash-value");
        expect(parsed.searchParams.get("code_challenge_method")).toBe("S256");
    });

    it("omits optional params when not provided", () => {
        const url = buildAuthorizeUrl("https://1claw.co", {
            clientId: "app-123",
            redirectUri: "https://example.com/callback",
        });

        const parsed = new URL(url);
        expect(parsed.searchParams.has("scope")).toBe(false);
        expect(parsed.searchParams.has("state")).toBe(false);
        expect(parsed.searchParams.has("code_challenge")).toBe(false);
        expect(parsed.searchParams.has("code_challenge_method")).toBe(false);
    });

    it("defaults response_type to 'code'", () => {
        const url = buildAuthorizeUrl("https://1claw.co", {
            clientId: "app-123",
            redirectUri: "https://example.com/callback",
        });

        expect(new URL(url).searchParams.get("response_type")).toBe("code");
    });
});

// ---------------------------------------------------------------------------
// AuthResource — OAuth token methods
// ---------------------------------------------------------------------------
describe("AuthResource — OAuth", () => {
    it("revokeToken sends POST /v1/oauth/revoke with token in body", async () => {
        globalThis.fetch = mockFetch(200, { revoked: true });
        const res = await new AuthResource(makeHttp()).revokeToken({ token: "some-token-value" });

        const { url, init } = lastCall();
        expect(url).toBe(`${BASE}/v1/oauth/revoke`);
        expect(init.method).toBe("POST");
        expect(JSON.parse(init.body as string).token).toBe("some-token-value");
        expect(res.data?.revoked).toBe(true);
    });

    it("revokeToken accepts optional token_type_hint", async () => {
        globalThis.fetch = mockFetch(200, { revoked: true });
        await new AuthResource(makeHttp()).revokeToken({
            token: "rt_abc",
            token_type_hint: "refresh_token",
        });

        const body = JSON.parse(lastCall().init.body as string);
        expect(body.token_type_hint).toBe("refresh_token");
    });

    it("revokeConsent sends DELETE /v1/oauth/consents/{appId}", async () => {
        globalThis.fetch = mockFetch(200, { revoked: true, app_id: "app-uuid-123" });
        const res = await new AuthResource(makeHttp()).revokeConsent("app-uuid-123");

        const { url, init } = lastCall();
        expect(url).toBe(`${BASE}/v1/oauth/consents/app-uuid-123`);
        expect(init.method).toBe("DELETE");
        expect(res.data?.app_id).toBe("app-uuid-123");
    });

    it("getUserInfo sends GET /v1/oauth/userinfo", async () => {
        globalThis.fetch = mockFetch(200, {
            sub: "user-uuid",
            email: "user@example.com",
            name: "Test User",
            wallet_address: "0xabc",
        });
        const res = await new AuthResource(makeHttp()).getUserInfo();

        const { url, init } = lastCall();
        expect(url).toBe(`${BASE}/v1/oauth/userinfo`);
        expect(init.method).toBe("GET");
        expect(res.data?.sub).toBe("user-uuid");
        expect(res.data?.email).toBe("user@example.com");
    });

    it("getUserInfo with explicit accessToken uses Authorization header", async () => {
        globalThis.fetch = mockFetch(200, { sub: "user-uuid" });
        await new AuthResource(makeHttp()).getUserInfo("custom-access-token");

        const { init } = lastCall();
        const headers = init.headers as Record<string, string>;
        expect(headers["Authorization"]).toBe("Bearer custom-access-token");
    });

    it("exchangeOAuthCode sends POST /v1/oauth/token with code and client_id", async () => {
        globalThis.fetch = mockFetch(200, {
            access_token: "oauth-jwt",
            token_type: "Bearer",
            expires_in: 3600,
            refresh_token: "rt_abc",
            id_token: "id.jwt.here",
        });
        const http = makeHttp("");
        const res = await new AuthResource(http).exchangeOAuthCode({
            code: "auth-code-123",
            client_id: "app-123",
            redirect_uri: "https://example.com/callback",
            code_verifier: "pkce-verifier-value",
        });

        const { url, init } = lastCall();
        expect(url).toBe(`${BASE}/v1/oauth/token`);
        expect(init.method).toBe("POST");
        const body = JSON.parse(init.body as string);
        expect(body.grant_type).toBe("authorization_code");
        expect(body.code).toBe("auth-code-123");
        expect(body.code_verifier).toBe("pkce-verifier-value");
        expect(res.data?.access_token).toBe("oauth-jwt");
        expect(res.data?.refresh_token).toBe("rt_abc");
        expect(http.getToken()).toBe("oauth-jwt");
    });

    it("exchangeOAuthCode defaults grant_type to authorization_code", async () => {
        globalThis.fetch = mockFetch(200, { access_token: "jwt" });
        await new AuthResource(makeHttp("")).exchangeOAuthCode({
            code: "c",
            client_id: "app",
            redirect_uri: "https://example.com",
        });

        const body = JSON.parse(lastCall().init.body as string);
        expect(body.grant_type).toBe("authorization_code");
    });
});

// ---------------------------------------------------------------------------
// PlatformResource — new methods
// ---------------------------------------------------------------------------
describe("PlatformResource", () => {
    it("rotateWebhookSecret sends POST to /rotate-webhook-secret", async () => {
        globalThis.fetch = mockFetch(200, { webhook_secret: "whsec_abc123" });
        const res = await new PlatformResource(makeHttp()).rotateWebhookSecret("app-1");

        const { url, init } = lastCall();
        expect(url).toBe(`${BASE}/v1/platform/apps/app-1/rotate-webhook-secret`);
        expect(init.method).toBe("POST");
        expect(res.data?.webhook_secret).toBe("whsec_abc123");
    });

    it("getAppStats sends GET to /stats", async () => {
        globalThis.fetch = mockFetch(200, {
            total_connections: 42,
            active_connections: 30,
            claimed_connections: 10,
            total_bootstraps: 25,
            total_grants: 15,
        });
        const res = await new PlatformResource(makeHttp()).getAppStats("app-1");

        const { url, init } = lastCall();
        expect(url).toBe(`${BASE}/v1/platform/apps/app-1/stats`);
        expect(init.method).toBe("GET");
        expect(res.data?.total_connections).toBe(42);
        expect(res.data?.active_connections).toBe(30);
        expect(res.data?.total_grants).toBe(15);
    });

    it("createApp sends POST /v1/platform/apps", async () => {
        globalThis.fetch = mockFetch(201, {
            app: { id: "app-1", name: "My App" },
            api_key: "plt_xyz",
        });
        const res = await new PlatformResource(makeHttp()).createApp({
            name: "My App",
            slug: "my-app",
        });

        const { url, init } = lastCall();
        expect(url).toBe(`${BASE}/v1/platform/apps`);
        expect(init.method).toBe("POST");
        expect(JSON.parse(init.body as string).slug).toBe("my-app");
        expect(res.data?.api_key).toBe("plt_xyz");
    });

    it("rotateKey sends POST to /rotate-key", async () => {
        globalThis.fetch = mockFetch(200, { api_key: "plt_new", prefix: "plt_new_pre" });
        const res = await new PlatformResource(makeHttp()).rotateKey("app-1");

        const { url, init } = lastCall();
        expect(url).toBe(`${BASE}/v1/platform/apps/app-1/rotate-key`);
        expect(init.method).toBe("POST");
        expect(res.data?.api_key).toBe("plt_new");
    });

    it("listApps sends GET /v1/platform/apps", async () => {
        globalThis.fetch = mockFetch(200, { apps: [] });
        const res = await new PlatformResource(makeHttp()).listApps();

        expect(lastCall().url).toBe(`${BASE}/v1/platform/apps`);
        expect(res.data?.apps).toEqual([]);
    });

    it("deleteApp sends DELETE /v1/platform/apps/{id}", async () => {
        globalThis.fetch = mockFetch(204, null);
        await new PlatformResource(makeHttp()).deleteApp("app-1");

        expect(lastCall().init.method).toBe("DELETE");
        expect(lastCall().url).toBe(`${BASE}/v1/platform/apps/app-1`);
    });

    it("upsertUser sends POST /v1/platform/users/upsert", async () => {
        globalThis.fetch = mockFetch(200, {
            user_handle: "usr-1",
            connection_id: "conn-1",
            is_new: true,
        });
        await new PlatformResource(makeHttp()).upsertUser({ email: "user@test.com" });

        const { url, init } = lastCall();
        expect(url).toBe(`${BASE}/v1/platform/users/upsert`);
        expect(init.method).toBe("POST");
        expect(JSON.parse(init.body as string).email).toBe("user@test.com");
    });

    it("bootstrapUser sends POST to /connections/{id}/bootstrap", async () => {
        globalThis.fetch = mockFetch(200, {
            claim_url: "https://1claw.co/connect/slug/claim/ct_abc",
            claim_token: "ct_abc",
            connection_id: "conn-1",
        });
        await new PlatformResource(makeHttp()).bootstrapUser("conn-1", {
            template_id: "tmpl-1",
        });

        const { url, init } = lastCall();
        expect(url).toBe(`${BASE}/v1/platform/connections/conn-1/bootstrap`);
        expect(init.method).toBe("POST");
    });

    it("grantAccess sends POST to /connections/{id}/grant", async () => {
        globalThis.fetch = mockFetch(200, {
            connection_id: "conn-1",
            grants: [],
            vault_ids: ["v-1"],
            agent_ids: [],
        });
        await new PlatformResource(makeHttp()).grantAccess("conn-1", {
            vault_ids: ["v-1"],
        });

        const { url, init } = lastCall();
        expect(url).toBe(`${BASE}/v1/platform/connections/conn-1/grant`);
        expect(init.method).toBe("POST");
    });

    it("revokeGrant sends DELETE to /connections/{id}/grants/{grantId}", async () => {
        globalThis.fetch = mockFetch(204, null);
        await new PlatformResource(makeHttp()).revokeGrant("conn-1", "grant-1");

        expect(lastCall().url).toBe(`${BASE}/v1/platform/connections/conn-1/grants/grant-1`);
        expect(lastCall().init.method).toBe("DELETE");
    });

    it("createSpendPolicy sends POST to /spend-policies", async () => {
        globalThis.fetch = mockFetch(201, { id: "sp-1" });
        await new PlatformResource(makeHttp()).createSpendPolicy("app-1", {
            max_value_per_tx_eth: "0.5",
            daily_limit_eth: "2.0",
        });

        const { url, init } = lastCall();
        expect(url).toBe(`${BASE}/v1/platform/apps/app-1/spend-policies`);
        expect(init.method).toBe("POST");
    });
});

// ---------------------------------------------------------------------------
// DiscoveryResource — marketplace
// ---------------------------------------------------------------------------
describe("DiscoveryResource — marketplace", () => {
    it("marketplace sends GET /v1/platform/marketplace", async () => {
        globalThis.fetch = mockFetch(200, { apps: [] });
        const res = await new DiscoveryResource(makeHttp()).marketplace();

        expect(lastCall().url).toBe(`${BASE}/v1/platform/marketplace`);
        expect(lastCall().init.method).toBe("GET");
        expect(res.data?.apps).toEqual([]);
    });
});
