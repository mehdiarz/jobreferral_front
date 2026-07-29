import { apiClient } from "../../libs/api";

export interface UserInfo {
  userName: string;
  name: string;
  surname: string;
  fullName: string;
  roleNames: string[];
  id: number;
}

export async function getUserById(id: number): Promise<UserInfo> {
  const res = await apiClient.request<any>(`/services/app/User/Get?Id=${id}`, {
    method: "GET",
  });
  return res?.result ?? res;
}
