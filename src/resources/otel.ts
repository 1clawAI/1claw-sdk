import type { HttpClient } from "../core/http";
import type { OneclawResponse } from "../types";

// ---------------------------------------------------------------------------
// Types — mirror vault/src/api/handlers/otel.rs
// ---------------------------------------------------------------------------

export type OtelNodeKind = "agent" | "vault" | "policy" | "connector" | "chain";
export type OtelAgentStatus = "compromised" | "warn" | "suspended" | "ok";

export interface OtelTopologyNode {
    id: string;
    kind: OtelNodeKind;
    label: string;
    /** Agents only. */
    status?: OtelAgentStatus;
    /** Agents only; absent until the trust engine has scored them. */
    trust?: number;
}

export interface OtelTopologyEdge {
    from: string;
    to: string;
    /** `holds` | `grants` | `signs` | `calls` */
    kind: string;
}

export interface OtelTopology {
    nodes: OtelTopologyNode[];
    edges: OtelTopologyEdge[];
    /** True when the 500-node cap applied; `total_nodes` is the pre-cap count. */
    truncated: boolean;
    total_nodes: number;
    fixture?: boolean;
}

export interface OtelBlastRadius {
    vaults: number;
    connectors: number;
    chains: number;
}

export interface OtelThreat {
    id: string;
    agent_id: string;
    class: string;
    severity: "critical" | "warn";
    detected_by: string;
    status: "open" | "acknowledged" | "resolved";
    /** Produced while the trust engine was in recommend-only mode. */
    shadow: boolean;
    evidence: unknown;
    blast_radius: OtelBlastRadius;
    blast_radius_size: number;
    resolved_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface OtelSummary {
    posture_score: number;
    open_threats: number;
    open_critical: number;
    pending_approvals: number;
    agent_count: number;
    top_threats: OtelThreat[];
}

export interface OtelMetricBucket {
    t: string;
    executions: number;
    denials: number;
    transactions: number;
    llm_calls: number;
}

export interface OtelMetrics {
    window: { window_secs: number; step_secs: number };
    buckets: OtelMetricBucket[];
}

export interface OtelFlowEdge {
    agent_id: string;
    agent_name: string;
    vault_id: string;
    vault_name: string;
    reads: number;
    distinct_paths: number;
}

export interface OtelFlows {
    window: { window_secs: number; step_secs: number };
    edges: OtelFlowEdge[];
    total_reads: number;
}

export interface OtelTrustComponents {
    denial_rate: number | null;
    threat_hits: number | null;
    egress_blocks: number | null;
    spend_velocity: number | null;
    off_hours: number | null;
    consensus_bypass: number | null;
}

export interface OtelAgentTrust {
    agent_id: string;
    /** Null until the engine's first cycle reaches this agent. */
    score: number | null;
    shadow: boolean;
    updated_at: string | null;
    /** Null per component means "not measured in this deployment", not zero. */
    components: OtelTrustComponents;
    history: { at: string; score: number }[];
    recent: { at: string; action: string; resource_type: string | null }[];
}

/** One frame from the SSE stream: a signal, or a gap the client must react to. */
export type OtelStreamEvent =
    | { type: "signal"; id: number; signal: OtelSignal }
    | { type: "gap"; skipped?: number; missed?: boolean; reconnect_topology?: boolean };

export interface OtelSignal {
    event_id: number;
    resource: { org_id: string; agent_id?: string; agent_name?: string; runtime_id?: string };
    kind?: string;
    name: string;
    [key: string]: unknown;
}

export interface OtelStreamOptions {
    /** Resume after this event id (sent as `Last-Event-ID`). */
    lastEventId?: number;
    signal?: AbortSignal;
}

// ---------------------------------------------------------------------------
// SSE parsing — pure, so it is testable without a socket
// ---------------------------------------------------------------------------

/**
 * Split accumulated SSE text into complete frames. Returns the parsed frames
 * and whatever trailing partial frame must be kept for the next chunk.
 * Comment lines (`:ping`) are dropped.
 */
export function parseSseFrames(buffer: string): {
    frames: { event: string; id?: string; data: string }[];
    rest: string;
} {
    const frames: { event: string; id?: string; data: string }[] = [];
    // CRLF frames end in "\r\n\r\n", which never contains "\n\n"; normalise
    // first so the separator search sees them.
    let rest = buffer.replace(/\r\n/g, "\n");
    for (;;) {
        const sep = rest.indexOf("\n\n");
        if (sep < 0) break;
        const block = rest.slice(0, sep);
        rest = rest.slice(sep + 2);
        let event = "message";
        let id: string | undefined;
        const data: string[] = [];
        for (const raw of block.split("\n")) {
            const line = raw;
            if (!line || line.startsWith(":")) continue;
            const colon = line.indexOf(":");
            const field = colon < 0 ? line : line.slice(0, colon);
            let value = colon < 0 ? "" : line.slice(colon + 1);
            if (value.startsWith(" ")) value = value.slice(1);
            if (field === "event") event = value;
            else if (field === "id") id = value;
            else if (field === "data") data.push(value);
        }
        if (data.length > 0) frames.push({ event, id, data: data.join("\n") });
    }
    return { frames, rest };
}

/** Turn a parsed frame into a stream event, or null for frames the client ignores. */
export function frameToEvent(frame: { event: string; id?: string; data: string }): OtelStreamEvent | null {
    let payload: unknown;
    try {
        payload = JSON.parse(frame.data);
    } catch {
        return null;
    }
    if (frame.event === "gap") {
        const g = payload as { skipped?: number; missed?: boolean; reconnect_topology?: boolean };
        return { type: "gap", ...g };
    }
    if (frame.event === "signal" || frame.event === "message") {
        const s = payload as OtelSignal;
        const id = frame.id != null ? Number(frame.id) : s.event_id;
        if (!Number.isFinite(id)) return null;
        return { type: "signal", id, signal: s };
    }
    return null;
}

/**
 * Consume an SSE response body as stream events. Shared by the org-wide and
 * the platform-connection streams; the caller opens the request so the
 * auth and path stay with the resource that owns them.
 */
export async function* readSseEvents(res: Response): AsyncGenerator<OtelStreamEvent> {
    if (!res.body) return;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    try {
        for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const { frames, rest } = parseSseFrames(buf);
            buf = rest;
            for (const f of frames) {
                const ev = frameToEvent(f);
                if (ev) yield ev;
            }
        }
    } finally {
        reader.releaseLock();
    }
}

