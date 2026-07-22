import { apiClient } from "../../libs/api";

export async function deleteCollatral(id: number): Promise<any> {
  return apiClient.request<any>("/services/app/CollatralCrud/Remove", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}
