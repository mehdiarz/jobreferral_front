import { apiClient } from "../../libs/api";

export async function deleteRequestHistoryStatus(id: number): Promise<any> {
  return apiClient.request<any>("/services/app/RequestHistoryStatus/Remove", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}
