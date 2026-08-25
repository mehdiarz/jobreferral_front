import { apiClient } from "../../libs/api";
import type {
  AbpResponse,
  CreateFeeSettingBody,
  FeeSettingItem,
} from "./types";

export async function createFeeSetting(
  body: CreateFeeSettingBody,
): Promise<FeeSettingItem> {
  const response = await apiClient.request<AbpResponse<FeeSettingItem>>(
    "/services/app/FeeSettingCrud/Create",
    {
      method: "POST",
      body: JSON.stringify({
        id: 0,
        code: body.code?.trim() || null,
        titleFa: body.titleFa.trim(),
        feeType: body.feeType.trim(),
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
