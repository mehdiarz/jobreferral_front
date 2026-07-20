import { apiClient } from "../../libs/api";

export interface AbpResponse {
  result?: unknown;
  success: boolean;
  error?: { message?: string; details?: string };
}

export async function deleteUser(id: number): Promise<AbpResponse> {
  return apiClient.request<AbpResponse>("/services/app/User/Remove", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}
