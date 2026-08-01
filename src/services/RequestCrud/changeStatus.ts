import { apiClient } from "../../libs/api";

export interface ChangeStatusBody {
  statusCode: number;
  requestId: number;
}

export async function changeRequestStatus(
  body: ChangeStatusBody,
): Promise<any> {
  return apiClient.request<any>("/services/app/RequestCrud/ChangeStatus", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
