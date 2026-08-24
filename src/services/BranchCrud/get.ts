import { apiClient } from "../../libs/api";
import type { BranchItem } from "./types";

export async function getBranch(id: number): Promise<BranchItem> {
  return apiClient.request<BranchItem>(
    `/services/app/BranchCrud/Get?Id=${id}`,
    {
      method: "GET",
    },
  );
}
