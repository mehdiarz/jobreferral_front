import { apiClient } from "../../libs/api";

export interface UpdateRoleBody {
  id: number;
  name: string;
  displayName: string;
  normalizedName?: string | null;
  roleCode?: string | null;
  description?: string | null;
  grantedPermissions?: string[] | null;
}

export interface AbpResponse {
  result?: unknown;
  success: boolean;
  error?: {
    message?: string;
    details?: string;
  };
}

export async function updateRole(body: UpdateRoleBody): Promise<AbpResponse> {
  return apiClient.request<AbpResponse>("/services/app/Role/Edit", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
