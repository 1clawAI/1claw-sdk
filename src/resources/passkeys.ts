import type { HttpClient } from "../core/http";
import type { OneclawResponse } from "../types";

export interface PasskeyRegisterBeginResponse {
    challenge: string;
    rp_id: string;
    rp_name: string;
    user_id: string;
    user_name: string;
    user_display_name: string;
    attestation: string;
    authenticator_selection: {
        authenticator_attachment: string;
        resident_key: string;
        user_verification: string;
    };
}

export interface PasskeyRegisterCompleteRequest {
    credential_id: string;
    attestation_object: string;
    client_data_json: string;
    transports?: string[];
    name?: string;
}

export interface PasskeyRegisterCompleteResponse {
    passkey_id: string;
    credential_id: string;
}

export interface PasskeyAssertBeginRequest {
    email?: string;
}

export interface PasskeyAssertBeginResponse {
    challenge: string;
    rp_id: string;
    timeout: number;
    user_verification: string;
    allow_credentials: Array<{
        id: string;
        type: string;
        transports?: string[];
    }>;
}

export interface PasskeyAssertCompleteRequest {
    credential_id: string;
    authenticator_data: string;
    client_data_json: string;
    signature: string;
}

export interface PasskeyAssertCompleteResponse {
    token: string;
    refresh_token: string;
    user: {
        id: string;
        email: string;
        display_name: string | null;
        org_id: string;
    };
}

export interface PasskeyResponse {
    id: string;
    credential_id: string;
    name: string | null;
    transports: string[] | null;
    last_used_at: string | null;
    created_at: string;
}

export interface PasskeyListResponse {
    passkeys: PasskeyResponse[];
}

/**
 * Passkeys resource — WebAuthn/FIDO2 passkey registration and assertion.
 */
export class PasskeysResource {
    constructor(private readonly http: HttpClient) {}

    async registerBegin(): Promise<
        OneclawResponse<PasskeyRegisterBeginResponse>
    > {
        return this.http.request<PasskeyRegisterBeginResponse>(
            "POST",
            "/v1/auth/passkeys/register/begin",
        );
    }

    async registerComplete(
        options: PasskeyRegisterCompleteRequest,
    ): Promise<OneclawResponse<PasskeyRegisterCompleteResponse>> {
        return this.http.request<PasskeyRegisterCompleteResponse>(
            "POST",
            "/v1/auth/passkeys/register/complete",
            { body: options },
        );
    }

    async assertBegin(
        options?: PasskeyAssertBeginRequest,
    ): Promise<OneclawResponse<PasskeyAssertBeginResponse>> {
        return this.http.request<PasskeyAssertBeginResponse>(
            "POST",
            "/v1/auth/passkey-assert/begin",
            { body: options ?? {} },
        );
    }

    async assertComplete(
        options: PasskeyAssertCompleteRequest,
    ): Promise<OneclawResponse<PasskeyAssertCompleteResponse>> {
        return this.http.request<PasskeyAssertCompleteResponse>(
            "POST",
            "/v1/auth/passkey-assert/complete",
            { body: options },
        );
    }

    async list(): Promise<OneclawResponse<PasskeyListResponse>> {
        return this.http.request<PasskeyListResponse>(
            "GET",
            "/v1/auth/passkeys",
        );
    }

    async revoke(passkeyId: string): Promise<OneclawResponse<void>> {
        return this.http.request<void>(
            "DELETE",
            `/v1/auth/passkeys/${passkeyId}`,
        );
    }
}
