import { apiClient } from "../../libs/api";
import type { AbpResponse } from "./types";

export async function deleteRequestAssignedJudicialExpert(
  id: number,
): Promise<boolean> {
  await apiClient.request<AbpResponse<void> | void>(
    "/services/app/RequestAssignedJudicialExpert/Remove",
    {
      method: "POST",
      body: JSON.stringify({ id }),
    },
  );
  return true;
}
