import { apiClient } from "../../libs/api";
import type { BranchItem, CreateBranchBody } from "./types";

export async function createBranch(
  body: CreateBranchBody,
): Promise<BranchItem> {
  return apiClient.request<BranchItem>("/services/app/BranchCrud/Create", {
    method: "POST",
    body: JSON.stringify({
      id: 0,
      ...body,
    }),
  });
}
