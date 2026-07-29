import { apiClient } from "../../libs/api";
import type { RequestStatusItem } from "./types";

export async function getRequestStatusByCode(
  code: number,
): Promise<RequestStatusItem> {
  const res = await apiClient.request<any>(
    `/services/app/RequestStatusCrud/GetByCode?code=${code}`,
    { method: "GET" },
  );
  return res?.result ?? res;
}
