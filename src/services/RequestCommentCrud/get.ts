import { apiClient } from "../../libs/api";
import type { RequestCommentItem } from "./types";

export async function getRequestComment(
  id: number,
): Promise<RequestCommentItem> {
  return apiClient.request<RequestCommentItem>(
    `/services/app/RequestComment/Get?Id=${id}`,
    { method: "GET" },
  );
}
