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
  const res = await apiClient.request<GetAllUsersResponse>(
    "/services/app/User/GetAll",
    { method: "GET" }
  );
  const result = res?.result;
  return {
    items: result?.items ?? [],
    totalCount: result?.totalCount ?? 0,
  };
}
