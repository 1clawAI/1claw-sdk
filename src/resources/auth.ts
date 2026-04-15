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
}
