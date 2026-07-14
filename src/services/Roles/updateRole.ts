import { apiClient } from "../../libs/api";

export interface UpdateRoleBody {
    id: number;
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

export async function updateRole(body: UpdateRoleBody): Promise<AbpResponse> {
    return apiClient.request<AbpResponse>("/services/app/Role/Update", {
        method: "POST",
        body: JSON.stringify(body),
    });
}
