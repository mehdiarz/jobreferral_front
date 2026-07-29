import { apiClient } from "../../libs/api";

export async function deleteRequestStatus(id: number): Promise<any> {
  return apiClient.request<any>("/services/app/RequestStatusCrud/Remove", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}
