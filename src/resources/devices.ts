import type { HttpClient } from "../core/http";
import type { OneclawResponse } from "../types";

export interface RegisterDeviceRequest {
    name: string;
    platform: "ios" | "android";
    public_key_pem: string;
    attestation_blob?: string;
}

export interface RegisterDeviceResponse {
    device_id: string;
    attestation_verified: boolean;
}

export interface DeviceResponse {
    id: string;
    name: string;
    platform: string;
    attestation_verified: boolean;
    last_used_at: string | null;
    created_at: string;
}

export interface DeviceListResponse {
    devices: DeviceResponse[];
}

export interface DeviceChallengeRequest {
    action: string;
    target_id: string;
}

export interface DeviceChallengeResponse {
    challenge_nonce: string;
    expires_at: string;
    action_bound_hash: string;
}

export interface DeviceAttestRequest {
    challenge_nonce: string;
    signature: string;
}

export interface DeviceAttestResponse {
    step_up_token: string;
    expires_at: string;
}

export interface PushTokenRequest {
    token: string;
    platform: "apns" | "fcm";
}

/**
 * Devices resource — manage mobile device attestation keys
 * and step-up authentication challenges.
 */
export class DevicesResource {
    constructor(private readonly http: HttpClient) {}

    async register(
        options: RegisterDeviceRequest,
    ): Promise<OneclawResponse<RegisterDeviceResponse>> {
        return this.http.request<RegisterDeviceResponse>(
            "POST",
            "/v1/auth/devices",
            { body: options },
        );
    }

    async list(): Promise<OneclawResponse<DeviceListResponse>> {
        return this.http.request<DeviceListResponse>(
            "GET",
            "/v1/auth/devices",
        );
    }

    async revoke(deviceId: string): Promise<OneclawResponse<void>> {
        return this.http.request<void>(
            "DELETE",
            `/v1/auth/devices/${deviceId}`,
        );
    }

    async createChallenge(
        deviceId: string,
        options: DeviceChallengeRequest,
    ): Promise<OneclawResponse<DeviceChallengeResponse>> {
        return this.http.request<DeviceChallengeResponse>(
            "POST",
            `/v1/auth/devices/${deviceId}/challenge`,
            { body: options },
        );
    }

    async attest(
        deviceId: string,
        options: DeviceAttestRequest,
    ): Promise<OneclawResponse<DeviceAttestResponse>> {
        return this.http.request<DeviceAttestResponse>(
            "POST",
            `/v1/auth/devices/${deviceId}/attest`,
            { body: options },
        );
    }

    async registerPushToken(
        deviceId: string,
        options: PushTokenRequest,
    ): Promise<OneclawResponse<void>> {
        return this.http.request<void>(
            "POST",
            `/v1/auth/devices/${deviceId}/push-token`,
            { body: options },
        );
    }
}
