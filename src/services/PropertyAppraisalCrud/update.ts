import { apiClient } from "../../libs/api";
import type {
  PropertyAppraisalInputDto,
  PropertyAppraisalOutputDto,
} from "./types";

export async function updatePropertyAppraisal(
  body: PropertyAppraisalInputDto & { id: number },
): Promise<PropertyAppraisalOutputDto> {
  const res = await apiClient.request<{ result: PropertyAppraisalOutputDto }>(
    "/services/app/PropertyAppraisalCrud/Edit",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
  return (res as any)?.result ?? res;
}
