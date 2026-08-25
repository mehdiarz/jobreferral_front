import { apiClient } from "../../libs/api";
import type { AbpResponse, CreateFeeSlabBody, FeeSlabItem } from "./types";

export async function createFeeSlab(
  body: CreateFeeSlabBody,
): Promise<FeeSlabItem> {
  const response = await apiClient.request<AbpResponse<FeeSlabItem>>(
    "/services/app/FeeSlabCrud/Create",
    {
      method: "POST",
      body: JSON.stringify({
        id: 0,
        feeType: body.feeType.trim(),
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
