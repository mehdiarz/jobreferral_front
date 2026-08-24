import { apiClient } from "../../libs/api";
import type { BranchItem, EditBranchBody } from "./types";

export async function editBranch(body: EditBranchBody): Promise<BranchItem> {
  return apiClient.request<BranchItem>("/services/app/BranchCrud/Edit", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
