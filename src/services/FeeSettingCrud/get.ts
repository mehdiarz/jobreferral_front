import { apiClient } from "../../libs/api";
import type { AbpResponse, FeeSettingItem } from "./types";

export async function getFeeSetting(id: number): Promise<FeeSettingItem> {
  const response = await apiClient.request<AbpResponse<FeeSettingItem>>(
    `/services/app/FeeSettingCrud/Get?Id=${id}`,
    {
      method: "GET",
    },
  );

  return response.result;
}
