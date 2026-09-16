import { apiClient } from "../../libs/api";

export interface UserItem {
  id: number;
  userName: string;
  name: string;
  surname: string;
  emailAddress: string;
  isActive: boolean;
  fullName: string;
  lastLoginTime: string | null;
  creationTime: string;
  roleNames: string[];
  roles: string[];
}

export interface GetAllUsersResponse {
  result: { items: UserItem[]; totalCount: number };
  success: boolean;
}

export async function getAllUsers(): Promise<{
  items: UserItem[];
  totalCount: number;
}> {
  return getAllUsersPaged();
}

export async function getAllUsersPaged(params?: { skipCount?: number; maxResultCount?: number }): Promise<{
  items: UserItem[];
  totalCount: number;
}> {
  const searchParams = new URLSearchParams();
  if (typeof params?.skipCount === "number") searchParams.set("SkipCount", String(params.skipCount));
  if (typeof params?.maxResultCount === "number") searchParams.set("MaxResultCount", String(params.maxResultCount));
  const query = searchParams.toString();
  const res = await apiClient.request<GetAllUsersResponse>(
    `/services/app/User/GetAll${query ? `?${query}` : ""}`,
    { method: "GET" }
  );
  const result = res?.result;
  return {
    items: result?.items ?? [],
    totalCount: result?.totalCount ?? 0,
  };
}
