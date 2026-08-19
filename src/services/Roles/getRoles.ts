import { apiClient } from "../../libs/api";

export interface GetRolesItem {
  id: number;
  name: string;
  displayName: string;
  isStatic: boolean;
  isDefault: boolean;
  creationTime: string;
}

interface GetRolesResponse {
  result?: {
    items?: GetRolesItem[];
  };
  success: boolean;
  error?: {
    message?: string;
    details?: string;
  };
}

export interface GetRolesParams {
  permission?: string;
}

export async function getRoles(
  params: GetRolesParams = {},
): Promise<GetRolesItem[]> {
  const permission = params.permission?.trim();

  const queryString = permission
    ? `?${new URLSearchParams({ Permission: permission }).toString()}`
    : "";

  const res = await apiClient.request<GetRolesResponse>(
    `/services/app/Role/GetRoles${queryString}`,
    { method: "GET" },
  );

  return res?.result?.items ?? [];
}
