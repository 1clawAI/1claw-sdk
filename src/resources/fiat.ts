import type { HttpClient } from "../core/http";
import type { OneclawResponse } from "../types";

export interface FiatOnrampSessionRequest {
    chain: string;
    asset?: string;
    amount_usd?: string;
    destination_address?: string;
}

export interface FiatOnrampSessionResponse {
    session_url: string;
    provider: string;
    destination_address: string;
    chain: string;
    asset: string;
}

export interface FiatOfframpInitiateRequest {
    chain: string;
    asset: string;
    amount: string;
    source_address?: string;
}

export interface FiatOfframpResponse {
    id: string;
    provider: string;
    widget_url: string;
    status: string;
    chain: string;
    asset: string;
    amount: string;
}

export class FiatResource {
    constructor(private readonly http: HttpClient) {}

    async createOnrampSession(
        body: FiatOnrampSessionRequest,
    ): Promise<OneclawResponse<FiatOnrampSessionResponse>> {
        return this.http.request<FiatOnrampSessionResponse>(
            "POST",
            "/v1/fiat/onramp/session",
            { body },
        );
    }

    async initiateOfframp(
        body: FiatOfframpInitiateRequest,
    ): Promise<OneclawResponse<FiatOfframpResponse>> {
        return this.http.request<FiatOfframpResponse>(
            "POST",
            "/v1/fiat/offramp/initiate",
            { body },
        );
    }
}
