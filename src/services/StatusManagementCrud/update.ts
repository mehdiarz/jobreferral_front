import { apiClient } from "../../libs/api";
import type { EditStatusManagementBody, StatusManagementItem } from "./types";
export async function editStatusManagement(
  body: EditStatusManagementBody,
): Promise<StatusManagementItem> {
  return apiClient.request<StatusManagementItem>(
    "/services/app/StatusManagement/Edit",
    { method: "POST", body: JSON.stringify(body) },
  );
}
