import type { HttpClient } from "../core/http";
import type {
    Peer,
    PeerWithFacts,
    CreatePeerRequest,
    PeerContextResponse,
    PredictApprovalRequest,
    PredictApprovalResponse,
    OneclawResponse,
} from "../types";

/**
 * Peer memory — a shared model of one human, across the agents serving them.
 *
 * An agent reaches a peer only by being named in its observer list. Being in
 * the same organisation, or the same platform connection, grants nothing.
 */
export class PeersResource {
    constructor(private readonly http: HttpClient) {}

    /**
     * Create a peer and name its observers. Human users only — this decides
     * which agents may read a model of a person.
     *
     * Idempotent by `(peer_type, peer_ref)`; observers merge rather than
     * replace, so a second call does not revoke agents already watching.
     */
    async create(body: CreatePeerRequest): Promise<OneclawResponse<{ peer: Peer }>> {
        return this.http.request("POST", "/v1/peers", { body });
    }

    async get(peerId: string): Promise<OneclawResponse<PeerWithFacts>> {
        return this.http.request("GET", `/v1/peers/${peerId}`);
    }

    /**
     * A blob for prompt injection. Best-supported facts first, so a tight
     * budget drops the least-supported beliefs — and a human-corrected fact is
     * the last thing cut.
     *
     * Empty when nothing has been derived yet, rather than a header describing
     * nobody.
     */
    async getContext(
        peerId: string,
        budget?: number,
    ): Promise<OneclawResponse<PeerContextResponse>> {
        const qs = budget ? `?budget=${budget}` : "";
        return this.http.request("GET", `/v1/peers/${peerId}/context${qs}`);
    }

    /** Record something observed: a message, an approval, an action. */
    async recordEvent(
        peerId: string,
        eventType: "message" | "approval" | "action" | "observation",
        content: Record<string, unknown>,
    ): Promise<OneclawResponse<{ event_id: string }>> {
        return this.http.request("POST", `/v1/peers/${peerId}/events`, {
            body: { event_type: eventType, content },
        });
    }

    /**
     * How has this person decided this before, and does policy already permit
     * it automatically?
     *
     * These are two different questions. `likelihood` is an observation about a
     * person; `suggest_auto` is a statement about your own
     * `action_approval_policy`. A confident prediction never becomes new
     * authority — if no rule covers the action, `suggest_auto` is false with
     * `blocked_reason: "no_matching_rule"`.
     */
    async predictApproval(
        peerId: string,
        body: PredictApprovalRequest,
    ): Promise<OneclawResponse<PredictApprovalResponse>> {
        return this.http.request("POST", `/v1/peers/${peerId}/predict-approval`, {
            body,
        });
    }

    /** Resolve the peer for a platform connection. */
    async getByConnection(
        connectionId: string,
    ): Promise<OneclawResponse<{ peer: Peer }>> {
        return this.http.request("GET", `/v1/peers/by-connection/${connectionId}`);
    }

    /**
     * An agent's own peer context, resolved from its platform connection.
     * An agent may only ask for its own.
     */
    async getAgentContext(
        agentId: string,
        budget?: number,
    ): Promise<OneclawResponse<PeerContextResponse & { peer_id: string }>> {
        const qs = budget ? `?budget=${budget}` : "";
        return this.http.request("GET", `/v1/agents/${agentId}/peer-context${qs}`);
    }
}
