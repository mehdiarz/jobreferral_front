import { apiClient } from "../../libs/api";

export interface ChangeStatusBody {
  statusCode: number;
  requestId: number;
}

export interface ChangeStatusResponse {
  result?: {
    requestId?: number;
    statusCode?: number;
    statusTitle?: string;
  };
}

export async function changeRequestStatus(
  body: ChangeStatusBody,
): Promise<ChangeStatusResponse> {
  return apiClient.request<ChangeStatusResponse>(
    "/services/app/RequestCrud/ChangeStatus",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}
