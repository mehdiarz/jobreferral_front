import { apiClient } from "../../libs/api";

export async function deleteRequestAssignedJudicialExpert(
  id: number,
): Promise<any> {
  return apiClient.request<any>(
    "/services/app/RequestAssignedJudicialExpert/Remove",
    {
      method: "POST",
      body: JSON.stringify({ id }),
    },
  );
}
