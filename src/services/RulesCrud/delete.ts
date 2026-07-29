import { apiClient } from "../../libs/api";

export async function deleteRules(id: number): Promise<any> {
  return apiClient.request<any>("/services/app/Rules/Remove", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}
