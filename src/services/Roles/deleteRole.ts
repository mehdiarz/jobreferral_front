import { apiClient } from "../../libs/api";

export interface AbpResponse {
    result?: unknown;
    success: boolean;
    error?: { message?: string; details?: string };
}

export async function deleteRole(id: number): Promise<AbpResponse> {
    return apiClient.request<AbpResponse>("/services/app/Role/Delete", {
        method: "POST",
        body: JSON.stringify({ id }),
    });
}
