import { apiClient } from "../../libs/api";
import type { BranchItem } from "./types";

export async function getBranchByCode(branchCode: number): Promise<BranchItem> {
  return apiClient.request<BranchItem>(
    `/services/app/BranchCrud/GetByCode?BranchCode=${branchCode}`,
    {
      method: "GET",
    },
  );
}
