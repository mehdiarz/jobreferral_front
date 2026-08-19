import { apiClient } from "../../libs/api";

export interface UserActionBody {
  accepted?: boolean | null;
  requestId: number;
}

export async function userAction(body: UserActionBody): Promise<void> {
  await apiClient.request<void>("/services/app/RequestCrud/UserAction", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
