import { apiClient } from "../../libs/api";

export async function deleteRequest(id: number): Promise<any> {
  return apiClient.request<any>("/services/app/RequestCrud/Remove", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}
