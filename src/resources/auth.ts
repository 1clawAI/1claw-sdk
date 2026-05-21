import type { HttpClient } from "../core/http";
import type {
    TokenRequest,
    AgentTokenRequest,
    UserApiKeyTokenRequest,
    GoogleAuthRequest,
    SignupRequest,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    TokenResponse,
    TokenExchangeRequest,
    TokenExchangeResponse,
    UserProfileResponse,
    UpdateProfileRequest,
    DeleteAccountRequest,
    ExportDataResponse,
    OneclawResponse,
} from "../types";

/**
 * Auth resource — authenticate users and agents, manage sessions.
 * Successful authentication automatically stores the JWT on the client
 * so subsequent requests are authenticated.
 */
export class AuthResource {
    constructor(private readonly http: HttpClient) {}

    /**
     * Authenticate with email and password.
     * Stores the resulting JWT for subsequent requests.
     */
    async login(
        credentials: TokenRequest,
    ): Promise<OneclawResponse<TokenResponse>> {
        const res = await this.http.request<TokenResponse>(
            "POST",
            "/v1/auth/token",
            { body: credentials },
        );
        if (res.data?.access_token) {
            this.http.setToken(res.data.access_token);
        }
        return res;
    }

    /**
     * Create a new account with email and password.
     * Creates a new organization, returns a JWT, and automatically
     * claims any pending email-based secret shares.
     */
    async signup(
        credentials: SignupRequest,
    ): Promise<OneclawResponse<TokenResponse>> {
        const res = await this.http.request<TokenResponse>(
            "POST",
            "/v1/auth/signup",
            { body: credentials },
        );
        if (res.data?.access_token) {
            this.http.setToken(res.data.access_token);
        }
        return res;
    }

    /**
     * Authenticate an agent using its ID and API key.
     * Stores the resulting JWT for subsequent requests.
     */
    async agentToken(
        credentials: AgentTokenRequest,
    ): Promise<OneclawResponse<TokenResponse>> {
        const res = await this.http.request<TokenResponse>(
            "POST",
            "/v1/auth/agent-token",
            { body: credentials },
        );
        if (res.data?.access_token) {
            this.http.setToken(res.data.access_token);
        }
        return res;
    }

    /**
     * Authenticate with a user API key (prefix `ocv_`).
     * Stores the resulting JWT for subsequent requests.
     */
    async apiKeyToken(
        credentials: UserApiKeyTokenRequest,
    ): Promise<OneclawResponse<TokenResponse>> {
        const res = await this.http.request<TokenResponse>(
            "POST",
            "/v1/auth/api-key-token",
            { body: credentials },
        );
        if (res.data?.access_token) {
            this.http.setToken(res.data.access_token);
        }
        return res;
    }

    /**
     * Authenticate with a Google ID token (OAuth2 flow).
     * Stores the resulting JWT for subsequent requests.
     */
    async google(
        credentials: GoogleAuthRequest,
    ): Promise<OneclawResponse<TokenResponse>> {
        const res = await this.http.request<TokenResponse>(
            "POST",
            "/v1/auth/google",
            { body: credentials },
        );
        if (res.data?.access_token) {
            this.http.setToken(res.data.access_token);
        }
        return res;
    }

    /** Change the current user's password. */
    async changePassword(
        request: ChangePasswordRequest,
    ): Promise<OneclawResponse<void>> {
        return this.http.request<void>("POST", "/v1/auth/change-password", {
            body: request,
        });
    }

    /**
     * Set a password for a platform_oidc user (no current password required).
     * Only works when the user has never set a password before.
     */
    async setPassword(
        request: { password: string; password_confirm: string },
    ): Promise<OneclawResponse<{ message: string }>> {
        return this.http.request<{ message: string }>("POST", "/v1/auth/set-password", {
            body: request,
        });
    }

    /**
     * Request an email change. Sends a verification code to the new email.
     */
    async changeEmail(
        request: { new_email: string },
    ): Promise<OneclawResponse<{ message: string; new_email: string; expires_in_seconds: number }>> {
        return this.http.request<{ message: string; new_email: string; expires_in_seconds: number }>(
            "POST",
            "/v1/auth/change-email",
            { body: request },
        );
    }

