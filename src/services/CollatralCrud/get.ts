import { apiClient } from "../../libs/api";
import type { CollatralItem } from "./types";

export async function getCollatral(id: number): Promise<CollatralItem> {
  const res = await apiClient.request<
    { result?: CollatralItem } | CollatralItem
  >(`/services/app/CollatralCrud/Get?Id=${id}`, { method: "GET" });

  return (res as any)?.result ?? res;
}
