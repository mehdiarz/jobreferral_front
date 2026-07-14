import { apiClient } from "../../libs/api";

export interface CreateRoleBody {
    name: string;
    displayName: string;
    normalizedName: string;
    description: string;
    grantedPermissions: string[];
}

export interface AbpResponse {
    result?: unknown;
    success: boolean;
    error?: { message?: string; details?: string };
}

export async function createRole(body: CreateRoleBody): Promise<AbpResponse> {
    return apiClient.request<AbpResponse>("/services/app/Role/Create", {
        method: "POST",
        body: JSON.stringify(body),
    });
}
