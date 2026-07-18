import { apiClient } from "../../libs/api";

export async function deletePersonalType(id: number): Promise<any> {
  return apiClient.request<any>("/services/app/PersonalType/Remove", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}
