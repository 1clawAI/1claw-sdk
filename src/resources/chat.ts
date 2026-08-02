import type { HttpClient } from "../core/http";
import type {
    SendChatMessageRequest,
    SendChatMessageResponse,
    ChatConversationResponse,
    ChatConversationListResponse,
    ConversationDetailResponse,
    OneclawResponse,
} from "../types";

/**
 * Agent Chat — send messages to agents via Shroud LLM,
 * manage conversations, and retrieve message history.
 */
export class ChatResource {
    constructor(private readonly http: HttpClient) {}

    /**
     * Send a message to an agent and receive a response.
     * The message is routed through Shroud LLM for processing.
     */
    async sendMessage(
        agentId: string,
        data: SendChatMessageRequest,
    ): Promise<OneclawResponse<SendChatMessageResponse>> {
        return this.http.request<SendChatMessageResponse>(
            "POST",
            `/v1/agents/${agentId}/chat`,
            { body: data },
        );
    }

    /**
     * Send a message and return the raw Response for SSE streaming.
     * The caller is responsible for reading the event stream.
     */
    async sendMessageStream(
        agentId: string,
        data: SendChatMessageRequest,
    ): Promise<Response> {
        return this.http.rawRequest("POST", `/v1/agents/${agentId}/chat`, {
            body: data,
            headers: { Accept: "text/event-stream" },
        });
    }

    /** List all conversations for an agent. */
    async listConversations(
        agentId: string,
    ): Promise<OneclawResponse<ChatConversationListResponse>> {
        return this.http.request<ChatConversationListResponse>(
            "GET",
            `/v1/agents/${agentId}/chat/conversations`,
        );
    }

    /** Get a conversation with its messages. */
    async getConversation(
        agentId: string,
        conversationId: string,
    ): Promise<OneclawResponse<ConversationDetailResponse>> {
        return this.http.request<ConversationDetailResponse>(
            "GET",
            `/v1/agents/${agentId}/chat/conversations/${conversationId}`,
        );
    }

    /** Archive (delete) a conversation. */
    async deleteConversation(
        agentId: string,
        conversationId: string,
    ): Promise<OneclawResponse<void>> {
        return this.http.request<void>(
            "DELETE",
            `/v1/agents/${agentId}/chat/conversations/${conversationId}`,
        );
    }
}
