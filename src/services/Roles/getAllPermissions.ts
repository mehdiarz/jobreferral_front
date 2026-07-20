import { apiClient } from "../../libs/api";

export interface PermissionItem {
  name: string;
  displayName: string;
  description: string | null;
  id: number;
}

export interface GetAllPermissionsResponse {
  result: {
    items: PermissionItem[];
  };
  success: boolean;
}

export async function getAllPermissions(): Promise<PermissionItem[]> {
  const res = await apiClient.request<GetAllPermissionsResponse>(
    "/services/app/Role/GetAllPermissions",
    { method: "GET" }
  );
  return res?.result?.items ?? [];
}
