import { apiClient } from "../../libs/api";
export async function deleteStatusManagement(id: number): Promise<any> {
  return apiClient.request<any>("/services/app/StatusManagement/Remove", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}
