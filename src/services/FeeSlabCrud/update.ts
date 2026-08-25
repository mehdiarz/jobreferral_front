import { apiClient } from "../../libs/api";
import type { AbpResponse, FeeSlabItem, UpdateFeeSlabBody } from "./types";

export async function updateFeeSlab(
  body: UpdateFeeSlabBody,
): Promise<FeeSlabItem> {
  const response = await apiClient.request<AbpResponse<FeeSlabItem>>(
    "/services/app/FeeSlabCrud/Edit",
    {
      method: "POST",
      body: JSON.stringify({
        id: body.id,
        titleFa: body.titleFa.trim(),
        fromAmount: body.fromAmount ?? 0,
        toAmount: body.toAmount ?? null,
        rate: body.rate ?? 0,
        fixedAmount: body.fixedAmount ?? null,
        order: body.order ?? 0,
        descriptionFa: body.descriptionFa?.trim() || null,
        isActive: body.isActive ?? true,
      }),
    },
  );

  return response.result;
}
