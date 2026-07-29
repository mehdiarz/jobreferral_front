import { apiClient } from "../../libs/api";
import type { StatusManagementItem } from "./types";
export async function getStatusManagement(
  id: number,
): Promise<StatusManagementItem> {
  return apiClient.request<StatusManagementItem>(
    `/services/app/StatusManagement/Get?Id=${id}`,
    { method: "GET" },
  );
}
