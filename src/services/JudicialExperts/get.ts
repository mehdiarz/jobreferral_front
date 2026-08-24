import { apiClient } from "../../libs/api";
import type { ExpertItem } from "./types";

export async function getExpert(id: number): Promise<ExpertItem> {
  const response = await apiClient.request<
    ExpertItem | { result?: ExpertItem | null }
  >(
    `/services/app/JudicialExpertCrud/Get?Id=${id}`,
    {
      method: "GET",
    },
  );

  if (
    response &&
    typeof response === "object" &&
    "result" in response &&
    response.result
  ) {
    return response.result;
  }

  return response as ExpertItem;
}
