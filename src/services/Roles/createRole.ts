import { apiClient } from "../../libs/api";

export interface CreateRoleBody {
  name: string;
  displayName: string;
  normalizedName?: string | null;
  description?: string | null;
  grantedPermissions?: string[] | null;
  roleCode?: string | null;
}

export interface AbpResponse<T = unknown> {
  result?: T;
  success: boolean;
  error?: {
    message?: string;
    details?: string;
  };
}

export interface RoleItem {
  id: number;
  name: string;
  displayName: string;
  normalizedName?: string | null;
  description?: string | null;
  grantedPermissions?: string[] | null;
  roleCode?: string | null;
}

export async function createRole(
  body: CreateRoleBody,
): Promise<AbpResponse<RoleItem>> {
  return apiClient.request<AbpResponse<RoleItem>>("/services/app/Role/Create", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
