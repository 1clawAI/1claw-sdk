import type { HttpClient } from "../core/http";

export interface RiskEvent {
    id: string;
    occurred_at: string;
    principal_type: "user" | "agent";
    principal_id: string;
    org_id: string;
    event_type: string;
    ip: string | null;
    asn: number | null;
    asn_org: string | null;
    country_code: string | null;
    region: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
    user_agent: string | null;
    payload: Record<string, unknown>;
    created_at: string;
}

export interface RiskVerdict {
    principal_type: string;
    principal_id: string;
    org_id: string;
    score: number;
    severity: "low" | "medium" | "high" | "critical";
    reasons: Array<{
        detector: string;
        severity: string;
        description: string;
        metadata: Record<string, unknown>;
    }>;
    computed_at: string;
    expires_at: string;
}

export interface Honeytoken {
    id: string;
    vault_id: string;
    org_id: string;
    secret_path: string;
    created_by: string;
    created_at: string;
    notes: string | null;
    triggered_count: number;
    last_triggered_at: string | null;
}

export interface CreateHoneytokenRequest {
    vault_id: string;
    secret_path: string;
    notes?: string;
}

export interface ListRiskEventsParams {
    limit?: number;
    offset?: number;
    severity?: string;
    principal_type?: string;
}

export class RiskResource {
    constructor(private readonly http: HttpClient) {}

    async listEvents(params?: ListRiskEventsParams) {
        const query: Record<string, string | number | undefined> = {};
        if (params?.limit) query.limit = params.limit;
        if (params?.offset) query.offset = params.offset;
        if (params?.severity) query.severity = params.severity;
        if (params?.principal_type) query.principal_type = params.principal_type;

        return this.http.requestOrThrow<{ events: RiskEvent[] }>("GET", "/v1/risk/events", {
            query,
        });
    }

    async getVerdict(principalType: string, principalId: string) {
        return this.http.requestOrThrow<{ verdict: RiskVerdict | null }>(
            "GET",
            `/v1/risk/verdicts/${principalType}/${principalId}`,
        );
    }

    async listVerdicts() {
        return this.http.requestOrThrow<{ verdicts: RiskVerdict[] }>("GET", "/v1/risk/verdicts");
    }

    async createHoneytoken(request: CreateHoneytokenRequest) {
        return this.http.requestOrThrow<{ honeytoken: Honeytoken }>(
            "POST",
            "/v1/risk/honeytokens",
            { body: request },
        );
    }

    async listHoneytokens() {
        return this.http.requestOrThrow<{ honeytokens: Honeytoken[] }>(
            "GET",
            "/v1/risk/honeytokens",
        );
    }

    async deleteHoneytoken(id: string) {
        return this.http.requestOrThrow<{ deleted: boolean }>(
            "DELETE",
            `/v1/risk/honeytokens/${id}`,
        );
    }
}
