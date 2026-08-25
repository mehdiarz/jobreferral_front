import { apiClient } from "../../libs/api";

export async function deleteFeeSetting(id: number): Promise<void> {
  await apiClient.request<unknown>("/services/app/FeeSettingCrud/Remove", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}
