import { apiClient } from "../../libs/api";
import type { RequestItem } from "./types";

export async function getRequest(id: number): Promise<RequestItem> {
  return apiClient.request<RequestItem>(
    `/services/app/RequestCrud/Get?Id=${id}`,
    { method: "GET" },
  );
}
