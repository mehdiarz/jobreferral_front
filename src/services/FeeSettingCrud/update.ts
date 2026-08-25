import { apiClient } from "../../libs/api";
import type {
  AbpResponse,
  FeeSettingItem,
  UpdateFeeSettingBody,
} from "./types";

export async function updateFeeSetting(
  body: UpdateFeeSettingBody,
): Promise<FeeSettingItem> {
  const response = await apiClient.request<AbpResponse<FeeSettingItem>>(
    "/services/app/FeeSettingCrud/Edit",
    {
      method: "POST",
      body: JSON.stringify({
        id: body.id,
        titleFa: body.titleFa.trim(),
        value: body.value,
        unitFa: body.unitFa.trim(),
        descriptionFa: body.descriptionFa?.trim() || null,
        displayOrder: body.displayOrder ?? 0,
        isActive: body.isActive ?? true,
      }),
    },
  );

  return response.result;
}
