import type { HttpClient } from "../core/http";
import type {
    CreateChannelRequest,
    ChannelResponse,
    ChannelListResponse,
    UpdateChannelRequest,
    SendChannelMessageRequest,
    ChannelMessageResponse,
    ChannelMessageListResponse,
    OneclawResponse,
} from "../types";

/**
 * Agent Channels — register external messaging channels
 * (Telegram, WhatsApp, Discord) and send/receive messages.
 */
export class ChannelsResource {
    constructor(private readonly http: HttpClient) {}

    /** Register a new messaging channel for an agent. */
    async create(
        agentId: string,
        data: CreateChannelRequest,
    ): Promise<OneclawResponse<ChannelResponse>> {
        return this.http.request<ChannelResponse>(
            "POST",
            `/v1/agents/${agentId}/channels`,
            { body: data },
        );
    }

    /** List all channels for an agent. */
    async list(
        agentId: string,
    ): Promise<OneclawResponse<ChannelListResponse>> {
        return this.http.request<ChannelListResponse>(
            "GET",
            `/v1/agents/${agentId}/channels`,
        );
    }

    /** Update a channel's name, active status, or config. */
    async update(
        agentId: string,
        channelId: string,
        data: UpdateChannelRequest,
    ): Promise<OneclawResponse<ChannelResponse>> {
        return this.http.request<ChannelResponse>(
            "PATCH",
            `/v1/agents/${agentId}/channels/${channelId}`,
            { body: data },
        );
    }

    /** Delete a channel. */
    async delete(
        agentId: string,
        channelId: string,
    ): Promise<OneclawResponse<void>> {
        return this.http.request<void>(
            "DELETE",
            `/v1/agents/${agentId}/channels/${channelId}`,
        );
    }

    /** Send an outbound message via a channel. */
    async sendMessage(
        agentId: string,
        channelId: string,
        data: SendChannelMessageRequest,
    ): Promise<OneclawResponse<ChannelMessageResponse>> {
        return this.http.request<ChannelMessageResponse>(
            "POST",
            `/v1/agents/${agentId}/channels/${channelId}/send`,
            { body: data },
        );
    }

    /** List message history for a channel. */
    async listMessages(
        agentId: string,
        channelId: string,
        limit?: number,
    ): Promise<OneclawResponse<ChannelMessageListResponse>> {
        const qs = limit ? `?limit=${limit}` : "";
        return this.http.request<ChannelMessageListResponse>(
            "GET",
            `/v1/agents/${agentId}/channels/${channelId}/messages${qs}`,
        );
    }
}
