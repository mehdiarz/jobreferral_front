import { apiClient } from "../../libs/api";
import type { CreateStatusManagementBody, StatusManagementItem } from "./types";
export async function createStatusManagement(
  body: CreateStatusManagementBody,
): Promise<StatusManagementItem> {
  return apiClient.request<StatusManagementItem>(
    "/services/app/StatusManagement/Create",
    { method: "POST", body: JSON.stringify({ id: 0, ...body }) },
  );
}
