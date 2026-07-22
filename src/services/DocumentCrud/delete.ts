import { apiClient } from "../../libs/api";

export async function deleteDocument(id: number): Promise<any> {
  return apiClient.request<any>("/services/app/DocumentCrud/Remove", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}
