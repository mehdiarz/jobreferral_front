import { apiClient } from "../../libs/api";

export interface UpdateUserBody {
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

export interface AbpResponse {
  result?: unknown;
  success: boolean;
  error?: { message?: string; details?: string };
}

export async function updateUser(body: UpdateUserBody): Promise<AbpResponse> {
  return apiClient.request<AbpResponse>("/services/app/User/Edit", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