/** Open an SSE request with the client's auth. Throws on a non-2xx status. */
export async function openSse(
    http: HttpClient,
    path: string,
    opts: OtelStreamOptions = {},
): Promise<Response> {
    const headers: Record<string, string> = { Accept: "text/event-stream" };
    const token = http.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (opts.lastEventId != null) headers["Last-Event-ID"] = String(opts.lastEventId);
    const res = await fetch(`${http.getBaseUrl()}${path}`, { headers, signal: opts.signal });
    if (!res.ok) {
        throw new Error(`otel stream ${path} failed: HTTP ${res.status}`);
    }
    return res;
}

// ---------------------------------------------------------------------------
// Resource — human users only (`1ck_` keys or a session JWT); agents are 403
// ---------------------------------------------------------------------------

export class OtelResource {
    constructor(private readonly http: HttpClient) {}

    /** Agent, vault, policy, connector and chain graph for the org. */
    async topology(): Promise<OneclawResponse<OtelTopology>> {
        return this.http.request<OtelTopology>("GET", "/v1/otel/topology");
    }

    /** Durable threat register, highest blast radius first. */
    async threats(state: "open" | "all" = "open"): Promise<OneclawResponse<OtelThreat[]>> {
        return this.http.request<OtelThreat[]>("GET", "/v1/otel/threats", { query: { state } });
    }

    /** Posture score and the counts behind it. */
    async summary(): Promise<OneclawResponse<OtelSummary>> {
        return this.http.request<OtelSummary>("GET", "/v1/otel/summary");
    }

    /** Time-bucketed counts. `window` like `1h`, `24h`, `7d` (max 30d). */
    async metrics(window = "1h", step?: string): Promise<OneclawResponse<OtelMetrics>> {
        return this.http.request<OtelMetrics>("GET", "/v1/otel/metrics", { query: { window, step } });
    }

    /** Who actually read from which vault, counted from audit events. */
    async flows(window = "24h"): Promise<OneclawResponse<OtelFlows>> {
        return this.http.request<OtelFlows>("GET", "/v1/otel/flows", { query: { window } });
    }

    /** The components, 24h history and recent actions behind one agent's trust score. */
    async agentTrust(agentId: string): Promise<OneclawResponse<OtelAgentTrust>> {
        return this.http.request<OtelAgentTrust>("GET", `/v1/otel/agents/${agentId}/trust`);
    }

    /**
     * Live signals as an async iterator. Yields `{type: "gap"}` when the
     * server could not resume from `lastEventId` or the subscriber lagged —
     * refetch `topology()` when `reconnect_topology` is set.
     *
     * ```ts
     * for await (const ev of client.otel.stream({ signal: ac.signal })) {
     *   if (ev.type === "signal") console.log(ev.signal.name);
     * }
     * ```
     */
    async *stream(opts: OtelStreamOptions = {}): AsyncGenerator<OtelStreamEvent> {
        const res = await openSse(this.http, "/v1/otel/stream", opts);
        yield* readSseEvents(res);
    }
}
