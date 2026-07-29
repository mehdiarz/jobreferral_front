import { apiClient } from "../../libs/api";

export async function deleteRequestHistory(id: number): Promise<any> {
  return apiClient.request<any>("/services/app/RequestHistoryCrud/Remove", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}
