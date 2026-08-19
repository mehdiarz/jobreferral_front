import { apiClient } from "../../libs/api";
import type { RequestItem } from "./types";

interface GetRequestResponse {
  result?: RequestItem;
}

export async function getRequest(id: number): Promise<RequestItem> {
  const searchParams = new URLSearchParams({
    Id: String(id),
  });

  const response = await apiClient.request<GetRequestResponse>(
    `/services/app/RequestCrud/Get?${searchParams.toString()}`,
    {
      method: "GET",
    },
  );

  return response?.result ?? (response as unknown as RequestItem);
}
