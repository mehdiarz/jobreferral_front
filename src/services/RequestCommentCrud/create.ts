import { apiClient } from "../../libs/api";
import type { CreateRequestCommentBody, RequestCommentItem } from "./types";

export async function createRequestComment(
  body: CreateRequestCommentBody,
): Promise<RequestCommentItem> {
  return apiClient.request<RequestCommentItem>(
    "/services/app/RequestComment/Create",
    {
      method: "POST",
      body: JSON.stringify({ id: 0, ...body }),
    },
  );
}
