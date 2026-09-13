import { describe, it, expect, vi, afterEach } from "vitest";
import { HttpClient } from "../core/http";
import { OtelResource, frameToEvent, parseSseFrames, readSseEvents } from "../resources/otel";
import { PlatformResource } from "../resources/platform";

const BASE = "https://api.test";
const originalFetch = globalThis.fetch;

function mockFetch(status: number, body: unknown) {
    return vi.fn().mockResolvedValue({
        ok: status >= 200 && status < 300,
        status,
        headers: new Headers(),
        json: () => Promise.resolve(body),
    } as unknown as Response);
}
function lastCall() {
    const f = globalThis.fetch as ReturnType<typeof vi.fn>;
    return { url: f.mock.calls[0][0] as string, init: f.mock.calls[0][1] as RequestInit };
}
afterEach(() => {
    globalThis.fetch = originalFetch;
});

describe("parseSseFrames", () => {
    it("splits complete frames and keeps the partial tail", () => {
        const { frames, rest } = parseSseFrames(
            'event: signal\nid: 7\ndata: {"a":1}\n\n:ping\n\nevent: gap\ndata: {"skipped":3}\n\nevent: sig',
        );
        expect(frames).toEqual([
            { event: "signal", id: "7", data: '{"a":1}' },
            { event: "gap", id: undefined, data: '{"skipped":3}' },
        ]);
        expect(rest).toBe("event: sig");
    });
    it("joins multi-line data, tolerates CRLF, and drops data-less frames", () => {
        const { frames } = parseSseFrames("data: a\r\ndata: b\r\n\r\nevent: x\n\n");
        expect(frames).toEqual([{ event: "message", id: undefined, data: "a\nb" }]);
    });
});

describe("frameToEvent", () => {
    it("maps signal frames with the id from the frame, falling back to event_id", () => {
        expect(frameToEvent({ event: "signal", id: "9", data: '{"event_id":1,"name":"n"}' })).toEqual({
            type: "signal",
            id: 9,
            signal: { event_id: 1, name: "n" },
        });
        expect(frameToEvent({ event: "message", data: '{"event_id":4,"name":"n"}' })?.id).toBe(4);
    });
    it("maps gap frames and ignores unknown events and bad JSON", () => {
        expect(frameToEvent({ event: "gap", data: '{"skipped":2,"reconnect_topology":true}' })).toEqual({
            type: "gap",
            skipped: 2,
            reconnect_topology: true,
        });
        expect(frameToEvent({ event: "weird", data: "{}" })).toBeNull();
        expect(frameToEvent({ event: "signal", data: "not json" })).toBeNull();
    });
});

describe("readSseEvents", () => {
    it("yields events across chunk boundaries", async () => {
        const enc = new TextEncoder();
        const chunks = ['event: signal\nid: 1\ndata: {"event_', 'id":1,"name":"a"}\n\nevent: gap\ndata: {"missed":true}\n\n'];
        const body = new ReadableStream<Uint8Array>({
            start(c) {
                for (const ch of chunks) c.enqueue(enc.encode(ch));
                c.close();
            },
        });
        const out = [];
        for await (const ev of readSseEvents({ body } as unknown as Response)) out.push(ev);
        expect(out.map((e) => e.type)).toEqual(["signal", "gap"]);
    });
});

describe("OtelResource", () => {
    it("hits the org-wide routes with the expected queries", async () => {
        const http = new HttpClient({ baseUrl: BASE, token: "t" });
        const otel = new OtelResource(http);
        globalThis.fetch = mockFetch(200, {});
        await otel.threats("all");
        expect(lastCall().url).toBe(`${BASE}/v1/otel/threats?state=all`);
        globalThis.fetch = mockFetch(200, {});
        await otel.metrics("24h", "1h");
        expect(lastCall().url).toBe(`${BASE}/v1/otel/metrics?window=24h&step=1h`);
        globalThis.fetch = mockFetch(200, {});
        await otel.agentTrust("a-1");
        expect(lastCall().url).toBe(`${BASE}/v1/otel/agents/a-1/trust`);
    });
    it("stream sends Accept, bearer and Last-Event-ID, and throws on a non-2xx", async () => {
        const http = new HttpClient({ baseUrl: BASE, token: "t" });
        const otel = new OtelResource(http);
        globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 403, body: null } as unknown as Response);
        const it = otel.stream({ lastEventId: 41 });
        await expect(it.next()).rejects.toThrow(/HTTP 403/);
        const { url, init } = lastCall();
        expect(url).toBe(`${BASE}/v1/otel/stream`);
        const h = init.headers as Record<string, string>;
        expect(h.Accept).toBe("text/event-stream");
        expect(h.Authorization).toBe("Bearer t");
        expect(h["Last-Event-ID"]).toBe("41");
    });
});

describe("PlatformResource otel", () => {
    it("scopes every call to the connection", async () => {
        const http = new HttpClient({ baseUrl: BASE, token: "plt_x" });
        const p = new PlatformResource(http);
        globalThis.fetch = mockFetch(200, {});
        await p.getConnectionOtelSummary("c-1");
        expect(lastCall().url).toBe(`${BASE}/v1/platform/connections/c-1/otel/summary`);
        globalThis.fetch = mockFetch(200, []);
        await p.getConnectionOtelThreats("c-1");
        expect(lastCall().url).toBe(`${BASE}/v1/platform/connections/c-1/otel/threats?state=open`);
        globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404, body: null } as unknown as Response);
        await expect(p.connectionOtelStream("c-1").next()).rejects.toThrow(/HTTP 404/);
        expect(lastCall().url).toBe(`${BASE}/v1/platform/connections/c-1/otel/stream`);
    });
});
