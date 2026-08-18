import type { HttpClient } from "../core/http.js";

export interface EnvVar {
  id: string;
  key: string;
  environments: string[];
  git_branch?: string;
  sensitive: boolean;
  comment?: string;
  value?: string;
  version: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEnvVarRequest {
  key: string;
  value: string;
  environments?: string[];
  git_branch?: string;
  sensitive?: boolean;
  comment?: string;
}

export interface UpdateEnvVarRequest {
  value?: string;
  environments?: string[];
  sensitive?: boolean;
  comment?: string;
}

export interface EnvVarListResponse {
  env_vars: EnvVar[];
}

export interface ResolveEnvVarsResponse {
  vars: Record<string, string>;
  sources: Record<string, string>;
  environment: string;
  git_branch?: string;
  resolved_at: string;
}

export class EnvVarsResource {
  constructor(private http: HttpClient) {}

  async list(vaultId: string, environment?: string) {
    const params = environment ? `?environment=${environment}` : "";
    return this.http.request<EnvVarListResponse>(
      "GET",
      `/v1/vaults/${vaultId}/env-vars${params}`,
    );
  }

  async create(vaultId: string, data: CreateEnvVarRequest) {
    return this.http.request<EnvVar>("POST", `/v1/vaults/${vaultId}/env-vars`, {
      body: data,
    });
  }

  async get(vaultId: string, key: string, environment?: string) {
    const params = environment ? `?environment=${environment}` : "";
    return this.http.request<EnvVar>(
      "GET",
      `/v1/vaults/${vaultId}/env-vars/${encodeURIComponent(key)}${params}`,
    );
  }

  async update(
    vaultId: string,
    key: string,
    data: UpdateEnvVarRequest,
    environment?: string,
  ) {
    const params = environment ? `?environment=${environment}` : "";
    return this.http.request<EnvVar>(
      "PATCH",
      `/v1/vaults/${vaultId}/env-vars/${encodeURIComponent(key)}${params}`,
      { body: data },
    );
  }

  async delete(vaultId: string, key: string, environment?: string) {
    const params = environment ? `?environment=${environment}` : "";
    return this.http.request<void>(
      "DELETE",
      `/v1/vaults/${vaultId}/env-vars/${encodeURIComponent(key)}${params}`,
    );
  }

  async resolve(vaultId: string, environment?: string, gitBranch?: string) {
    const params: string[] = [];
    if (environment) params.push(`environment=${encodeURIComponent(environment)}`);
    if (gitBranch) params.push(`git_branch=${encodeURIComponent(gitBranch)}`);
    const qs = params.length > 0 ? `?${params.join("&")}` : "";
    return this.http.request<ResolveEnvVarsResponse>(
      "GET",
      `/v1/vaults/${vaultId}/env-vars/resolve${qs}`,
    );
  }
}
