import { apiClient } from "../../libs/api";
import type { PropertyAppraisalLookupsDto } from "./types";

export async function getPropertyAppraisalLookups(): Promise<PropertyAppraisalLookupsDto> {
  const res = await apiClient.request<{ result: PropertyAppraisalLookupsDto }>(
    "/services/app/PropertyAppraisalCrud/Lookups",
    { method: "POST" },
  );
  return (res as any)?.result ?? res ?? {};
}
