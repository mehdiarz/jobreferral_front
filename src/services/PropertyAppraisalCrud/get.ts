import { apiClient } from "../../libs/api";
import type { PropertyAppraisalOutputDto } from "./types";

export async function getPropertyAppraisal(
  id: number,
): Promise<PropertyAppraisalOutputDto> {
  const res = await apiClient.request<{ result: PropertyAppraisalOutputDto }>(
    `/services/app/PropertyAppraisalCrud/Get?Id=${id}`,
    { method: "GET" },
  );
  return (res as any)?.result ?? res;
}
