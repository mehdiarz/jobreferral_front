import { apiClient } from "../../libs/api";

export async function deleteRequestComment(id: number): Promise<any> {
  return apiClient.request<any>("/services/app/RequestComment/Remove", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}
