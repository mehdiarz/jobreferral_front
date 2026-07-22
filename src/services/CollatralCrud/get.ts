import { apiClient } from "../../libs/api";
import type { CollatralItem } from "./types";

export async function getCollatral(id: number): Promise<CollatralItem> {
  return apiClient.request<CollatralItem>(
    `/services/app/CollatralCrud/Get?Id=${id}`,
    { method: "GET" },
  );
}
