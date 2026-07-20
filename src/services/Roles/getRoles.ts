import { apiClient } from "../../libs/api";

export interface GetRolesItem {
  id: number;
  name: string;
  displayName: string;
  isStatic: boolean;
  isDefault: boolean;
  creationTime: string;
}

export interface GetRolesResponse {
  result: { items: GetRolesItem[] };
  success: boolean;
}

export async function getRoles(): Promise<GetRolesItem[]> {
  const res = await apiClient.request<GetRolesResponse>(
    "/services/app/Role/GetRoles",
    { method: "GET" }
  );
  return res?.result?.items ?? [];
}
