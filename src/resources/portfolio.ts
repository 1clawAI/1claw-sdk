import type { HttpClient } from "../core/http";
import type {
    PortfolioResponse,
    OneclawResponse,
} from "../types";

export interface PortfolioParams {
    chains?: string;
    include_tokens?: boolean;
}

export class PortfolioResource {
    constructor(private readonly http: HttpClient) {}

    async get(params?: PortfolioParams): Promise<OneclawResponse<PortfolioResponse>> {
        const query = new URLSearchParams();
        if (params?.chains) query.set("chains", params.chains);
        if (params?.include_tokens) query.set("include_tokens", "true");
        const qs = query.toString();
        return this.http.request<PortfolioResponse>("GET", `/v1/portfolio${qs ? `?${qs}` : ""}`);
    }
}
