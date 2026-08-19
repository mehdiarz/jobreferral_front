import { apiClient } from "../../libs/api";
import type {
  PropertyAppraisalInputDto,
  PropertyAppraisalOutputDto,
} from "./types";

export async function createPropertyAppraisal(
  body: PropertyAppraisalInputDto,
): Promise<PropertyAppraisalOutputDto> {
  const res = await apiClient.request<{ result: PropertyAppraisalOutputDto }>(
    "/services/app/PropertyAppraisalCrud/Create",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
  return (res as any)?.result ?? res;
}