    /**
     * Verify an email change with the code sent to the new address.
     */
    async verifyEmailChange(
        request: { code: string },
    ): Promise<OneclawResponse<{ message: string; email: string }>> {
        return this.http.request<{ message: string; email: string }>(
            "POST",
            "/v1/auth/verify-email-change",
            { body: request },
        );
    }

    /**
     * Request a password reset email (email/password accounts only).
     * Always returns a generic success message (no email enumeration).
     */
    async forgotPassword(
        request: ForgotPasswordRequest,
    ): Promise<OneclawResponse<ForgotPasswordResponse>> {
        return this.http.request<ForgotPasswordResponse>(
            "POST",
            "/v1/auth/forgot-password",
            { body: request, skipAuth: true },
        );
    }

    /** Complete password reset using the token from the email. */
    async resetPassword(
        request: ResetPasswordRequest,
    ): Promise<OneclawResponse<ResetPasswordResponse>> {
        return this.http.request<ResetPasswordResponse>(
            "POST",
            "/v1/auth/reset-password",
            { body: request, skipAuth: true },
        );
    }

    /** Revoke the current session token. */
    async logout(): Promise<OneclawResponse<void>> {
        const res = await this.http.request<void>("DELETE", "/v1/auth/token");
        this.http.setToken("");
        return res;
    }

    /** Get the current user's profile. */
    async getMe(): Promise<OneclawResponse<UserProfileResponse>> {
        return this.http.request<UserProfileResponse>("GET", "/v1/auth/me");
    }

    /** Update the current user's profile (display name, marketing opt-in). */
    async updateMe(
        update: UpdateProfileRequest,
    ): Promise<OneclawResponse<UserProfileResponse>> {
        return this.http.request<UserProfileResponse>("PATCH", "/v1/auth/me", {
            body: update,
        });
    }

    /** Delete the current user's account and all associated data. */
    async deleteMe(
        request: DeleteAccountRequest,
    ): Promise<OneclawResponse<void>> {
        return this.http.request<void>("DELETE", "/v1/auth/me", {
            body: request,
        });
    }

    /** Export the current user's personal data (GDPR/data-portability). */
    async exportData(): Promise<OneclawResponse<ExportDataResponse>> {
        return this.http.request<ExportDataResponse>(
            "POST",
            "/v1/auth/export-data",
        );
    }

    /**
     * Exchange a 1claw subject token for a short-lived OIDC federation JWT
     * (RFC 8693). The returned `access_token` is signed with RS256 and is
     * meant for external relying parties such as Anthropic Workload Identity
     * Federation, GCP STS, AWS STS, etc.
     *
     * If `subjectToken` is omitted, the SDK uses the current client token.
     * The agent must have `federation_enabled = true` and the `audience`
     * must be on its `federation_audiences` allowlist.
     */
    async exchangeFederatedToken(
        request: TokenExchangeRequest,
    ): Promise<OneclawResponse<TokenExchangeResponse>> {
        const subjectToken = request.subjectToken ?? this.http.getToken();
        if (!subjectToken) {
            return {
                data: null,
                error: {
                    type: "invalid_request",
                    message:
                        "exchangeFederatedToken requires either an explicit subjectToken or an authenticated client.",
                },
                meta: { status: 400 },
            };
        }
        const subjectTokenType = subjectToken.startsWith("ocv_")
            ? "urn:1claw:params:oauth:token-type:api-key"
            : "urn:ietf:params:oauth:token-type:jwt";
        const body: Record<string, string> = {
            grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
            subject_token: subjectToken,
            subject_token_type: subjectTokenType,
            audience: request.audience,
        };
        if (request.scope) {
            body.scope = request.scope;
        }
        return this.http.request<TokenExchangeResponse>(
            "POST",
            "/v1/auth/federated-token",
            { body, skipAuth: true },
        );
    }
}
