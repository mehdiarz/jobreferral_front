import { apiClient } from "../../libs/api";
import type { PropertyAppraisalOutputDto } from "./types";

export async function getPropertyAppraisalByRequestId(
  requestId: number,
): Promise<PropertyAppraisalOutputDto | null> {
  const res = await apiClient.request<{ result: PropertyAppraisalOutputDto }>(
    `/services/app/PropertyAppraisalCrud/GetByRequestId?Id=${requestId}`,
    { method: "GET" },
  );
  return (res as any)?.result ?? null;
}
